/**
 * Build Hebrew recordings with the native Israeli Hila neural voice and ffmpeg. Run when the
 * curriculum changes, then commit MP3s so deployments never need a TTS service.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, unlink, mkdtemp, rm, rename } from 'node:fs/promises';
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
  // Parent-facing metadata may contain Hebrew examples inside English prose.
  // Record the child-facing speech fields, rather than reading those descriptions.
  const metadataFields = new Set(['objective', 'title', 'name', 'blurb', 'en', 'label']);
  const add = (text, spoken = text) => {
    const key = normalizeSpeech(text);
    if (/[\u0590-\u05ff]/u.test(key)) entries.set(key, normalizeSpeech(spoken));
  };
  const visit = value => {
    if (typeof value === 'string') add(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, child]) => { if (!metadataFields.has(key)) visit(child); });
    }
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

// Pin the synthesis inputs in the cache key. Changing the engine, voice, rate,
// or pronunciation policy creates a fresh corpus without reusing older speech.
export const AUDIO_CONFIG = Object.freeze({
  engine: 'edge-tts', voice: 'he-IL-HilaNeural', rate: '-15%', version: 1,
});
export const audioId = (text, config = AUDIO_CONFIG) => createHash('sha256')
  .update(JSON.stringify([config.engine, config.voice, config.rate, config.version, normalizeSpeech(text)]))
  .digest('hex').slice(0, 20);

/** Decode the entire file: a nonempty MP3 can still be corrupt or silent. */
export async function validateAudio(path) {
  try {
    const [{ stdout }, { stderr }] = await Promise.all([
      execute('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path], { timeout: 15000 }),
      execute('ffmpeg', ['-hide_banner', '-nostdin', '-xerror', '-i', path, '-af', 'astats=metadata=0:reset=0', '-f', 'null', '-'], { timeout: 15000 }),
    ]);
    const duration = Number(stdout.trim());
    const levels = [...stderr.matchAll(/RMS level dB:\s*(-?inf|[-\d.]+)/g)].map(match => Number(match[1]));
    return Number.isFinite(duration) && duration > 0.08 && duration < 120 && levels.length > 0
      && levels.every(level => Number.isFinite(level) && level > -80);
  } catch { return false; }
}

async function synthesize(text, target, temporary) {
  const executable = process.env.EDGE_TTS_BIN || 'edge-tts';
  let lastError;
  // A transient service failure must not replace the last usable manifest.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await execute(executable, ['--voice', AUDIO_CONFIG.voice, '--rate=' + AUDIO_CONFIG.rate, '--text', text, '--write-media', temporary], { timeout: 45000 });
      if (!await validateAudio(temporary)) throw new Error('The neural service returned silent or invalid audio.');
      await rename(temporary, target);
      return;
    } catch (error) {
      lastError = error;
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        throw new Error('Hebrew audio generation needs edge-tts. Install scripts/requirements-audio.txt in a Python virtual environment, then set EDGE_TTS_BIN to its edge-tts executable.', { cause: error });
      }
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  throw new Error('Failed to record Hebrew text after 3 attempts: ' + text + '. The previous audio manifest is retained.', { cause: lastError });
}

export async function generate({ root = resolve(fileURLToPath(new URL('..', import.meta.url))) } = {}) {
  // Check local tools before downloading any speech or invalidating cached
  // recordings. Missing tools are an environment error, not bad neural audio.
  try {
    await Promise.all(['ffmpeg', 'ffprobe'].map(tool => execute(tool, ['-version'], { timeout: 15000 })));
  } catch (error) {
    throw new Error('Hebrew audio generation needs ffmpeg and ffprobe on PATH.', { cause: error });
  }
  const output = join(root, 'public/audio');
  const curriculum = loadCurriculum(await readFile(join(root, 'public/data.js'), 'utf8'));
  const speech = collectSpeech(curriculum);
  const spoken = [...new Set(speech.values())].sort();
  await mkdir(output, { recursive: true });
  const existing = new Set(await readdir(output));
  // Staging on the same filesystem makes every recording and manifest rename
  // atomic. Existing assets stay available until a complete corpus is ready.
  const temporary = await mkdtemp(join(output, '.generation-'));
  let generated = 0;
  try {
    for (const text of spoken) {
      const filename = audioId(text) + '.mp3';
      const target = join(output, filename);
      if (existing.has(filename) && await validateAudio(target)) continue;
      await synthesize(text, target, join(temporary, filename));
      generated += 1;
      if (generated % 20 === 0) console.log('Recorded ' + generated + ' Hebrew clips.');
    }
    const record = text => ({ url: '/audio/' + audioId(text) + '.mp3', text });
    const entries = Object.fromEntries([...speech].sort(([a], [b]) => a.localeCompare(b, 'he')).map(([key, text]) => [key, record(text)]));
    const prompts = Object.fromEntries(Object.entries(AUDIO_PROMPTS).map(([key, text]) => [key, record(normalizeSpeech(text))]));
    const manifest = {
      ...AUDIO_CONFIG,
      provenance: {
        generator: 'https://github.com/rany2/edge-tts',
        voices: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support',
        pronunciationReview: 'Native Hebrew speaker review is still needed for educational pronunciation, especially isolated syllables.',
      },
      entries, prompts,
    };
    const stagedManifest = join(temporary, 'manifest.json');
    await writeFile(stagedManifest, JSON.stringify(manifest, null, 2) + '\n');
    await rename(stagedManifest, join(output, 'manifest.json'));
    // Only discard obsolete generated MP3s after publishing the full manifest.
    const wanted = new Set(spoken.map(text => audioId(text) + '.mp3'));
    for (const filename of existing) {
      if (/^[a-f0-9]{20}\.mp3$/.test(filename) && !wanted.has(filename)) await unlink(join(output, filename));
    }
    console.log('Hebrew audio: ' + spoken.length + ' recordings, ' + speech.size + ' text aliases (' + generated + ' new).');
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generate();
}
