/* ============================================================
   HEBREW HEROES — curriculum data (data-driven engine)
   All Hebrew content lives here. Screens render from this.
   ============================================================ */

// --- Letters: name + transliteration (for parents) + phonetic sound ---
window.LETTERS = {
  'א': { name: 'Alef',   tl: 'alef',   sound: 'a'  },
  'ב': { name: 'Bet',    tl: 'bet',    sound: 'b'  },
  'ג': { name: 'Gimel',  tl: 'gimel',  sound: 'g'  },
  'ד': { name: 'Dalet',  tl: 'dalet',  sound: 'd'  },
  'ה': { name: 'Hey',    tl: 'hey',    sound: 'h'  },
  'ו': { name: 'Vav',    tl: 'vav',    sound: 'v'  },
  'ז': { name: 'Zayin',  tl: 'zayin',  sound: 'z'  },
  'ח': { name: 'Het',    tl: 'chet',   sound: 'ch' },
  'ט': { name: 'Tet',    tl: 'tet',    sound: 't'  },
  'י': { name: 'Yud',    tl: 'yud',    sound: 'y'  },
  'כ': { name: 'Kaf',    tl: 'kaf',    sound: 'k'  },
  'ל': { name: 'Lamed',  tl: 'lamed',  sound: 'l'  },
  'מ': { name: 'Mem',    tl: 'mem',    sound: 'm'  },
  'נ': { name: 'Nun',    tl: 'nun',    sound: 'n'  },
  'ס': { name: 'Samech', tl: 'samech', sound: 's'  },
  'ע': { name: 'Ayin',   tl: 'ayin',   sound: 'a'  },
  'פ': { name: 'Pey',    tl: 'pey',    sound: 'p'  },
  'צ': { name: 'Tsadi',  tl: 'tsadi',  sound: 'ts' },
  'ק': { name: 'Kuf',    tl: 'kuf',    sound: 'k'  },
  'ר': { name: 'Resh',   tl: 'resh',   sound: 'r'  },
  'ש': { name: 'Shin',   tl: 'shin',   sound: 'sh' },
  'ת': { name: 'Tav',    tl: 'tav',    sound: 't'  },
};

// --- Vocabulary: hebrew → meaning + transliteration + icon key ---
window.WORDS = {
  'כֶּלֶב':  { plain: 'כלב',  tl: 'kelev',  en: 'dog',    icon: 'dog'    },
  'חָתוּל': { plain: 'חתול', tl: 'chatul', en: 'cat',    icon: 'cat'    },
  'דָּג':   { plain: 'דג',   tl: 'dag',    en: 'fish',   icon: 'fish'   },
  'צִיפּוֹר':{ plain: 'ציפור',tl: 'tsipor', en: 'bird',   icon: 'bird'   },
  'סוּס':   { plain: 'סוס',  tl: 'sus',    en: 'horse',  icon: 'horse'  },
  'תַּפּוּחַ':{ plain: 'תפוח', tl: 'tapuach',en: 'apple',  icon: 'apple'  },
  'בָּנָנָה':{ plain: 'בננה', tl: 'banana', en: 'banana', icon: 'banana' },
  'לֶחֶם':  { plain: 'לחם',  tl: 'lechem', en: 'bread',  icon: 'bread'  },
  'חָלָב':  { plain: 'חלב',  tl: 'chalav', en: 'milk',   icon: 'milk'   },
  'בַּיִת':  { plain: 'בית',  tl: 'bayit',  en: 'house',  icon: 'house'  },
  'שֶׁמֶשׁ': { plain: 'שמש',  tl: 'shemesh',en: 'sun',    icon: 'sun'    },
  'סֵפֶר':  { plain: 'ספר',  tl: 'sefer',  en: 'book',   icon: 'book'   },
};

// helper: build an exercise object compactly
const ex = (type, data) => ({ type, ...data });

// --- The world: 8 areas. First three are playable in this prototype. ---
window.AREAS = [
  {
    id: 'aleph-village', name: 'Aleph Village', he: 'כְּפַר אָלֶף',
    theme: 'sun', icon: 'village', blurb: 'Letters & their sounds',
    levels: [
      {
        id: 'av-1', title: 'First Letters', he: 'אוֹתִיּוֹת רִאשׁוֹנוֹת',
        objective: 'Meet your first three letters', teaches: ['א','ב','ג'],
        reward: { kind: 'sticker', icon: 'alef', label: 'Alef Badge' },
        exercises: [
          ex('letter_choice',  { promptKey: 'א', options: ['א','ב','ג','ד'], answer: 'א' }),
          ex('letter_choice',  { promptKey: 'ב', options: ['ג','ב','ה','א'], answer: 'ב' }),
          ex('audio_to_letter',{ speak: 'ג', options: ['ד','א','ג','ב'], answer: 'ג' }),
          ex('letter_choice',  { promptKey: 'ג', options: ['ב','ד','ג','א'], answer: 'ג' }),
        ],
      },
      {
        id: 'av-2', title: 'More Letters', he: 'עוֹד אוֹתִיּוֹת',
        objective: 'Learn ד, ה and ו', teaches: ['ד','ה','ו'],
        reward: { kind: 'sticker', icon: 'star', label: 'Bright Star' },
        exercises: [
          ex('letter_choice',  { promptKey: 'ד', options: ['ה','ד','ו','ג'], answer: 'ד' }),
          ex('audio_to_letter',{ speak: 'ה', options: ['ה','ח','ת','ד'], answer: 'ה' }),
          ex('letter_choice',  { promptKey: 'ו', options: ['ז','ו','ר','ן'], answer: 'ו' }),
          ex('audio_to_letter',{ speak: 'ד', options: ['ר','ד','ה','ו'], answer: 'ד' }),
        ],
      },
      {
        id: 'av-3', title: 'Sound Hunt', he: 'צַיִד צְלִילִים',
        objective: 'Match sounds you hear to letters', teaches: ['ש','מ','ל','ר'],
        reward: { kind: 'sticker', icon: 'trophy', label: 'Letter Champ' },
        exercises: [
          ex('audio_to_letter',{ speak: 'ש', options: ['ס','ש','צ','ז'], answer: 'ש' }),
          ex('audio_to_letter',{ speak: 'מ', options: ['נ','מ','ם','ב'], answer: 'מ' }),
          ex('letter_choice',  { promptKey: 'ל', options: ['ל','ק','כ','נ'], answer: 'ל' }),
          ex('audio_to_letter',{ speak: 'ר', options: ['ד','ר','ו','ז'], answer: 'ר' }),
        ],
      },
    ],
  },
  {
    id: 'word-garden', name: 'Word Garden', he: 'גַּן הַמִּלִּים',
    theme: 'meadow', icon: 'garden', blurb: 'First words & pictures',
    levels: [
      {
        id: 'wg-1', title: 'Animal Friends', he: 'חֲבֵרִים מִן הַחַי',
        objective: 'Learn dog, cat & fish', teaches: ['כֶּלֶב','חָתוּל','דָּג'],
        reward: { kind: 'sticker', icon: 'paw', label: 'Animal Pack' },
        exercises: [
          ex('picture_to_word',{ icon: 'dog',  options: ['כֶּלֶב','חָתוּל','דָּג','סוּס'], answer: 'כֶּלֶב' }),
          ex('audio_to_word',  { speakKey: 'חָתוּל', options: ['דָּג','חָתוּל','כֶּלֶב'], answer: 'חָתוּל' }),
          ex('picture_to_word',{ icon: 'fish', options: ['סוּס','דָּג','צִיפּוֹר','חָתוּל'], answer: 'דָּג' }),
          ex('build_word',     { wordKey: 'כֶּלֶב' }),
        ],
      },
      {
        id: 'wg-2', title: 'Yummy Food', he: 'אֹכֶל טָעִים',
        objective: 'Learn apple, bread & milk', teaches: ['תַּפּוּחַ','לֶחֶם','חָלָב'],
        reward: { kind: 'sticker', icon: 'apple', label: 'Snack Time' },
        exercises: [
          ex('picture_to_word',{ icon: 'apple', options: ['לֶחֶם','תַּפּוּחַ','חָלָב','בָּנָנָה'], answer: 'תַּפּוּחַ' }),
          ex('audio_to_word',  { speakKey: 'לֶחֶם', options: ['חָלָב','לֶחֶם','תַּפּוּחַ'], answer: 'לֶחֶם' }),
          ex('picture_to_word',{ icon: 'milk',  options: ['חָלָב','דָּג','בָּנָנָה','לֶחֶם'], answer: 'חָלָב' }),
          ex('build_word',     { wordKey: 'דָּג' }),
        ],
      },
    ],
  },
  {
    id: 'sentence-bridge', name: 'Sentence Bridge', he: 'גֶּשֶׁר הַמִּשְׁפָּטִים',
    theme: 'grape', icon: 'bridge', blurb: 'Build little sentences',
    levels: [
      {
        id: 'sb-1', title: 'First Sentences', he: 'מִשְׁפָּטִים רִאשׁוֹנִים',
        objective: 'Put words in order', teaches: [],
        reward: { kind: 'sticker', icon: 'medal', label: 'Sentence Star' },
        exercises: [
          ex('sentence_order', { words: ['זֶה','כֶּלֶב'], en: 'This is a dog' }),
          ex('sentence_order', { words: ['אֲנִי','רוֹאֶה','חָתוּל'], en: 'I see a cat' }),
          ex('fill_missing',   { before: 'אֲנִי רוֹאֶה', after: '', blankAnswer: 'דָּג',
                                 options: ['דָּג','אָדֹם','מַיִם'], en: 'I see a ___', iconAnswer: 'fish' }),
          ex('sentence_order', { words: ['הַיֶּלֶד','קוֹרֵא','סֵפֶר'], en: 'The boy reads a book' }),
        ],
      },
    ],
  },
  // --- locked / coming-soon worlds (visible on the map, not yet playable) ---
  { id: 'nikud-forest',  name: 'Nikud Forest',  he: 'יַעַר הַנִּקּוּד',  theme: 'meadow', icon: 'forest',  blurb: 'Vowels & reading',         locked: true },
  { id: 'sound-lake',    name: 'Sound Lake',    he: 'אֲגַם הַצְּלִילִים', theme: 'sky',    icon: 'lake',    blurb: 'Listening & speaking',     locked: true },
  { id: 'story-castle',  name: 'Story Castle',  he: 'טִירַת הַסִּפּוּרִים',theme: 'coral',  icon: 'castle',  blurb: 'Short stories',            locked: true },
  { id: 'market',        name: 'Conversation Market', he: 'שׁוּק הַשִּׂיחָה', theme: 'sun', icon: 'market', blurb: 'Everyday phrases',         locked: true },
  { id: 'challenge-mt',  name: 'Challenge Mountain', he: 'הַר הָאֶתְגָּר',  theme: 'grape',  icon: 'mountain',blurb: 'Mastery & speed rounds',   locked: true },
];

// flat lookup of playable levels in curriculum order
window.LEVEL_ORDER = [];
window.AREAS.forEach(a => { if (a.levels) a.levels.forEach(l => window.LEVEL_ORDER.push({ areaId: a.id, levelId: l.id })); });
