import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';
import { afterEach, describe, expect, test, vi } from 'vitest';

const { code } = await transform(await readFile(new URL('../public/exercises.jsx', import.meta.url), 'utf8'), { loader: 'jsx' });
function feedback() {
  const context = { window: {}, Promise };
  vm.runInNewContext(code, context);
  return context.finishAfterVoice;
}
afterEach(() => vi.useRealTimers());

describe('complete spoken answer feedback', () => {
  test('does not advance while the four-second praise recording is still playing', async () => {
    vi.useFakeTimers();
    const finish = feedback();
    let complete = 0;
    const voice = new Promise(resolve => setTimeout(resolve, 4400));
    finish(setTimeout, voice, () => complete++);
    await vi.advanceTimersByTimeAsync(1500);
    expect(complete).toBe(0);
    await vi.advanceTimersByTimeAsync(3000);
    expect(complete).toBe(1);
    await vi.advanceTimersByTimeAsync(10000);
    expect(complete).toBe(1);
  });

  test('muted or failed speech keeps a short visual pause and still advances', async () => {
    vi.useFakeTimers();
    const finish = feedback();
    let complete = 0;
    finish(setTimeout, Promise.resolve(false), () => complete++);
    await vi.advanceTimersByTimeAsync(800);
    expect(complete).toBe(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(complete).toBe(1);
  });

  test('stalled speech cannot block the child indefinitely', async () => {
    vi.useFakeTimers();
    const finish = feedback();
    let complete = 0;
    finish(setTimeout, new Promise(() => {}), () => complete++);
    await vi.advanceTimersByTimeAsync(11000);
    expect(complete).toBe(1);
  });
});
