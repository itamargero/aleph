/* ============================================================
   HEBREW HEROES — complete, data-driven Hebrew curriculum.
   All learning content and speech live here. Letter/word/sentence
   models let a child copy shapes before they can read either language.
   Level ids and existing reward labels are retained for saved progress.
   ============================================================ */

// Hebrew names are spoken when a child meets a letter. Finals are real
// letters in the lookup, so answer cards and recordings never fall back.
window.LETTERS = {
  'א': { name: 'Alef',   nameHe: 'אָלֶף',  tl: 'alef',   sound: 'a' },
  'ב': { name: 'Bet',    nameHe: 'בֵּית',  tl: 'bet',    sound: 'b' },
  'ג': { name: 'Gimel',  nameHe: 'גִּימֶל',tl: 'gimel',  sound: 'g' },
  'ד': { name: 'Dalet',  nameHe: 'דָּלֶת', tl: 'dalet',  sound: 'd' },
  'ה': { name: 'Hey',    nameHe: 'הֵא',    tl: 'hey',    sound: 'h' },
  'ו': { name: 'Vav',    nameHe: 'וָו',    tl: 'vav',    sound: 'v' },
  'ז': { name: 'Zayin',  nameHe: 'זַיִן',  tl: 'zayin',  sound: 'z' },
  'ח': { name: 'Het',    nameHe: 'חֵית',   tl: 'chet',   sound: 'ch' },
  'ט': { name: 'Tet',    nameHe: 'טֵית',   tl: 'tet',    sound: 't' },
  'י': { name: 'Yud',    nameHe: 'יוּד',   tl: 'yud',    sound: 'y' },
  'כ': { name: 'Kaf',    nameHe: 'כַּף',   tl: 'kaf',    sound: 'k' },
  'ל': { name: 'Lamed',  nameHe: 'לָמֶד',  tl: 'lamed',  sound: 'l' },
  'מ': { name: 'Mem',    nameHe: 'מֵם',    tl: 'mem',    sound: 'm' },
  'נ': { name: 'Nun',    nameHe: 'נוּן',   tl: 'nun',    sound: 'n' },
  'ס': { name: 'Samech', nameHe: 'סָמֶךְ', tl: 'samech', sound: 's' },
  'ע': { name: 'Ayin',   nameHe: 'עַיִן',  tl: 'ayin',   sound: 'a' },
  'פ': { name: 'Pey',    nameHe: 'פֵּא',   tl: 'pey',    sound: 'p' },
  'צ': { name: 'Tsadi',  nameHe: 'צָדִי',  tl: 'tsadi',  sound: 'ts' },
  'ק': { name: 'Kuf',    nameHe: 'קוּף',   tl: 'kuf',    sound: 'k' },
  'ר': { name: 'Resh',   nameHe: 'רֵישׁ',  tl: 'resh',   sound: 'r' },
  'ש': { name: 'Shin',   nameHe: 'שִׁין',  tl: 'shin',   sound: 'sh' },
  'ת': { name: 'Tav',    nameHe: 'תָּו',   tl: 'tav',    sound: 't' },
  'ך': { name: 'Final Kaf',   nameHe: 'כַּף סוֹפִית',  tl: 'kaf sofit',   sound: 'ch', finalOf: 'כ' },
  'ם': { name: 'Final Mem',   nameHe: 'מֵם סוֹפִית',   tl: 'mem sofit',   sound: 'm',  finalOf: 'מ' },
  'ן': { name: 'Final Nun',   nameHe: 'נוּן סוֹפִית',  tl: 'nun sofit',   sound: 'n',  finalOf: 'נ' },
  'ף': { name: 'Final Pey',   nameHe: 'פֵּא סוֹפִית',   tl: 'pey sofit',   sound: 'f',  finalOf: 'פ' },
  'ץ': { name: 'Final Tsadi', nameHe: 'צָדִי סוֹפִית',  tl: 'tsadi sofit', sound: 'ts', finalOf: 'צ' },
};

// The pointed form is the curriculum key and recording text; plain is
// the copying model. Every option has a matching, locally drawn picture.
window.WORDS = {
  'כֶּלֶב':   { plain: 'כלב',   tl: 'kelev',   en: 'dog',    icon: 'dog' },
  'חָתוּל':  { plain: 'חתול',  tl: 'chatul',  en: 'cat',    icon: 'cat' },
  'דָּג':    { plain: 'דג',    tl: 'dag',     en: 'fish',   icon: 'fish' },
  'צִפּוֹר': { plain: 'ציפור', tl: 'tsipor',  en: 'bird',   icon: 'bird' },
  'סוּס':    { plain: 'סוס',   tl: 'sus',     en: 'horse',  icon: 'horse' },
  'תַּפּוּחַ': { plain: 'תפוח',  tl: 'tapuach', en: 'apple',  icon: 'apple' },
  'בָּנָנָה': { plain: 'בננה',  tl: 'banana',  en: 'banana', icon: 'banana' },
  'לֶחֶם':   { plain: 'לחם',   tl: 'lechem',  en: 'bread',  icon: 'bread' },
  'חָלָב':   { plain: 'חלב',   tl: 'chalav',  en: 'milk',   icon: 'milk' },
  'בַּיִת':   { plain: 'בית',   tl: 'bayit',   en: 'house',  icon: 'house' },
  'שֶׁמֶשׁ':  { plain: 'שמש',   tl: 'shemesh', en: 'sun',    icon: 'sun' },
  'סֵפֶר':   { plain: 'ספר',   tl: 'sefer',   en: 'book',   icon: 'book' },
};

const ex = (type, data) => ({ type, ...data });
const letter = (answer, options, audio = false) => ex(audio ? 'audio_to_letter' : 'letter_choice', {
  answer, options, model: answer, ...(audio ? { speak: answer } : { promptKey: answer }),
});
const picture = (answer, options) => ex('picture_to_word', { answer, options, icon: window.WORDS[answer].icon });
const listen = (answer, options) => ex('audio_to_picture', { answer, options, speakKey: answer });
const build = wordKey => ex('build_word', { wordKey, model: window.WORDS[wordKey].plain });
const sentence = (words, en, sceneIcons) => ex('sentence_order', { words, en, sceneIcons, model: words.join(' ') });
const fill = (before, blankAnswer, options, en, sceneIcons, after = '') => ex('fill_missing', {
  before, after, blankAnswer, options, en, sceneIcons, iconAnswer: window.WORDS[blankAnswer].icon,
  model: [before, blankAnswer, after].filter(Boolean).join(' '),
});
const vowel = (answer, options) => ex('sound_choice', { answer, options, speak: answer, model: answer });
const story = (narration, sceneIcons, question, answer, options) => ex('story_choice', {
  story: narration, sceneIcons, speak: question, answer, options,
});

// Phrase pictures also act as copying models. The spoken scenario gives
// the meaning, and children may replay every answer before choosing it.
const phrasePictures = {
  'שָׁלוֹם': '👋', 'בֹּקֶר טוֹב': '🌅', 'לַיְלָה טוֹב': '🌙', 'לְהִתְרָאוֹת': '🚶🏠',
  'בְּבַקָּשָׁה': '🤲', 'תּוֹדָה': '🙏', 'סְלִיחָה': '💛', 'עֶזְרָה בְּבַקָּשָׁה': '🆘',
  'כֵּן': '👍', 'לֹא': '👎', 'אֲנִי רְעֵבָה': '🍽️', 'אֲנִי צְמֵאָה': '🥛',
  'אֲנִי רוֹצָה לְשַׂחֵק': '🧸', 'אֵיפֹה הַשֵּׁרוּתִים?': '🚻',
};
const phrase = (answer, options, speak) => ex('phrase_choice', {
  answer, options, speak, sceneEmoji: phrasePictures[answer],
  optionEmojis: Object.fromEntries(options.map(option => [option, phrasePictures[option]])),
});

const morningStory = 'בַּבֹּקֶר הַשֶּׁמֶשׁ זוֹרַחַת. הַכֶּלֶב וְהֶחָתוּל בַּבַּיִת.';
const morningScene = ['house', 'sun', 'dog', 'cat'];
const snackStory = 'הַיְלָדָה אוֹכֶלֶת תַּפּוּחַ וּבָנָנָה. עַל הַשֻּׁלְחָן יֵשׁ לֶחֶם וְחָלָב.';
const snackScene = ['apple', 'banana', 'bread', 'milk'];
const parkStory = 'בַּגַּן יֵשׁ צִפּוֹר וְסוּס. בָּאֲגַם יֵשׁ דָּג. הַיְלָדָה יוֹשֶׁבֶת וְקוֹרֵאת סֵפֶר.';
const parkScene = ['bird', 'horse', 'fish', 'book'];

// All eight worlds are available. The first world has four alphabet
// lessons; the others have three small lessons each, with relaxed retry.
window.AREAS = [
  {
    id: 'aleph-village', name: 'Aleph Village', he: 'כְּפַר אָלֶף',
    theme: 'sun', icon: 'village', blurb: 'Letters & their sounds',
    levels: [
      {
        id: 'av-1', title: 'First Letters', he: 'אוֹתִיּוֹת רִאשׁוֹנוֹת',
        objective: 'Meet א through ז by copying and listening', teaches: ['א','ב','ג','ד','ה','ו','ז'],
        reward: { kind: 'sticker', icon: 'alef', label: 'Alef Badge' },
        exercises: [
          letter('א', ['א','ב','ג','ד']), letter('ב', ['ג','ב','ה','א']),
          letter('ג', ['ד','א','ג','ב'], true), letter('ד', ['ה','ד','ו','ג']),
          letter('ה', ['ה','ח','ת','ד'], true), letter('ו', ['ז','ו','ר','ן']),
          letter('ז', ['ז','ו','ד','ג'], true),
        ],
      },
      {
        id: 'av-2', title: 'More Letters', he: 'עוֹד אוֹתִיּוֹת',
        objective: 'Meet ח through נ with a visible model', teaches: ['ח','ט','י','כ','ל','מ','נ'],
        reward: { kind: 'sticker', icon: 'star', label: 'Bright Star' },
        exercises: [
          letter('ח', ['ה','ח','ת','ד']), letter('ט', ['ט','ס','מ','ח'], true),
          letter('י', ['ו','ז','י','ר']), letter('כ', ['ב','כ','נ','פ'], true),
          letter('ל', ['ל','ק','כ','נ']), letter('מ', ['נ','מ','ם','ב'], true),
          letter('נ', ['ג','נ','כ','ו']),
        ],
      },
      {
        id: 'av-3', title: 'Sound Hunt', he: 'צַיִד צְלִילִים',
        objective: 'Meet ס through ת and complete the alphabet', teaches: ['ס','ע','פ','צ','ק','ר','ש','ת'],
        reward: { kind: 'sticker', icon: 'trophy', label: 'Letter Champ' },
        exercises: [
          letter('ס', ['ס','ם','ט','מ']), letter('ע', ['א','ע','צ','ש'], true),
          letter('פ', ['כ','ב','פ','ס']), letter('צ', ['ע','צ','ש','ז'], true),
          letter('ק', ['ר','ד','ק','ל']), letter('ר', ['ד','ר','ו','ז'], true),
          letter('ש', ['ס','ש','צ','ז'], true), letter('ת', ['ח','ה','ת','מ']),
        ],
      },
      {
        id: 'av-4', title: 'Letters at the End', he: 'אוֹתִיּוֹת סוֹפִיּוֹת',
        objective: 'Recognize the five final letter shapes', teaches: ['ך','ם','ן','ף','ץ'],
        reward: { kind: 'sticker', icon: 'book', label: 'Final Letter Friend' },
        exercises: [
          letter('ך', ['כ','ך','ר','ן']), letter('ם', ['מ','ס','ם','ט'], true),
          letter('ן', ['נ','ו','ך','ן']), letter('ף', ['פ','ף','ך','ץ'], true),
          letter('ץ', ['צ','ע','ץ','ף']),
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
        objective: 'Name five animal friends', teaches: ['כֶּלֶב','חָתוּל','דָּג','צִפּוֹר','סוּס'],
        reward: { kind: 'sticker', icon: 'paw', label: 'Animal Pack' },
        exercises: [
          picture('כֶּלֶב', ['כֶּלֶב','חָתוּל','דָּג']),
          listen('חָתוּל', ['דָּג','חָתוּל','כֶּלֶב']),
          picture('דָּג', ['סוּס','דָּג','צִפּוֹר']), build('כֶּלֶב'),
          listen('צִפּוֹר', ['חָתוּל','צִפּוֹר','סוּס']),
          listen('סוּס', ['סוּס','דָּג','כֶּלֶב']),
        ],
      },
      {
        id: 'wg-2', title: 'Yummy Food', he: 'אֹכֶל טָעִים',
        objective: 'Learn apple, bread, milk and banana', teaches: ['תַּפּוּחַ','לֶחֶם','חָלָב','בָּנָנָה'],
        reward: { kind: 'sticker', icon: 'apple', label: 'Snack Time' },
        exercises: [
          picture('תַּפּוּחַ', ['לֶחֶם','תַּפּוּחַ','בָּנָנָה']),
          listen('לֶחֶם', ['חָלָב','לֶחֶם','תַּפּוּחַ']),
          picture('חָלָב', ['חָלָב','בָּנָנָה','לֶחֶם']), build('לֶחֶם'),
          listen('בָּנָנָה', ['תַּפּוּחַ','לֶחֶם','בָּנָנָה']),
        ],
      },
      {
        id: 'wg-3', title: 'Around Me', he: 'סְבִיבִי',
        objective: 'Recognize home, sun and book', teaches: ['בַּיִת','שֶׁמֶשׁ','סֵפֶר'],
        reward: { kind: 'sticker', icon: 'house', label: 'Little Explorer' },
        exercises: [
          picture('בַּיִת', ['בַּיִת','סֵפֶר','שֶׁמֶשׁ']),
          listen('שֶׁמֶשׁ', ['סֵפֶר','שֶׁמֶשׁ','בַּיִת']),
          picture('סֵפֶר', ['שֶׁמֶשׁ','סֵפֶר','בַּיִת']), build('סֵפֶר'),
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
        objective: 'Copy short sentences from right to left', teaches: ['זֶה','אֲנִי','רוֹאֶה'],
        reward: { kind: 'sticker', icon: 'medal', label: 'Sentence Star' },
        exercises: [
          sentence(['זֶה','כֶּלֶב'], 'This is a dog', ['dog']),
          sentence(['אֲנִי','רוֹאֶה','חָתוּל'], 'I see a cat', ['cat']),
          fill('אֲנִי רוֹאֶה', 'דָּג', ['דָּג','כֶּלֶב','חָתוּל'], 'I see a fish', ['fish']),
          sentence(['הַיֶּלֶד','קוֹרֵא','סֵפֶר'], 'The boy reads a book', ['book']),
        ],
      },
      {
        id: 'sb-2', title: 'Home and Sunshine', he: 'בַּיִת וְשֶׁמֶשׁ',
        objective: 'Copy sentences about familiar pictures', teaches: ['זוֹ','רוֹאָה'],
        reward: { kind: 'sticker', icon: 'sun', label: 'Sunshine Speaker' },
        exercises: [
          sentence(['זֶה','בַּיִת'], 'This is a house', ['house']),
          sentence(['זוֹ','שֶׁמֶשׁ'], 'This is the sun', ['sun']),
          fill('אֲנִי רוֹאָה', 'צִפּוֹר', ['סוּס','צִפּוֹר','דָּג'], 'I see a bird', ['bird']),
          sentence(['אֲנִי','קוֹרֵאת','סֵפֶר'], 'I read a book', ['book']),
        ],
      },
      {
        id: 'sb-3', title: 'Snack Sentences', he: 'מִשְׁפָּטִים טְעִימִים',
        objective: 'Talk about eating and drinking', teaches: ['אוֹכֶלֶת','שׁוֹתָה'],
        reward: { kind: 'sticker', icon: 'bread', label: 'Picnic Poet' },
        exercises: [
          sentence(['אֲנִי','אוֹכֶלֶת','תַּפּוּחַ'], 'I eat an apple', ['apple']),
          fill('אֲנִי שׁוֹתָה', 'חָלָב', ['לֶחֶם','חָלָב','בָּנָנָה'], 'I drink milk', ['milk']),
          sentence(['אֲנִי','אוֹכֶלֶת','בָּנָנָה'], 'I eat a banana', ['banana']),
          fill('אֲנִי אוֹכֶלֶת', 'לֶחֶם', ['לֶחֶם','חָלָב','תַּפּוּחַ'], 'I eat bread', ['bread']),
        ],
      },
    ],
  },
  {
    id: 'nikud-forest', name: 'Nikud Forest', he: 'יַעַר הַנִּקּוּד',
    theme: 'meadow', icon: 'forest', blurb: 'Little marks & vowel sounds',
    levels: [
      {
        id: 'nf-1', title: 'Ah and Eh', he: 'פַּתָּח, קָמָץ, סֶגוֹל וְצֵירֵי',
        objective: 'See and hear a and e vowel marks', teaches: ['בַּ','מַ','בֶּ','מֶ','בָּ','בֵּ'],
        reward: { kind: 'sticker', icon: 'garden', label: 'Vowel Sprout' },
        exercises: [
          vowel('בַּ', ['בִּ','בַּ','בֹּ']), vowel('מַ', ['מַ','מִ','מֶ']),
          vowel('בֶּ', ['בַּ','בֻּ','בֶּ']), vowel('מֶ', ['מִ','מֶ','מֹ']),
          vowel('בָּ', ['בִּ','בָּ','בֹּ']), vowel('בֵּ', ['בָּ','בֻּ','בֵּ']),
        ],
      },
      {
        id: 'nf-2', title: 'Ee and Oh', he: 'חִירִיק וְחוֹלָם',
        objective: 'Match i and o sounds to the model', teaches: ['בִּ','מִ','בֹּ','מֹ'],
        reward: { kind: 'sticker', icon: 'bird', label: 'Vowel Songbird' },
        exercises: [
          vowel('בִּ', ['בָּ','בִּ','בֶּ']), vowel('מִ', ['מִ','מֹ','מַ']),
          vowel('בֹּ', ['בֶּ','בָּ','בֹּ']), vowel('מֹ', ['מַ','מֹ','מִ']),
        ],
      },
      {
        id: 'nf-3', title: 'Oo and Joining Sounds', he: 'קֻבּוּץ, שׁוּרוּק וּשְׁוָא',
        objective: 'Explore u marks and a short joining sound', teaches: ['בֻּ','שׁוּ','מוּ','שְׁמַע'],
        reward: { kind: 'sticker', icon: 'forest', label: 'Forest Sound Friend' },
        exercises: [
          vowel('בֻּ', ['בֻּ','בַּ','בִּ']), vowel('שׁוּ', ['שָׁ','שׁוּ','שִׁ']),
          vowel('מוּ', ['מִ','מֶ','מוּ']), vowel('שְׁמַע', ['שָׁמַע','שְׁמַע','שִׁמַע']),
        ],
      },
    ],
  },
  {
    id: 'sound-lake', name: 'Sound Lake', he: 'אֲגַם הַצְּלִילִים',
    theme: 'sky', icon: 'lake', blurb: 'Listen & find the picture',
    levels: [
      {
        id: 'sl-1', title: 'Animal Sounds', he: 'מַקְשִׁיבִים לְחַיּוֹת',
        objective: 'Hear the word and tap its animal picture', teaches: ['כֶּלֶב','חָתוּל','דָּג','צִפּוֹר'],
        reward: { kind: 'sticker', icon: 'fish', label: 'Lake Listener' },
        exercises: [
          listen('כֶּלֶב', ['דָּג','כֶּלֶב','חָתוּל']), listen('חָתוּל', ['חָתוּל','סוּס','צִפּוֹר']),
          listen('דָּג', ['כֶּלֶב','צִפּוֹר','דָּג']), listen('צִפּוֹר', ['סוּס','צִפּוֹר','חָתוּל']),
        ],
      },
      {
        id: 'sl-2', title: 'Listen at the Picnic', he: 'מַקְשִׁיבִים בַּפִּיקְנִיק',
        objective: 'Listen to familiar food and an animal', teaches: ['סוּס','חָלָב','לֶחֶם','תַּפּוּחַ'],
        reward: { kind: 'sticker', icon: 'milk', label: 'Picnic Listener' },
        exercises: [
          listen('סוּס', ['כֶּלֶב','סוּס','דָּג']), listen('חָלָב', ['חָלָב','לֶחֶם','תַּפּוּחַ']),
          listen('לֶחֶם', ['תַּפּוּחַ','בָּנָנָה','לֶחֶם']), listen('תַּפּוּחַ', ['חָלָב','תַּפּוּחַ','לֶחֶם']),
        ],
      },
      {
        id: 'sl-3', title: 'Listen All Around', he: 'מַקְשִׁיבִים סְבִיבֵנוּ',
        objective: 'Find four more pictures by listening', teaches: ['בָּנָנָה','בַּיִת','סֵפֶר','שֶׁמֶשׁ'],
        reward: { kind: 'sticker', icon: 'lake', label: 'Sound Sailor' },
        exercises: [
          listen('בָּנָנָה', ['בָּנָנָה','תַּפּוּחַ','לֶחֶם']), listen('בַּיִת', ['סֵפֶר','בַּיִת','שֶׁמֶשׁ']),
          listen('סֵפֶר', ['שֶׁמֶשׁ','בַּיִת','סֵפֶר']), listen('שֶׁמֶשׁ', ['בַּיִת','שֶׁמֶשׁ','סֵפֶר']),
        ],
      },
    ],
  },
  {
    id: 'story-castle', name: 'Story Castle', he: 'טִירַת הַסִּפּוּרִים',
    theme: 'coral', icon: 'castle', blurb: 'Listen to picture stories',
    levels: [
      {
        id: 'sc-1', title: 'A Sunny Morning', he: 'בֹּקֶר שִׁמְשִׁי',
        objective: 'Listen to a short story about home', teaches: ['כֶּלֶב','חָתוּל','בַּיִת','שֶׁמֶשׁ'],
        reward: { kind: 'sticker', icon: 'castle', label: 'Morning Story Friend' },
        exercises: [
          story(morningStory, morningScene, 'מִי אוֹמֵר הַב הַב?', 'כֶּלֶב', ['חָתוּל','כֶּלֶב','שֶׁמֶשׁ']),
          story(morningStory, morningScene, 'מִי אוֹמֵר מְיָאוּ?', 'חָתוּל', ['כֶּלֶב','בַּיִת','חָתוּל']),
          story(morningStory, morningScene, 'אֵיפֹה הַכֶּלֶב וְהֶחָתוּל?', 'בַּיִת', ['בַּיִת','שֶׁמֶשׁ','כֶּלֶב']),
          story(morningStory, morningScene, 'מִצְאוּ אֶת הַשֶּׁמֶשׁ שֶׁבַּסִּפּוּר.', 'שֶׁמֶשׁ', ['חָתוּל','שֶׁמֶשׁ','בַּיִת']),
        ],
      },
      {
        id: 'sc-2', title: 'A Tasty Picnic', he: 'פִּיקְנִיק טָעִים',
        objective: 'Listen and find the foods in the story', teaches: ['תַּפּוּחַ','בָּנָנָה','לֶחֶם','חָלָב'],
        reward: { kind: 'sticker', icon: 'banana', label: 'Picnic Story Friend' },
        exercises: [
          story(snackStory, snackScene, 'מָה שׁוֹתִים?', 'חָלָב', ['לֶחֶם','חָלָב','בָּנָנָה']),
          story(snackStory, snackScene, 'מָה עָגוֹל וְאָדֹם?', 'תַּפּוּחַ', ['תַּפּוּחַ','לֶחֶם','חָלָב']),
          story(snackStory, snackScene, 'מָה צָהֹב וְאָרֹךְ?', 'בָּנָנָה', ['חָלָב','בָּנָנָה','תַּפּוּחַ']),
          story(snackStory, snackScene, 'מִצְאוּ אֶת הַלֶּחֶם שֶׁבַּסִּפּוּר.', 'לֶחֶם', ['בָּנָנָה','תַּפּוּחַ','לֶחֶם']),
        ],
      },
      {
        id: 'sc-3', title: 'A Day in the Park', he: 'יוֹם בַּגַּן',
        objective: 'Find animals and a book in a picture story', teaches: ['צִפּוֹר','סוּס','דָּג','סֵפֶר'],
        reward: { kind: 'sticker', icon: 'horse', label: 'Park Story Friend' },
        exercises: [
          story(parkStory, parkScene, 'מִי שׂוֹחֶה בַּמַּיִם?', 'דָּג', ['צִפּוֹר','סוּס','דָּג']),
          story(parkStory, parkScene, 'מִי עָף בַּשָּׁמַיִם?', 'צִפּוֹר', ['דָּג','צִפּוֹר','סוּס']),
          story(parkStory, parkScene, 'מָה הַיְלָדָה קוֹרֵאת?', 'סֵפֶר', ['סֵפֶר','סוּס','דָּג']),
          story(parkStory, parkScene, 'מִצְאוּ אֶת הַסּוּס שֶׁבַּסִּפּוּר.', 'סוּס', ['צִפּוֹר','סוּס','סֵפֶר']),
        ],
      },
    ],
  },
  {
    id: 'market', name: 'Conversation Market', he: 'שׁוּק הַשִּׂיחָה',
    theme: 'sun', icon: 'market', blurb: 'Useful everyday phrases',
    levels: [
      {
        id: 'mk-1', title: 'Hello and Goodbye', he: 'שָׁלוֹם וּלְהִתְרָאוֹת',
        objective: 'Greet friends, morning and bedtime', teaches: ['שָׁלוֹם','בֹּקֶר טוֹב','לַיְלָה טוֹב','לְהִתְרָאוֹת'],
        reward: { kind: 'sticker', icon: 'market', label: 'Friendly Greeter' },
        exercises: [
          phrase('שָׁלוֹם', ['שָׁלוֹם','לַיְלָה טוֹב','תּוֹדָה'], 'פָּגַשְׁנוּ חָבֵר. בּוֹאוּ נֹאמַר שָׁלוֹם.'),
          phrase('בֹּקֶר טוֹב', ['לַיְלָה טוֹב','בֹּקֶר טוֹב','לְהִתְרָאוֹת'], 'הַשֶּׁמֶשׁ זוֹרַחַת. בּוֹאוּ נֹאמַר בֹּקֶר טוֹב.'),
          phrase('לַיְלָה טוֹב', ['בֹּקֶר טוֹב','שָׁלוֹם','לַיְלָה טוֹב'], 'הִגִּיעַ זְמַן לִישׁוֹן. בּוֹאוּ נֹאמַר לַיְלָה טוֹב.'),
          phrase('לְהִתְרָאוֹת', ['לְהִתְרָאוֹת','תּוֹדָה','בֹּקֶר טוֹב'], 'הַחָבֵר הוֹלֵךְ הַבַּיְתָה. בּוֹאוּ נֹאמַר לְהִתְרָאוֹת.'),
        ],
      },
      {
        id: 'mk-2', title: 'Kind Words', he: 'מִלִּים טוֹבוֹת',
        objective: 'Say please, thank you, sorry and ask for help', teaches: ['בְּבַקָּשָׁה','תּוֹדָה','סְלִיחָה','עֶזְרָה בְּבַקָּשָׁה'],
        reward: { kind: 'sticker', icon: 'star', label: 'Kind Word Friend' },
        exercises: [
          phrase('בְּבַקָּשָׁה', ['תּוֹדָה','בְּבַקָּשָׁה','לֹא'], 'רוֹצִים לְבַקֵּשׁ מַשֶּׁהוּ? אוֹמְרִים בְּבַקָּשָׁה.'),
          phrase('תּוֹדָה', ['כֵּן','סְלִיחָה','תּוֹדָה'], 'קִבַּלְנוּ מַתָּנָה. בּוֹאוּ נֹאמַר תּוֹדָה.'),
          phrase('סְלִיחָה', ['סְלִיחָה','תּוֹדָה','שָׁלוֹם'], 'עָשִׂינוּ טָעוּת. בּוֹאוּ נֹאמַר סְלִיחָה.'),
          phrase('עֶזְרָה בְּבַקָּשָׁה', ['בְּבַקָּשָׁה','עֶזְרָה בְּבַקָּשָׁה','לֹא'], 'צְרִיכִים עֶזְרָה? בּוֹאוּ נֹאמַר עֶזְרָה בְּבַקָּשָׁה.'),
        ],
      },
      {
        id: 'mk-3', title: 'What I Need', he: 'מָה אֲנִי צְרִיכָה',
        objective: 'Ask for food, a drink, play or the bathroom', teaches: ['אֲנִי רְעֵבָה','אֲנִי צְמֵאָה','אֲנִי רוֹצָה לְשַׂחֵק','אֵיפֹה הַשֵּׁרוּתִים?'],
        reward: { kind: 'sticker', icon: 'medal', label: 'Everyday Speaker' },
        exercises: [
          phrase('אֲנִי רְעֵבָה', ['אֲנִי צְמֵאָה','אֲנִי רְעֵבָה','אֲנִי רוֹצָה לְשַׂחֵק'], 'רוֹצִים לֶאֱכֹל? אֶפְשָׁר לוֹמַר אֲנִי רְעֵבָה.'),
          phrase('אֲנִי צְמֵאָה', ['אֲנִי צְמֵאָה','אֵיפֹה הַשֵּׁרוּתִים?','אֲנִי רְעֵבָה'], 'רוֹצִים לִשְׁתּוֹת? אֶפְשָׁר לוֹמַר אֲנִי צְמֵאָה.'),
          phrase('אֲנִי רוֹצָה לְשַׂחֵק', ['אֲנִי רְעֵבָה','אֲנִי צְמֵאָה','אֲנִי רוֹצָה לְשַׂחֵק'], 'הִגִּיעַ זְמַן לְשַׂחֵק. אֶפְשָׁר לוֹמַר אֲנִי רוֹצָה לְשַׂחֵק.'),
          phrase('אֵיפֹה הַשֵּׁרוּתִים?', ['אֲנִי רוֹצָה לְשַׂחֵק','אֵיפֹה הַשֵּׁרוּתִים?','אֲנִי רְעֵבָה'], 'צְרִיכִים שֵׁרוּתִים? אֶפְשָׁר לִשְׁאֹל אֵיפֹה הַשֵּׁרוּתִים.'),
        ],
      },
    ],
  },
  {
    id: 'challenge-mt', name: 'Challenge Mountain', he: 'הַר הָאֶתְגָּר',
    theme: 'grape', icon: 'mountain', blurb: 'Practice at your own pace',
    levels: [
      {
        id: 'cm-1', title: 'Shape and Sound Review', he: 'חוֹזְרִים עַל אוֹתִיּוֹת',
        objective: 'Play with letters, finals and vowels without a timer', teaches: ['א','ם','בִּ','חָתוּל'],
        reward: { kind: 'sticker', icon: 'mountain', label: 'Shape Explorer' },
        exercises: [
          letter('א', ['ע','א','ש','מ'], true), letter('ם', ['מ','ס','ם','ט']),
          vowel('בִּ', ['בֻּ','בִּ','בָּ']), listen('חָתוּל', ['כֶּלֶב','חָתוּל','צִפּוֹר']),
        ],
      },
      {
        id: 'cm-2', title: 'Word and Picture Review', he: 'חוֹזְרִים עַל מִלִּים',
        objective: 'Copy words, listen and complete a sentence', teaches: ['סֵפֶר','בָּנָנָה','סוּס','לֶחֶם'],
        reward: { kind: 'sticker', icon: 'trophy', label: 'Word Explorer' },
        exercises: [
          build('סֵפֶר'), picture('בָּנָנָה', ['תַּפּוּחַ','בָּנָנָה','לֶחֶם']),
          listen('סוּס', ['סוּס','חָתוּל','דָּג']),
          fill('אֲנִי אוֹכֶלֶת', 'לֶחֶם', ['חָלָב','לֶחֶם','בָּנָנָה'], 'I eat bread', ['bread']),
        ],
      },
      {
        id: 'cm-3', title: 'My Hebrew Adventure', he: 'הַהַרְפַּתְקָה שֶׁלִּי בְּעִבְרִית',
        objective: 'Celebrate sentences, stories, kind words and listening', teaches: ['צִפּוֹר','סֵפֶר','תּוֹדָה','דָּג'],
        reward: { kind: 'sticker', icon: 'medal', label: 'Hebrew Hero' },
        exercises: [
          sentence(['אֲנִי','רוֹאָה','צִפּוֹר'], 'I see a bird', ['bird']),
          story('הַשֶּׁמֶשׁ זוֹרַחַת. אֲנִי קוֹרֵאת סֵפֶר.', ['sun','book'], 'מָה אֲנִי קוֹרֵאת?', 'סֵפֶר', ['שֶׁמֶשׁ','סֵפֶר','בַּיִת']),
          phrase('תּוֹדָה', ['בְּבַקָּשָׁה','תּוֹדָה','סְלִיחָה'], 'קִבַּלְנוּ עֶזְרָה. בּוֹאוּ נֹאמַר תּוֹדָה.'),
          listen('דָּג', ['צִפּוֹר','כֶּלֶב','דָּג']),
        ],
      },
    ],
  },
];

// Used for saved progress and the continue-play button. Keeping this
// derived from the map ensures every visible level is reachable.
window.LEVEL_ORDER = window.AREAS.flatMap(area => area.levels.map(level => ({
  areaId: area.id, levelId: level.id,
})));
