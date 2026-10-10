/* Recover older or damaged saves without blocking a child from playing. */
(() => {
  const key = 'hebrew-heroes-v1';
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const levels = () => window.AREAS.flatMap(area => area.levels || []);

  function normalize(value) {
    const source = record(value) ? value : {};
    const validIds = new Set(levels().map(level => level.id));
    const rewards = new Set(levels().map(level => level.reward.label));
    const progress = {};
    if (record(source.progress)) {
      for (const [id, stars] of Object.entries(source.progress)) {
        if (validIds.has(id) && Number.isInteger(stars) && stars >= 1 && stars <= 3) progress[id] = stars;
      }
    }
    const snd = record(source.snd) ? source.snd : {};
    const areaIds = new Set(window.AREAS.map(area => area.id));
    const unlockedAreas = new Set(Array.isArray(source.unlockedAreas) ? source.unlockedAreas.filter(id => areaIds.has(id)) : []);
    if (source.curriculumVersion !== 2) {
      // Version 1 had three letter levels and two vocabulary levels. Retain
      // worlds already unlocked then, even if the child had not played them.
      const legacyPrerequisites = {
        'word-garden': ['av-1', 'av-2', 'av-3'],
        'sentence-bridge': ['wg-1', 'wg-2'],
      };
      for (const [id, prerequisites] of Object.entries(legacyPrerequisites)) {
        if (prerequisites.every(levelId => progress[levelId])) unlockedAreas.add(id);
      }
    }
    return {
      curriculumVersion: 2,
      unlockedAreas: [...unlockedAreas],
      progress,
      coins: Number.isSafeInteger(source.coins) && source.coins >= 0 ? source.coins : 0,
      stickers: Array.isArray(source.stickers) ? [...new Set(source.stickers.filter(item => rewards.has(item)))] : [],
      snd: {
        sfx: typeof snd.sfx === 'boolean' ? snd.sfx : true,
        voice: typeof snd.voice === 'boolean' ? snd.voice : true,
        reduce: typeof snd.reduce === 'boolean' ? snd.reduce : !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      },
    };
  }

  function load(storage) {
    try { return normalize(JSON.parse((storage || window.localStorage).getItem(key))); }
    catch (error) { console.warn('Hebrew Heroes: could not read saved progress.', error.name); return normalize(null); }
  }

  function store(value, storage) {
    try { (storage || window.localStorage).setItem(key, JSON.stringify(value)); return true; }
    catch (error) { console.warn('Hebrew Heroes: progress is kept in this session because device storage is unavailable.', error.name); return false; }
  }

  function next(progress) {
    for (let areaIdx = 0; areaIdx < window.AREAS.length; areaIdx++) {
      const area = window.AREAS[areaIdx];
      const level = area.levels?.find(item => !progress[item.id]);
      if (level) return { areaIdx, area, level };
    }
    return { areaIdx: 0, area: window.AREAS[0], level: window.AREAS[0].levels[0] };
  }

  // A curriculum extension must not take away worlds a child already reached.
  function areaUnlocked(index, progress, unlockedAreas = []) {
    const area = window.AREAS[index];
    if (!area?.levels) return false;
    return index === 0 || unlockedAreas.includes(area.id) || area.levels.some(level => progress[level.id]) ||
      window.AREAS[index - 1].levels.every(level => progress[level.id]);
  }

  function levelUnlocked(areaIndex, levelIndex, progress, unlockedAreas = []) {
    const area = window.AREAS[areaIndex];
    const level = area?.levels?.[levelIndex];
    return !!level && areaUnlocked(areaIndex, progress, unlockedAreas) &&
      (levelIndex === 0 || !!progress[level.id] || !!progress[area.levels[levelIndex - 1].id]);
  }

  window.HH_PROGRESS = { key, normalize, load, store, next, areaUnlocked, levelUnlocked };
})();
