import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../public/data.js', import.meta.url), 'utf8');
const iconsSource = readFileSync(new URL('../public/icons.jsx', import.meta.url), 'utf8');
const curriculum = { window: {} };
vm.runInNewContext(source, curriculum, { filename: 'data.js' });
const { AREAS, LETTERS, WORDS, LEVEL_ORDER } = curriculum.window;
const levels = AREAS.flatMap(area => area.levels || []);
const exercises = levels.flatMap(level => level.exercises || []);
const supportedIcons = new Set([...iconsSource.matchAll(/^ {2}([a-z]+):/gm)].map(match => match[1]));
const supportedTypes = new Set([
  'letter_choice', 'audio_to_letter', 'picture_to_word', 'audio_to_word',
  'audio_to_picture', 'build_word', 'sentence_order', 'fill_missing',
  'sound_choice', 'story_choice', 'phrase_choice',
]);
const alphabet = [...'אבגדהוזחטיכלמנסעפצקרשתךםןףץ'];
const unique = values => new Set(values).size === values.length;
const isHebrew = value => typeof value === 'string' && /[\u05d0-\u05ea]/u.test(value);

// Validate references and the real answer path, so a beautiful map cannot hide an
// unavailable world, missing picture, or an exercise a child cannot complete.
describe('complete, playable Hebrew curriculum', () => {
  it('ships all eight worlds with three or four short levels and no placeholders', () => {
    expect(AREAS).toHaveLength(8);
    expect(unique(AREAS.map(area => area.id))).toBe(true);
    for (const area of AREAS) {
      expect(area.locked, area.id).not.toBe(true);
      expect(area.comingSoon, area.id).not.toBe(true);
      expect(area.levels?.length, area.id).toBeGreaterThanOrEqual(3);
      expect(area.levels?.length, area.id).toBeLessThanOrEqual(4);
      expect(supportedIcons.has(area.icon), area.icon).toBe(true);
      for (const level of area.levels) {
        expect(level.exercises.length, level.id).toBeGreaterThanOrEqual(4);
        expect(level.exercises.length, level.id).toBeLessThanOrEqual(8);
      }
    }
  });

  it('preserves existing save ids and sticker labels while keeping rewards unique', () => {
    const existing = {
      'av-1': 'Alef Badge', 'av-2': 'Bright Star', 'av-3': 'Letter Champ',
      'wg-1': 'Animal Pack', 'wg-2': 'Snack Time', 'sb-1': 'Sentence Star',
    };
    expect(unique(levels.map(level => level.id))).toBe(true);
    expect(unique(levels.map(level => level.reward.label))).toBe(true);
    for (const [id, label] of Object.entries(existing)) {
      expect(levels.find(level => level.id === id)?.reward.label).toBe(label);
    }
    expect(LEVEL_ORDER).toEqual(AREAS.flatMap(area => area.levels.map(level => ({
      areaId: area.id, levelId: level.id,
    }))));
  });

  it('teaches and directly practices all 22 letters and five final forms', () => {
    const teaching = new Set(levels.flatMap(level => level.teaches || []));
    const practiced = new Set(exercises.filter(exercise =>
      ['letter_choice', 'audio_to_letter'].includes(exercise.type)).map(exercise => exercise.answer));
    for (const letter of alphabet) {
      expect(LETTERS[letter]?.nameHe, letter).toBeTruthy();
      expect(teaching.has(letter), letter).toBe(true);
      expect(practiced.has(letter), letter).toBe(true);
    }
  });

  it('defines every vocabulary picture and teaches the actual food built in wg-2', () => {
    for (const [key, word] of Object.entries(WORDS)) {
      expect(isHebrew(key), key).toBe(true);
      expect(word.plain, key).toBeTruthy();
      expect(supportedIcons.has(word.icon), word.icon).toBe(true);
    }
    const foodLevel = levels.find(level => level.id === 'wg-2');
    for (const exercise of foodLevel.exercises.filter(exercise => exercise.type === 'build_word')) {
      expect(foodLevel.teaches.includes(exercise.wordKey)).toBe(true);
      expect(['apple', 'bread', 'milk', 'banana']).toContain(WORDS[exercise.wordKey].icon);
    }
  });

  it('uses supported exercise types with unique choices and exactly one correct answer', () => {
    for (const exercise of exercises) {
      expect(supportedTypes.has(exercise.type), exercise.type).toBe(true);
      if (exercise.options) {
        expect(exercise.options.length).toBeGreaterThanOrEqual(3);
        expect(unique(exercise.options), JSON.stringify(exercise)).toBe(true);
        const answer = exercise.blankAnswer || exercise.answer;
        expect(exercise.options.filter(option => option === answer), JSON.stringify(exercise)).toHaveLength(1);
        for (const option of exercise.options) expect(isHebrew(option), option).toBe(true);
      }
      if (exercise.icon) expect(supportedIcons.has(exercise.icon), exercise.icon).toBe(true);
      for (const icon of exercise.sceneIcons || []) expect(supportedIcons.has(icon), icon).toBe(true);
    }
    for (const level of levels) expect(supportedIcons.has(level.reward.icon), level.reward.icon).toBe(true);
  });

  it('resolves every word reference and picture answer without fallback content', () => {
    const wordTypes = ['picture_to_word', 'audio_to_word', 'audio_to_picture', 'story_choice', 'fill_missing'];
    for (const exercise of exercises) {
      if (wordTypes.includes(exercise.type)) {
        for (const option of exercise.options) expect(WORDS[option], option).toBeDefined();
      }
      if (exercise.speakKey) expect(WORDS[exercise.speakKey], exercise.speakKey).toBeDefined();
      if (exercise.wordKey) expect(WORDS[exercise.wordKey], exercise.wordKey).toBeDefined();
      if (exercise.type === 'picture_to_word') expect(exercise.icon).toBe(WORDS[exercise.answer].icon);
      if (['audio_to_word', 'audio_to_picture'].includes(exercise.type)) expect(exercise.speakKey).toBe(exercise.answer);
      if (['letter_choice', 'audio_to_letter'].includes(exercise.type)) {
        for (const option of exercise.options) expect(LETTERS[option], option).toBeDefined();
      }
    }
  });

  it('provides visible copying models and pictures for children who cannot read yet', () => {
    for (const exercise of exercises) {
      if (['letter_choice', 'audio_to_letter', 'sound_choice'].includes(exercise.type)) {
        expect(exercise.model, JSON.stringify(exercise)).toBe(exercise.answer);
      }
      if (exercise.type === 'build_word') expect(exercise.model).toBe(WORDS[exercise.wordKey].plain);
      if (exercise.type === 'sentence_order') {
        expect(exercise.words.length).toBeGreaterThanOrEqual(2);
        expect(exercise.model).toBe(exercise.words.join(' '));
        expect(exercise.sceneIcons.length).toBeGreaterThanOrEqual(1);
      }
      if (exercise.type === 'fill_missing') {
        expect(exercise.model).toBe([exercise.before, exercise.blankAnswer, exercise.after].filter(Boolean).join(' '));
        expect(exercise.iconAnswer).toBe(WORDS[exercise.blankAnswer].icon);
        expect(exercise.sceneIcons.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('teaches the vowel marks with audible syllables and a visible model', () => {
    const forest = AREAS.find(area => area.id === 'nikud-forest');
    const sounds = forest.levels.flatMap(level => level.exercises).filter(exercise => exercise.type === 'sound_choice');
    for (const mark of ['ָ', 'ַ', 'ֵ', 'ֶ', 'ִ', 'ֹ', 'ֻ', 'ְ', 'ּ']) {
      expect(sounds.some(exercise => exercise.answer.includes(mark)), `vowel ${mark}`).toBe(true);
    }
    for (const exercise of sounds) expect(exercise.speak).toBe(exercise.answer);
  });

  it('ships narrated picture stories, visual everyday phrases, and relaxed review', () => {
    const stories = AREAS.find(area => area.id === 'story-castle').levels.flatMap(level => level.exercises);
    for (const exercise of stories) {
      expect(exercise.type).toBe('story_choice');
      expect(isHebrew(exercise.story)).toBe(true);
      expect(isHebrew(exercise.speak)).toBe(true);
      expect(exercise.sceneIcons.length).toBeGreaterThanOrEqual(2);
      expect(exercise.sceneIcons).toContain(WORDS[exercise.answer].icon);
    }
    const phrases = AREAS.find(area => area.id === 'market').levels.flatMap(level => level.exercises);
    for (const exercise of phrases) {
      expect(exercise.type).toBe('phrase_choice');
      expect(isHebrew(exercise.speak)).toBe(true);
      expect(exercise.sceneEmoji).toBeTruthy();
      for (const option of exercise.options) expect(exercise.optionEmojis[option]).toBeTruthy();
    }
    for (const exercise of exercises) {
      expect(exercise.timeLimit).toBeUndefined();
      expect(exercise.timer).toBeUndefined();
    }
  });
});


describe('accurate Hebrew vowel models', () => {
  it('patach and segol lessons use those exact marks for both consonants', () => {
    const level = levels.find(level => level.id === 'nf-1');
    expect(level.teaches).toEqual(['בַּ', 'מַ', 'בֶּ', 'מֶ', 'בָּ', 'בֵּ']);
    expect(level.exercises.map(exercise => exercise.answer)).toEqual(level.teaches);
  });
});
