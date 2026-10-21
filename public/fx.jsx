/* ============================================================
   HEBREW HEROES — bundled Hebrew audio, sound chimes and confetti.
   Voice files are generated before deployment; iPad never needs a downloaded voice.
   ============================================================ */

// ---------- global sound settings ----------
window.HH_SOUND = { sfx: true, voice: true };

// A persistent AudioContext, resumed directly inside a tap, lets subsequent
// instructions play on iOS. Fetch/decode happen only after this synchronous unlock.
let _ac = null;
let _voiceManifest = null;
let _voiceGeneration = 0;
let _voiceSource = null;
let _finishVoice = null;
let _lastVoice = null;
const _decodedVoice = new Map();
window.HH_AUDIO = { status: 'locked', error: '', text: '' };

function audioState(status, error = '', text = '') {
  // Device audio changes must not replace the settings action when a parent
  // has turned Hebrew voice off. SFX can still use the same native context.
  if (!window.HH_SOUND.voice) { status = 'muted'; error = ''; }
  window.HH_AUDIO = { status, error, text };
  window.dispatchEvent(new CustomEvent('hh-audio', { detail: window.HH_AUDIO }));
}
function ac() {
  // iOS defaults Web Audio to the ambient/ringer channel, which can be silent
  // even while sources report successful playback. Request the media channel
  // before creating/resuming audio, including after an OS audio-session reset.
  // Other browsers may omit or reject this optional API; normal playback stays
  // available there, without a silent looping media element or background audio.
  try {
    const session = window.navigator?.audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
  } catch (_) { /* Audio Session is optional; native resume remains the fallback. */ }
  if (!_ac || _ac.state === 'closed') {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error('Audio playback is not available in this browser.');
      _ac = new Context();
      const context = _ac;
      // Safari can interrupt audio when the app is backgrounded or an output
      // changes. Settle the active request so speakers never remain stuck.
      context.onstatechange = () => {
        if (context !== _ac || context.state === 'running') return;
        const text = window.HH_AUDIO.text;
        // A queued suspension event can arrive while a NEW request is resuming.
        // Cancel only existing playback/downloads, not that fresh speaker tap.
        if (_voiceSource || window.HH_AUDIO.status === 'loading') stopVoice();
        audioState('locked', 'Tap the speaker to resume sound.', text);
      };
    } catch (error) { audioState('error', error.message); }
  }
  return _ac;
}
function unlockAudio() {
  const context = ac();
  if (!context) return Promise.resolve(false);
  if (context.state === 'running') {
    idleAudioReady();
    return Promise.resolve(true);
  }
  // Each tap must call native resume again, even if a prior non-gesture
  // attempt is still pending (touch activation can arrive after pointerdown).
  // Resume and start a silent frame synchronously in the user gesture. Native
  // resume can stay pending under autoplay restrictions; allow a fresh retry.
  let timer;
  try {
    const resume = context.resume();
    const silent = context.createBufferSource();
    silent.buffer = context.createBuffer(1, 1, context.sampleRate);
    silent.connect(context.destination);
    silent.start();
    return Promise.race([
      resume,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Tap the speaker to turn on sound.')), 3000); }),
    ]).then(() => {
      if (context.state !== 'running') throw new Error('Tap the speaker to turn on sound.');
      idleAudioReady();
      return true;
    }).catch(error => {
      if (context === _ac && context.state !== 'running') audioState('locked', error.message, window.HH_AUDIO.text);
      return false;
    }).finally(() => { clearTimeout(timer); });
  } catch (error) { audioState('locked', error.message, window.HH_AUDIO.text); return Promise.resolve(false); }
}
function idleAudioReady() {
  // Page-level input can resume the native context without retrying a failed
  // recording. Keep that recording's action until explicit retry or cancellation.
  if (!_lastVoice && !['playing', 'loading'].includes(window.HH_AUDIO.status)) audioState('ready');
}
function stopVoice() {
  _voiceGeneration += 1;
  if (_voiceSource) {
    _voiceSource.onended = null;
    try { _voiceSource.stop(); } catch (_) { /* Source may have already ended. */ }
    _voiceSource = null;
  }
  if (_finishVoice) { _finishVoice(false); _finishVoice = null; }
  if (['playing', 'loading'].includes(window.HH_AUDIO.status)) audioState(_ac?.state === 'running' ? 'ready' : 'locked');
}
function stopSpeech() {
  // Navigation/unmount abandons the lesson; interruptions and click-capture
  // takeover use stopVoice instead so a genuine recording failure can retry.
  _lastVoice = null;
  stopVoice();
  audioState(_ac?.state === 'running' ? 'ready' : 'locked');
}
function normalizedSpeech(text) { return String(text || '').normalize('NFC').trim().replace(/\s+/g, ' '); }
async function fetchVoiceAsset(url, format) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Audio file could not load (${response.status}).`);
    // Keep the abort deadline active until the complete body has arrived.
    return await (format === 'json' ? response.json() : response.arrayBuffer());
  } finally { clearTimeout(timeout); }
}
async function loadVoiceManifest() {
  if (!_voiceManifest) {
    _voiceManifest = fetchVoiceAsset('/audio/manifest.json', 'json').catch(error => {
      _voiceManifest = null;
      throw error;
    });
  }
  return _voiceManifest;
}
async function playBundledVoice(text, prompt = false) {
  _lastVoice = { text, prompt };
  stopVoice();
  const generation = _voiceGeneration;
  if (!window.HH_SOUND.voice) { audioState('muted'); return false; }
  const context = ac();
  if (!context) return false;
  // This entry point must unlock itself while still inside the speaker tap;
  // a prior page-level pointer handler may have run before an interruption.
  const resumed = await unlockAudio();
  if (generation !== _voiceGeneration) return false;
  if (!resumed || context.state !== 'running') {
    audioState('locked', 'Tap the speaker to turn on sound.', text);
    return false;
  }
  audioState('loading', '', text);
  try {
    const manifest = await loadVoiceManifest();
    const record = prompt ? manifest.prompts[text] : manifest.entries[normalizedSpeech(text)];
    if (!record) throw new Error('This recording is missing. Connect to the internet and retry the offline download.');
    let buffer = _decodedVoice.get(record.url);
    if (!buffer) {
      const bytes = await fetchVoiceAsset(record.url);
      buffer = await context.decodeAudioData(bytes);
      _decodedVoice.set(record.url, buffer);
    }
    if (generation !== _voiceGeneration) return false;
    if (context.state !== 'running') throw new Error('Tap the speaker to resume sound.');
    return await new Promise(resolve => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      _voiceSource = source;
      _finishVoice = resolve;
      source.onended = () => {
        if (generation !== _voiceGeneration) return;
        _voiceSource = null;
        _finishVoice = null;
        // A later idle suspension must not replay praise from an old activity.
        _lastVoice = null;
        audioState('ready');
        resolve(true);
      };
      audioState('playing', '', record.text);
      source.start();
    });
  } catch (error) {
    if (generation === _voiceGeneration) {
      stopVoice();
      audioState('error', error.message || 'Sound could not play. Tap the speaker to try again.', text);
    }
    return false;
  }
}
function retryVoice() {
  return _lastVoice ? playBundledVoice(_lastVoice.text, _lastVoice.prompt) : unlockAudio();
}
function speakHe(text) { return playBundledVoice(normalizedSpeech(text)); }
function playPrompt(key) { return playBundledVoice(key, true); }

// ---------- WebAudio chimes ----------
function tone(freq, t0, dur, type = 'sine', gain = 0.18) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(c.destination);
  const start = c.currentTime + t0;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.start(start); o.stop(start + dur + 0.02);
}
function chime(kind) {
  if (!window.HH_SOUND.sfx) return;
  const c = ac(); if (!c) return;
  if (c.state !== 'running') unlockAudio();
  if (kind === 'correct') { tone(660,0,.14,'triangle'); tone(880,.10,.18,'triangle'); tone(1175,.20,.30,'triangle'); }
  else if (kind === 'wrong') { tone(300,0,.16,'sine',.12); tone(240,.12,.22,'sine',.12); }
  else if (kind === 'coin') { tone(990,0,.08,'square',.08); tone(1320,.07,.14,'square',.08); }
  else if (kind === 'tap') { tone(520,0,.06,'sine',.10); }
  else if (kind === 'unlock') { [523,659,784,1046].forEach((f,i)=>tone(f,i*.09,.3,'triangle',.14)); }
  else if (kind === 'fanfare') { [523,523,523,659,784].forEach((f,i)=>tone(f,i*.12,.4,'triangle',.16)); tone(1046,.6,.6,'triangle',.16); }
  else if (kind === 'star') { tone(880,0,.12,'triangle'); tone(1320,.08,.25,'triangle'); }
}

// ---------- Confetti burst ----------
function Confetti({ count = 40, origin = 'top' }) {
  const colors = ['#ff7a8a','#ffce4a','#6ee7a8','#8fd6ff','#a98bff','#ff8fd0'];
  const pieces = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    dur: 1.4 + Math.random() * 1.2,
    color: colors[i % colors.length],
    size: 8 + Math.random() * 10,
    rot: Math.random() * 360,
    drift: (Math.random() - 0.5) * 160,
    round: Math.random() > 0.5,
  })), [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 60 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: origin === 'top' ? '-6%' : '40%', left: p.left + '%',
          width: p.size, height: p.size * (p.round ? 1 : 1.6),
          background: p.color, borderRadius: p.round ? '50%' : '3px',
          '--drift': p.drift + 'px', '--rot': p.rot + 'deg',
          animation: `confetti-fall ${p.dur}s cubic-bezier(.3,.6,.6,1) ${p.delay}s both`,
        }} />
      ))}
    </div>
  );
}

// inject confetti keyframes once
if (!document.getElementById('confetti-kf')) {
  const s = document.createElement('style');
  s.id = 'confetti-kf';
  s.textContent = `@keyframes confetti-fall{0%{transform:translateY(0) translateX(0) rotate(0);opacity:1}
    100%{transform:translateY(620px) translateX(var(--drift)) rotate(var(--rot));opacity:0}}`;
  document.head.appendChild(s);
}

Object.assign(window, { speakHe, playPrompt, retryVoice, stopVoice, stopSpeech, unlockAudio, chime, Confetti });
