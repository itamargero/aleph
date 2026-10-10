import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const script = await readFile(new URL('../public/offline.js', import.meta.url), 'utf8');

function clientHarness({ existing = true, online = true, lookupPending = false } = {}) {
  const window = new EventTarget();
  window.isSecureContext = true;
  const document = new EventTarget();
  document.visibilityState = 'visible';
  const worker = new EventTarget();
  worker.state = 'activated';
  const requests = [];
  worker.postMessage = (request, ports) => {
    requests.push(request.type);
    queueMicrotask(() => ports[0].reply({ type: 'HH_OFFLINE', state: {
      status: 'ready', completed: 184, total: 184, error: '', version: 'cached-game',
    } }));
  };
  const registration = new EventTarget();
  registration.active = worker;
  registration.installing = null;
  registration.waiting = null;
  // Model the native WebKit calls that hung in production. Cached readiness must
  // complete even if re-registration or background update would never settle.
  registration.update = vi.fn(() => new Promise(() => {}));
  const serviceWorker = new EventTarget();
  serviceWorker.controller = worker;
  serviceWorker.getRegistration = vi.fn(() => lookupPending ? new Promise(() => {}) : Promise.resolve(existing ? registration : undefined));
  serviceWorker.register = vi.fn(() => new Promise(() => {}));
  const navigator = { onLine: online, serviceWorker };
  class ReplyChannel {
    constructor() {
      this.port1 = { onmessage: null, close() {} };
      this.port2 = { reply: data => this.port1.onmessage?.({ data }) };
    }
  }
  vm.runInNewContext(script, {
    window, document, navigator, CustomEvent, MessageChannel: ReplyChannel,
    setTimeout, clearTimeout, queueMicrotask,
  });
  return { window, serviceWorker, registration, requests };
}

describe('offline client reopens and retry deadlines', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('cached online launch and repeated retries reuse registration while native update stays pending', async () => {
    const client = clientHarness();
    for (let i = 0; i < 5; i++) {
      expect(await client.window.prepareOffline()).toMatchObject({ status: 'ready', completed: 184 });
    }
    expect(client.serviceWorker.register).not.toHaveBeenCalled();
    expect(client.serviceWorker.getRegistration).toHaveBeenCalledTimes(5);
    expect(client.registration.update).toHaveBeenCalledTimes(5);
    expect(client.requests).toEqual(Array(5).fill('HH_PREPARE'));
  });

  test('pending initial registration times out and the next retry can use an installed game', async () => {
    const client = clientHarness({ existing: false });
    const first = client.window.prepareOffline();
    await vi.advanceTimersByTimeAsync(20001);
    expect(await first).toMatchObject({ status: 'error', error: expect.stringContaining('setup is taking too long') });
    expect(client.serviceWorker.register).toHaveBeenCalledTimes(1);
    client.serviceWorker.getRegistration.mockResolvedValue(client.registration);
    expect(await client.window.prepareOffline()).toMatchObject({ status: 'ready' });
    expect(client.serviceWorker.register).toHaveBeenCalledTimes(1);
  });

  test('pending native lookup is bounded and does not leave retry permanently locked', async () => {
    const client = clientHarness({ lookupPending: true });
    const first = client.window.prepareOffline();
    await vi.advanceTimersByTimeAsync(10001);
    expect(await first).toMatchObject({ status: 'error', error: expect.stringContaining('storage is not responding') });
    client.serviceWorker.getRegistration.mockResolvedValue(client.registration);
    expect(await client.window.prepareOffline()).toMatchObject({ status: 'ready' });
    expect(client.serviceWorker.register).not.toHaveBeenCalled();
  });

  test('offline cold launch checks the existing cache without registering or checking for updates', async () => {
    const client = clientHarness({ online: false });
    expect(await client.window.prepareOffline()).toMatchObject({ status: 'ready' });
    expect(client.serviceWorker.register).not.toHaveBeenCalled();
    expect(client.registration.update).not.toHaveBeenCalled();
    expect(client.requests).toEqual(['HH_STATUS']);
  });
});
