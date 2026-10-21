import { beforeEach, describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';

const script = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const assets = JSON.parse(script.match(/const ASSETS = (.*);/)[1]);
// Freeze the deployed asset fixture once. Hash checks also catch a stale generated
// worker accidentally committed after changing the UI or curriculum.
const fixture = new Map(await Promise.all(assets.map(async asset => {
  const bytes = await readFile(new URL('../public' + asset.url, import.meta.url));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.hash);
  return [asset.url, bytes];
})));

function workerHarness() {
  const handlers = {};
  const stores = new Map();
  const broadcasts = [];
  let failedUrl = '';
  let corruptedUrl = '';
  const cache = name => ({
    async match(path) {
      const item = stores.get(name).get(path);
      return item ? new Response(item.bytes.slice(0), { status: item.status, headers: item.headers }) : undefined;
    },
    async put(path, response) {
      stores.get(name).set(path, { bytes: await response.arrayBuffer(), status: response.status, headers: [...response.headers] });
    },
    async delete(path) { return stores.get(name).delete(path); },
  });
  const caches = {
    async open(name) { if (!stores.has(name)) stores.set(name, new Map()); return cache(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const self = {
    location: { origin: 'https://offline.test' },
    clients: {
      async matchAll() { return [{ postMessage: message => broadcasts.push(structuredClone(message)) }]; },
      async claim() {},
    },
    addEventListener: (name, handler) => { handlers[name] = handler; },
    skipWaiting() { throw new Error('An update must wait for the child to close the game.'); },
  };
  vm.runInNewContext(script, {
    self, caches, crypto: webcrypto, Response, Headers, URL, AbortController, Uint8Array, setTimeout, clearTimeout,
    fetch: async url => {
      if (url === failedUrl) throw new Error('Wi-Fi disconnected');
      return new Response(url === corruptedUrl ? 'invalid download' : fixture.get(url), { status: 200 });
    },
  });
  return {
    stores, caches,
    setFailure(url) { failedUrl = url; },
    setCorruption(url) { corruptedUrl = url; },
    state: () => broadcasts.at(-1)?.state,
    currentCache: () => [...stores.keys()].find(name => name.startsWith('hebrew-heroes-assets-') && name !== 'hebrew-heroes-assets-previous'),
    async invoke(name, event = {}) {
      let pending;
      handlers[name]({ ...event, waitUntil: promise => { pending = promise; } });
      await pending;
    },
    async request(path, headers = {}, mode = 'cors') {
      let pending;
      handlers.fetch({ request: { url: 'https://offline.test' + path, method: 'GET', headers: new Headers(headers), mode }, respondWith: promise => { pending = promise; } });
      return await pending;
    },
  };
}

describe('complete offline game cache', () => {
  let worker;
  beforeEach(() => { worker = workerHarness(); });

  test('interrupted or corrupt downloads preserve the previous complete cache, then retry succeeds', async () => {
    await worker.caches.open('hebrew-heroes-assets-previous');
    await worker.caches.open('another-app-cache');
    worker.setFailure(assets.find(asset => asset.url.endsWith('.mp3')).url);
    await expect(worker.invoke('install')).rejects.toThrow('Wi-Fi disconnected');
    expect(worker.state().status).toBe('error');
    expect(worker.stores.has('hebrew-heroes-assets-previous')).toBe(true);
    expect(worker.stores.get(worker.currentCache()).has('/__hebrew_heroes_offline_ready__')).toBe(false);

    worker.setFailure('');
    worker.stores.get(worker.currentCache()).delete('/styles.css');
    worker.setCorruption('/styles.css');
    await expect(worker.invoke('install')).rejects.toThrow('could not be verified');
    expect(worker.state().status).toBe('error');
    worker.setCorruption('');
    await worker.invoke('install');
    expect(worker.state()).toMatchObject({ status: 'ready', completed: assets.length, total: assets.length });
    expect(worker.stores.get(worker.currentCache()).size).toBe(assets.length + 1);
    expect(worker.stores.has('hebrew-heroes-assets-previous')).toBe(true);
    await worker.invoke('activate');
    expect(worker.stores.has('hebrew-heroes-assets-previous')).toBe(false);
    expect(worker.stores.has('another-app-cache')).toBe(true);
  });

  test('cache eviction revokes readiness and explicit retry repairs every missing file', async () => {
    await worker.invoke('install');
    const audio = assets.find(asset => asset.url.endsWith('.mp3'));
    worker.stores.get(worker.currentCache()).delete(audio.url);
    await worker.invoke('message', { data: { type: 'HH_STATUS' }, ports: [] });
    expect(worker.state()).toMatchObject({ status: 'error', completed: assets.length - 1 });
    await worker.invoke('message', { data: { type: 'HH_PREPARE' }, ports: [] });
    expect(worker.state()).toMatchObject({ status: 'ready', completed: assets.length });
    expect(worker.stores.get(worker.currentCache()).has(audio.url)).toBe(true);
  });

  test('the recovery page and script always bypass the game cache', async () => {
    await worker.invoke('install');
    expect(await worker.request('/reset-offline.html')).toBeUndefined();
    expect(await worker.request('/reset-offline.html?check=123')).toBeUndefined();
    expect(await worker.request('/reset-offline.js')).toBeUndefined();
  });

  test('root opens the static game offline and audio accepts iPad byte range requests', async () => {
    await worker.invoke('install');
    const root = await worker.request('/', {}, 'navigate');
    expect(await root.text()).toContain('id="stage"');
    const html = await worker.request('/hebrew-heroes.html', {}, 'navigate');
    expect(await html.text()).toContain('/game.js');
    const audio = assets.find(asset => asset.url.endsWith('.mp3'));
    const range = await worker.request(audio.url, { range: 'bytes=0-99' });
    expect(range.status).toBe(206);
    expect(range.headers.get('content-range')).toBe('bytes 0-99/' + audio.size);
    expect((await range.arrayBuffer()).byteLength).toBe(100);
    const suffix = await worker.request(audio.url, { range: 'bytes=-25' });
    expect((await suffix.arrayBuffer()).byteLength).toBe(25);
    expect((await worker.request(audio.url, { range: 'bytes=99999999-' })).status).toBe(416);
    expect((await worker.request(audio.url, { range: 'bytes=0-1,5-9' })).status).toBe(416);
  });
});
