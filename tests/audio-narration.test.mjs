import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';
import { afterEach, expect, test, vi } from 'vitest';

const { code } = await transform(await readFile(new URL('../public/exercises.jsx', import.meta.url), 'utf8'), { loader: 'jsx' });
function narration(prompt) {
  const speech = [], listeners = new Map();
  const context = {
    window: {
      playPrompt: () => { speech.push('instruction'); return prompt; },
      speakHe: () => { speech.push('target'); return Promise.resolve(true); },
      stopVoice() {},
    },
    document: {
      addEventListener: (event, fn) => listeners.set(event, fn),
      removeEventListener: event => listeners.delete(event),
    },
    React: { useEffect: effect => effect() },
    setTimeout, clearTimeout, Promise,
  };
  vm.runInNewContext(code, context);
  context.useExerciseVoice('instruction-letter', 'א');
  return { speech, click: () => listeners.get('click')?.() };
}
afterEach(() => vi.useRealTimers());

test('a fast answer tap cancels pending narration before it can interrupt answer feedback', async () => {
  vi.useFakeTimers();
  const { speech, click } = narration(Promise.resolve(true));
  click();
  await vi.advanceTimersByTimeAsync(300);
  expect(speech).toEqual([]);
});

test('a speaker or answer tap during the instruction cancels the queued target', async () => {
  vi.useFakeTimers();
  let finish;
  const { speech, click } = narration(new Promise(resolve => { finish = resolve; }));
  await vi.advanceTimersByTimeAsync(230);
  expect(speech).toEqual(['instruction']);
  click();
  finish(true);
  await vi.advanceTimersByTimeAsync(10);
  expect(speech).toEqual(['instruction']);
});
