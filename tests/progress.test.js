import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

function helpers() {
  const context = vm.createContext({ window: {}, console });
  vm.runInContext(readFileSync('public/data.js', 'utf8'), context);
  vm.runInContext(readFileSync('public/progress.js', 'utf8'), context);
  return context.window.HH_PROGRESS;
}

describe('saved progress recovery', () => {
  it('recovers a malformed save without preventing the game from opening', () => {
    const api = helpers();
    expect(api.load({ getItem: () => '{broken' }).progress).toEqual({});
    expect(api.normalize(null).coins).toBe(0);
    expect(api.normalize({ progress: 'oops', coins: -20, stickers: {}, snd: null }).coins).toBe(0);
  });

  it('preserves existing earned stars and settings while rejecting corrupt fields', () => {
    const api = helpers();
    const saved = api.normalize({ progress: { 'av-1': 3, 'av-2': 2, 'av-3': '3', missing: 3 }, coins: 55,
      stickers: ['Alef Badge', 'Alef Badge', 22], snd: { voice: false, sfx: true, reduce: true } });
    expect(saved.progress).toEqual({ 'av-1': 3, 'av-2': 2 });
    expect(saved.coins).toBe(55);
    expect(saved.stickers).toEqual(['Alef Badge']);
    expect(saved.snd).toEqual({ voice: false, sfx: true, reduce: true });
  });

  it('continues at the first unfinished level and offers replay after the whole game', () => {
    const api = helpers();
    expect(api.next({}).level.id).toBe('av-1');
    expect(api.next({ 'av-1': 2 }).level.id).toBe('av-2');
    expect(api.next({ 'av-1': 1, 'av-2': 3 }).level.id).toBe('av-3');
  });

  it('reports unavailable storage without throwing or erasing in-memory play', () => {
    const api = helpers();
    const storage = { setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(api.store({ progress: { 'av-1': 3 } }, storage)).toBe(false);
    expect(api.load({ getItem: () => { throw new Error('SecurityError'); } }).progress).toEqual({});
  });

  it('keeps previously played worlds accessible when new prerequisite lessons are added', () => {
    const api = helpers();
    expect(api.areaUnlocked(2, { 'sb-1': 3 })).toBe(true);
    expect(api.levelUnlocked(2, 0, { 'sb-1': 3 })).toBe(true);
    expect(api.areaUnlocked(2, {})).toBe(false);
  });

  it('preserves worlds unlocked in the original six-level curriculum', () => {
    const api = helpers();
    const lettersOnly = api.normalize({ progress: { 'av-1': 3, 'av-2': 2, 'av-3': 3 } });
    expect(api.areaUnlocked(1, lettersOnly.progress, lettersOnly.unlockedAreas)).toBe(true);
    const legacy = api.normalize({ progress: { 'av-1': 3, 'av-2': 2, 'av-3': 3, 'wg-1': 1, 'wg-2': 3 } });
    expect(api.areaUnlocked(2, legacy.progress, legacy.unlockedAreas)).toBe(true);
    const fresh = api.normalize({ curriculumVersion: 2, progress: { 'av-1': 3, 'av-2': 3, 'av-3': 3 } });
    expect(api.areaUnlocked(1, fresh.progress, fresh.unlockedAreas)).toBe(false);
  });
});
