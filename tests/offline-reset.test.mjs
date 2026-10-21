import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { afterEach, describe, expect, test, vi } from 'vitest';

const root = 'https://heroes.test';
const registration = (scope = '/', worker = '/sw.js') => ({
  scope: root + scope, active: { scriptURL: new URL(worker, root).href },
  unregister: vi.fn(async () => true),
});
async function harness(options = {}) {
  const button = { disabled: false, hidden: false, setAttribute: vi.fn(), addEventListener: vi.fn() };
  const status = { textContent: '' };
  const next = { hidden: true };
  const own = registration();
  const unrelated = registration('/other/', '/other/sw.js');
  const unrelatedRoot = registration('/', '/another-worker.js');
  const foreignScript = registration('/', 'https://another.test/sw.js');
  const registrations = [own, unrelated, unrelatedRoot, foreignScript];
  const caches = {
    keys: vi.fn(async () => ['hebrew-heroes-assets-old', 'hebrew-heroes-assets-new', 'another-app-cache']),
    delete: vi.fn(async () => true),
  };
  const serviceWorker = { getRegistrations: vi.fn(async () => registrations) };
  const fetch = vi.fn(async () => ({ ok: true, text: async () => '<html data-offline-reset>' }));
  const window = { location: { origin: root }, caches };
  const navigator = { onLine: true, serviceWorker };
  const progress = new Map([['hebrew-heroes-progress', '{"coins":42}']]);
  Object.assign(navigator, options.navigator);
  if (options.fetch) fetch.mockImplementation(options.fetch);
  if (options.discovery) serviceWorker.getRegistrations.mockImplementation(options.discovery);
  if (options.remove) caches.delete.mockImplementation(options.remove);
  const source = await readFile(new URL('../public/reset-offline.js', import.meta.url), 'utf8');
  vm.runInNewContext(source, {
    window, navigator, caches, fetch, URL, AbortController, Date, setTimeout, clearTimeout,
    document: { getElementById: id => ({ 'reset-download': button, 'reset-status': status, 'reset-next': next })[id] },
    localStorage: { clear: vi.fn(() => progress.clear()), removeItem: vi.fn(key => progress.delete(key)) },
  });
  return { window, button, status, next, own, unrelated, unrelatedRoot, foreignScript, caches, fetch, serviceWorker, progress };
}

afterEach(() => vi.useRealTimers());

describe('standalone airplane download recovery', () => {
  test('provides an accessible, uncached recovery entry point without app dependencies', async () => {
    const html = await readFile(new URL('../public/reset-offline.html', import.meta.url), 'utf8');
    expect(html).toContain('data-offline-reset');
    expect(html).toMatch(/<button[^>]*id="reset-download"[^>]*>/);
    expect(html).toContain('Reset airplane download');
    expect(html).toContain('role="status"');
    expect(html).toContain('href="/hebrew-heroes.html"');
    expect(html).toContain('src="/reset-offline.js" defer');
    expect(html).not.toMatch(/react|https?:\/\//i);
  });

  test('does nothing until explicitly requested, and preserves downloaded files while offline', async () => {
    const h = await harness({ navigator: { onLine: false } });
    expect(h.fetch).not.toHaveBeenCalled();
    expect(await h.window.resetAirplaneDownload()).toBe(false);
    expect(h.fetch).not.toHaveBeenCalled();
    expect(h.serviceWorker.getRegistrations).not.toHaveBeenCalled();
    expect(h.caches.delete).not.toHaveBeenCalled();
    expect(h.status.textContent).toMatch(/Wi-Fi|airplane mode/);
    expect(h.button.disabled).toBe(false);
    expect(h.progress.size).toBe(1);
  });

  test.each([
    ['network failure', async () => { throw Error('Disconnected'); }],
    ['error response', async () => ({ ok: false, text: async () => '<html data-offline-reset>' })],
    ['captive portal', async () => ({ ok: true, text: async () => '<html>Sign in to Wi-Fi</html>' })],
    ['interrupted response body', async () => ({ ok: true, text: async () => { throw Error('Body interrupted'); } })],
  ])('requires a complete live recovery page before deleting anything: %s', async (_name, fetch) => {
    const h = await harness({ fetch });
    expect(await h.window.resetAirplaneDownload()).toBe(false);
    expect(h.serviceWorker.getRegistrations).not.toHaveBeenCalled();
    expect(h.caches.delete).not.toHaveBeenCalled();
    expect(h.button.disabled).toBe(false);
    expect(h.next.hidden).toBe(true);
    expect(h.progress.size).toBe(1);
  });

  test('removes only game workers and game caches, preserving progress and unrelated apps', async () => {
    const h = await harness();
    expect(await h.window.resetAirplaneDownload()).toBe(true);
    const [path, request] = h.fetch.mock.calls[0];
    expect(path).toMatch(/^\/reset-offline\.html\?check=\d+$/);
    expect(request.cache).toBe('no-store');
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(h.own.unregister).toHaveBeenCalledOnce();
    for (const item of [h.unrelated, h.unrelatedRoot, h.foreignScript]) expect(item.unregister).not.toHaveBeenCalled();
    expect(h.caches.delete.mock.calls.map(([name]) => name)).toEqual(['hebrew-heroes-assets-old', 'hebrew-heroes-assets-new']);
    expect(h.progress.get('hebrew-heroes-progress')).toBe('{"coins":42}');
    expect(h.next.hidden).toBe(false);
    expect(h.status.textContent).toMatch(/removed|reset|ready/i);
  });

  test('handles a failed cache removal with a retryable message and no automatic navigation', async () => {
    const h = await harness({ remove: async () => { throw Error('Storage unavailable'); } });
    expect(await h.window.resetAirplaneDownload()).toBe(false);
    expect(h.button.disabled).toBe(false);
    expect(h.next.hidden).toBe(true);
    expect(h.status.textContent).toMatch(/try again|retry/i);
    expect(h.progress.size).toBe(1);
    expect(h.window.location).toEqual({ origin: root });
  });

  test('bounds stalled network response bodies and aborts before touching saved data', async () => {
    vi.useFakeTimers();
    const h = await harness({ fetch: async () => ({ ok: true, text: () => new Promise(() => {}) }) });
    const pending = h.window.resetAirplaneDownload();
    await vi.advanceTimersByTimeAsync(20001);
    expect(await pending).toBe(false);
    expect(h.fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(h.serviceWorker.getRegistrations).not.toHaveBeenCalled();
    expect(h.button.disabled).toBe(false);
  });

  test('bounds stalled worker discovery and never starts deletion if it resolves late', async () => {
    vi.useFakeTimers();
    let finish;
    const h = await harness({ discovery: () => new Promise(resolve => { finish = resolve; }) });
    const pending = h.window.resetAirplaneDownload();
    await vi.advanceTimersByTimeAsync(20001);
    expect(await pending).toBe(false);
    finish([h.own]);
    await Promise.resolve();
    expect(h.own.unregister).not.toHaveBeenCalled();
    expect(h.caches.delete).not.toHaveBeenCalled();
    expect(h.button.disabled).toBe(false);
  });

  test('bounds stalled unregister and does not delete caches after it completes late', async () => {
    vi.useFakeTimers();
    const h = await harness();
    let finish;
    h.own.unregister.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = h.window.resetAirplaneDownload();
    await vi.advanceTimersByTimeAsync(20001);
    expect(await pending).toBe(false);
    finish(true);
    await Promise.resolve();
    expect(h.caches.keys).not.toHaveBeenCalled();
    expect(h.caches.delete).not.toHaveBeenCalled();
    expect(h.button.disabled).toBe(false);
  });

  test('a timed out cache deletion cannot start later deletions or reject unhandled', async () => {
    vi.useFakeTimers();
    let rejectRemoval;
    const h = await harness({ remove: () => new Promise((_resolve, reject) => { rejectRemoval = reject; }) });
    const pending = h.window.resetAirplaneDownload();
    await vi.advanceTimersByTimeAsync(20001);
    expect(await pending).toBe(false);
    rejectRemoval(Error('Storage stopped responding'));
    await Promise.resolve();
    expect(h.caches.delete).toHaveBeenCalledOnce();
    expect(h.button.disabled).toBe(false);
    expect(h.next.hidden).toBe(true);
  });

  test('prevents duplicate reset attempts while the live check is pending', async () => {
    let finish;
    const h = await harness({ fetch: () => new Promise(resolve => { finish = resolve; }) });
    const first = h.window.resetAirplaneDownload();
    expect(await h.window.resetAirplaneDownload()).toBe(false);
    await Promise.resolve();
    finish({ ok: true, text: async () => '<html data-offline-reset>' });
    expect(await first).toBe(true);
    expect(h.fetch).toHaveBeenCalledOnce();
  });
});
