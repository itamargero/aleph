/**
 * Build Hebrew recordings locally with macOS Carmit and ffmpeg. Run when the
 * curriculum changes, then commit MP3s so deployments never need a TTS service.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, unlink, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import vm from 'node:vm';

const execute = promisify(execFile);
export const normalizeSpeech = text => String(text || '').normalize('NFC').trim().replace(/\s+/g, ' ');
export const AUDIO_PROMPTS = {
  'instruction-letter': 'הַקְשִׁיבוּ, וְגְּעוּ בָּאוֹת הַמַּתְאִימָה.',
  'instruction-picture': 'הַקְשִׁיבוּ לַמִּלָּה, וְגְּעוּ בַּתְּמוּנָה הַמַּתְאִימָה.',
  'instruction-listen': 'הַקְשִׁיבוּ הֵיטֵב, וּבִחֲרוּ אֶת הַתְּשׁוּבָה.',
  'instruction-build': 'בּוֹאוּ נִבְנֶה מִלָּה. גְּעוּ בָּאוֹתִיּוֹת לְפִי הַסֵּדֶר, מִיָּמִין לִשְׂמֹאל.',
  'instruction-sentence': 'בּוֹאוּ נִבְנֶה מִשְׁפָּט. גְּעוּ בַּמִּלִּים לְפִי הַסֵּדֶר, מִיָּמִין לִשְׂמֹאל.',
  'instruction-fill': 'אֵיזוֹ מִלָּה חֲסֵרָה? הַקְשִׁיבוּ, וּבִחֲרוּ אֶת הַתְּשׁוּבָה.',
  'instruction-sound': 'הַקְשִׁיבוּ לַצְּלִיל, וְגְּעוּ בַּסִּימָן הַמַּתְאִים.',
  'instruction-story': 'הַקְשִׁיבוּ לַסִּפּוּר, וּבִחֲרוּ אֶת הַתְּמוּנָה הַמַּתְאִימָה.',
  'instruction-phrase': 'הַקְשִׁיבוּ, וּבִחֲרוּ אֶת הַמִּלִּים הַמַּתְאִימוֹת.',
  'correct': 'כָּל הַכָּבוֹד! הִצְלַחְתֶּם!',
  'try-again': 'בּוֹאוּ נְנַסֶּה שׁוּב. הַקְשִׁיבוּ וְגְּעוּ בַּתְּשׁוּבָה.',
};

const LETTER_NAMES = {
  'א': 'אָלֶף', 'ב': 'בֵּית', 'ג': 'גִּימֶל', 'ד': 'דָּלֶת', 'ה': 'הֵא',
  'ו': 'וָו', 'ז': 'זַיִן', 'ח': 'חֵית', 'ט': 'טֵית', 'י': 'יוּד',
  'כ': 'כָּף', 'ך': 'כָּף סוֹפִית', 'ל': 'לָמֶד', 'מ': 'מֵם', 'ם': 'מֵם סוֹפִית',
  'נ': 'נוּן', 'ן': 'נוּן סוֹפִית', 'ס': 'סָמֶךְ', 'ע': 'עַיִן',
  'פ': 'פֵּא', 'ף': 'פֵּא סוֹפִית', 'צ': 'צָדִי', 'ץ': 'צָדִי סוֹפִית',
  'ק': 'קוֹף', 'ר': 'רֵישׁ', 'ש': 'שִׁין', 'ת': 'תָּו',
};

export function loadCurriculum(source) {
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: 'public/data.js', timeout: 1000 });
  return context.window;
}

export function collectSpeech(curriculum) {
  const entries = new Map();
  const add = (text, spoken = text) => {
    const key = normalizeSpeech(text);
    if (/[\u0590-\u05ff]/u.test(key)) entries.set(key, normalizeSpeech(spoken));
  };
  const visit = value => {
    if (typeof value === 'string') add(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(curriculum);
  Object.entries(curriculum.WORDS || {}).forEach(([word, record]) => {
    add(word);
    if (record.plain) add(record.plain, word);
  });
  (curriculum.AREAS || []).forEach(area => (area.levels || []).forEach(level => (level.exercises || []).forEach(exercise => {
    if (exercise.words) add(exercise.words.join(' '));
    if (exercise.blankAnswer) add([exercise.before, exercise.blankAnswer, exercise.after].filter(Boolean).join(' '));
    if (Array.isArray(exercise.story)) add(exercise.story.join(' '));
  })));
  // Speak alphabet glyphs as their names, including final forms. Plain glyph TTS
  // can say the sound or skip the letter entirely, which is unsuitable for lessons.
  Object.entries(LETTER_NAMES).forEach(([glyph, name]) => add(glyph, curriculum.LETTERS?.[glyph]?.nameHe || name));
  Object.values(AUDIO_PROMPTS).forEach(text => add(text));
  return entries;
}

const audioId = text => createHash('sha256').update('Carmit|rate=145|v1|' + text).digest('hex').slice(0, 20);

async function generate() {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const output = join(root, 'public/audio');
  const curriculum = loadCurriculum(await readFile(join(root, 'public/data.js'), 'utf8'));
  const speech = collectSpeech(curriculum);
  const spoken = [...new Set(speech.values())].sort();
  await mkdir(output, { recursive: true });
  const existing = new Set(await readdir(output));
  const temporary = await mkdtemp(join(tmpdir(), 'hebrew-heroes-audio-'));
  let generated = 0;
  try {
    for (const text of spoken) {
      const filename = audioId(text) + '.mp3';
      if (existing.has(filename)) continue;
      const aiff = join(temporary, 'voice.aiff');
      await execute('/usr/bin/say', ['-v', 'Carmit', '-r', '145', '-o', aiff, '--', text], { timeout: 30000 });
      await execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', aiff, '-af', 'silenceremove=start_periods=1:start_duration=0.04:start_threshold=-45dB', '-codec:a', 'libmp3lame', '-b:a', '64k', '-ar', '22050', '-ac', '1', join(output, filename)], { timeout: 30000 });
      generated += 1;
      if (generated % 20 === 0) console.log('Recorded ' + generated + ' Hebrew clips.');
    }
    const record = text => ({ url: '/audio/' + audioId(text) + '.mp3', text });
    const entries = Object.fromEntries([...speech].sort(([a], [b]) => a.localeCompare(b, 'he')).map(([key, text]) => [key, record(text)]));
    const prompts = Object.fromEntries(Object.entries(AUDIO_PROMPTS).map(([key, text]) => [key, record(normalizeSpeech(text))]));
    const manifest = { voice: 'Carmit (he-IL)', rate: 145, entries, prompts };
    await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    const wanted = new Set(spoken.map(text => audioId(text) + '.mp3'));
    for (const filename of existing) {
      if (filename.endsWith('.mp3') && !wanted.has(filename)) await unlink(join(output, filename));
    }
    console.log('Hebrew audio: ' + spoken.length + ' recordings, ' + speech.size + ' text aliases (' + generated + ' new).');
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generate();
}
