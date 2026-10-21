import { describe, expect, test } from 'vitest';
import { readFile, stat } from 'node:fs/promises';
import { AUDIO_CONFIG, AUDIO_PROMPTS, collectSpeech, loadCurriculum, normalizeSpeech } from '../scripts/generate-audio.mjs';

const curriculum = loadCurriculum(await readFile(new URL('../public/data.js', import.meta.url), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('../public/audio/manifest.json', import.meta.url), 'utf8'));

describe('bundled Hebrew voice for every activity', () => {
  test('the shipped corpus uses the selected female Hebrew neural voice', () => {
    expect(manifest).toMatchObject(AUDIO_CONFIG);
  });

  test('parent metadata is excluded while teaching, names and exercise speech remain', () => {
    const parentText = 'Meet א through ז by copying and listening';
    const childText = 'בַּבַּיִת יֵשׁ כֶּלֶב.';
    const speech = collectSpeech({
      LETTERS: { 'א': { name: parentText, nameHe: 'אָלֶף' } },
      AREAS: [{
        name: parentText, blurb: parentText,
        levels: [{
          objective: parentText, title: parentText, teaches: ['א', 'כֶּלֶב'],
          reward: { label: parentText },
          exercises: [{ en: parentText, story: childText, speak: 'אֵיפֹה הַכֶּלֶב?', model: 'זֶה כֶּלֶב', options: ['כֶּלֶב'] }],
        }],
      }],
    });
    expect(speech.has(parentText)).toBe(false);
    expect(speech.get('א')).toBe('אָלֶף');
    for (const text of ['כֶּלֶב', childText, 'אֵיפֹה הַכֶּלֶב?', 'זֶה כֶּלֶב']) {
      expect(speech.has(normalizeSpeech(text)), text).toBe(true);
    }
    expect(Object.keys(manifest.entries).some(text => /[A-Za-z]/.test(text))).toBe(false);
  });

  test('every curriculum utterance has the intended synthesis input and a nonempty committed MP3', async () => {
    const required = collectSpeech(curriculum);
    const checkedUrls = new Set();
    for (const [text, spoken] of required) {
      expect(manifest.entries[text], text).toBeDefined();
      const record = manifest.entries[text];
      expect(record.text, text).toBe(spoken);
      expect(record.url).toMatch(/^\/audio\/[a-f0-9]{20}\.mp3$/);
      if (!checkedUrls.has(record.url)) {
        const file = await stat(new URL('../public' + record.url, import.meta.url));
        expect(file.isFile(), record.url).toBe(true);
        expect(file.size, record.url).toBeGreaterThan(128);
        checkedUrls.add(record.url);
      }
    }
  });

  test('child instructions and retry/praise prompts each resolve to a local recording', () => {
    for (const [key, text] of Object.entries(AUDIO_PROMPTS)) {
      expect(manifest.prompts[key], key).toEqual(manifest.entries[normalizeSpeech(text)]);
    }
    expect(Object.keys(manifest.prompts)).toEqual(Object.keys(AUDIO_PROMPTS));
  });

  test('letter glyphs speak their explicit Hebrew names, finals included, and words retain vowel marks', () => {
    for (const [glyph, letter] of Object.entries(curriculum.LETTERS)) {
      expect(manifest.entries[glyph].text, glyph).toBe(normalizeSpeech(letter.nameHe));
    }
    for (const [pointed, word] of Object.entries(curriculum.WORDS)) {
      expect(manifest.entries[normalizeSpeech(word.plain)]).toEqual(manifest.entries[normalizeSpeech(pointed)]);
      expect(manifest.entries[normalizeSpeech(pointed)].text).toBe(normalizeSpeech(pointed));
    }
    expect(manifest.entries[normalizeSpeech('בַּ')].url).not.toBe(manifest.entries['ב'].url);
  });
});
