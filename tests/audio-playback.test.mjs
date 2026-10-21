import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';
import { afterEach, describe, expect, test, vi } from 'vitest';

const { code } = await transform(await readFile(new URL('../public/fx.jsx', import.meta.url), 'utf8'), { loader: 'jsx' });

// Model native Web Audio state transitions; decoding and rendering are also
// exercised in Chromium/WebKit against the real committed recordings.
function player({ state = 'suspended', resumeStalls = false, resumeFirstStalls = false, resumeSuspensionEvent = false, bodyStalls = false, bodyFailsOnce = false, finishAutomatically = true } = {}) {
  const contexts = [];
  const started = [];
  class AudioContext {
    constructor() { this.state = state; this.sampleRate = 44100; this.destination = {}; contexts.push(this); }
    resume() {
      this.resumeCount = (this.resumeCount || 0) + 1;
      if (resumeFirstStalls && this.resumeCount === 1) return new Promise(() => {});
      if (resumeStalls) return new Promise(() => {});
      if (resumeSuspensionEvent && this.resumeCount > 1) this.onstatechange?.();
      this.state = 'running';
      return Promise.resolve();
    }
    createBuffer() { return {}; }
    createBufferSource() {
      const source = { connect() {}, stop() {}, start() {
        if (source.buffer?.voice) { started.push(source); if (finishAutomatically) queueMicrotask(() => source.onended?.()); }
      } };
      return source;
    }
    decodeAudioData() { return Promise.resolve({ voice: true }); }
  }
  const window = { AudioContext, dispatchEvent() {} };
  const document = { getElementById: () => true };
  const fetch = (_url, { signal } = {}) => {
    if (_url.endsWith('.json')) return Promise.resolve({ ok: true, json: async () => ({ entries: { 'אָלֶף': { text: 'אָלֶף', url: '/audio/alef.mp3' } }, prompts: { instruction: { text: 'אָלֶף', url: '/audio/alef.mp3' } } }) });
    if (bodyFailsOnce) { bodyFailsOnce = false; return Promise.reject(new Error('Connection interrupted.')); }
    return Promise.resolve({ ok: true, arrayBuffer: () => bodyStalls
      ? new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Download timed out.'))))
      : Promise.resolve(new ArrayBuffer(4)) });
  };
  vm.runInNewContext(code, { window, document, fetch, Map, Promise, AbortController, setTimeout, clearTimeout, CustomEvent: class {}, queueMicrotask });
  return { window, contexts, started };
}

afterEach(() => vi.useRealTimers());

describe('Hebrew playback recovery', () => {
  test('a speaker request resumes audio without relying on a previous global tap', async () => {
    const { window, contexts, started } = player();
    expect(await window.speakHe('אָלֶף')).toBe(true);
    expect(contexts[0].state).toBe('running');
    expect(started).toHaveLength(1);
  });

  test('a speaker request recovers after Safari interrupts the context', async () => {
    const { window, contexts } = player();
    await window.unlockAudio();
    contexts[0].state = 'interrupted';
    expect(await window.speakHe('אָלֶף')).toBe(true);
  });

  test('a queued suspension notification does not cancel a new speaker request during resume', async () => {
    const { window, contexts, started } = player({ resumeSuspensionEvent: true });
    await window.unlockAudio();
    contexts[0].state = 'suspended';
    expect(await window.speakHe('אָלֶף')).toBe(true);
    expect(started).toHaveLength(1);
  });

  test('a closed native context is replaced on the next speaker tap', async () => {
    const { window, contexts } = player();
    await window.unlockAudio();
    contexts[0].state = 'closed';
    expect(await window.speakHe('אָלֶף')).toBe(true);
    expect(contexts).toHaveLength(2);
  });

  test('browser resume that never settles reports a retry instead of hanging the speaker', async () => {
    vi.useFakeTimers();
    const { window } = player({ resumeStalls: true });
    window.unlockAudio();
    const spoken = window.speakHe('אָלֶף');
    await vi.advanceTimersByTimeAsync(16000);
    expect(window.HH_AUDIO.status).toBe('locked');
    expect(await spoken).toBe(false);
  });

  test('a real speaker gesture retries native resume even if an earlier pointerdown stalled', async () => {
    vi.useFakeTimers();
    const { window, started } = player({ resumeFirstStalls: true });
    window.unlockAudio();
    const spoken = window.speakHe('אָלֶף');
    await vi.advanceTimersByTimeAsync(4000);
    expect(await spoken).toBe(true);
    expect(started).toHaveLength(1);
  });

  test('the audio download timeout covers the body as well as response headers', async () => {
    vi.useFakeTimers();
    const { window } = player({ bodyStalls: true });
    await window.unlockAudio();
    const spoken = window.speakHe('אָלֶף');
    await vi.advanceTimersByTimeAsync(16000);
    expect(window.HH_AUDIO.status).toBe('error');
    expect(await spoken).toBe(false);
  });

  test('retry replays the failed instruction instead of merely unlocking audio', async () => {
    const { window, started } = player({ bodyFailsOnce: true });
    expect(await window.playPrompt('instruction')).toBe(false);
    expect(window.HH_AUDIO.status).toBe('error');
    expect(await window.retryVoice()).toBe(true);
    expect(started).toHaveLength(1);
  });

  test('an idle suspension does not replay a completed clip from a previous screen', async () => {
    const { window, contexts, started } = player();
    expect(await window.speakHe('אָלֶף')).toBe(true);
    contexts[0].state = 'suspended';
    contexts[0].onstatechange();
    expect(await window.retryVoice()).toBe(true);
    expect(started).toHaveLength(1);
  });

  test('background interruption settles the active speaker and allows another tap', async () => {
    const { window, contexts, started } = player({ finishAutomatically: false });
    const spoken = window.speakHe('אָלֶף');
    await vi.waitFor(() => expect(started).toHaveLength(1));
    contexts[0].state = 'interrupted';
    contexts[0].onstatechange?.();
    expect(await spoken).toBe(false);
    expect(window.HH_AUDIO.status).toBe('locked');
  });

  test('muted voice returns promptly without starting audio', async () => {
    const { window, started } = player();
    window.HH_SOUND.voice = false;
    expect(await window.speakHe('אָלֶף')).toBe(false);
    expect(window.HH_AUDIO.status).toBe('muted');
    expect(started).toHaveLength(0);
  });
});
