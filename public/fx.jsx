/* ============================================================
   HEBREW HEROES — effects: speech, sound chimes, confetti
   Exposes window.speakHe, window.chime, window.Confetti, window.SoundCtx
   ============================================================ */

// ---------- global sound settings (read by tweaks too) ----------
window.HH_SOUND = { sfx: true, voice: true };

// ---------- Hebrew speech ----------
let _voices = [];
function loadVoices() { _voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; }
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
function speakHe(text) {
  if (!window.HH_SOUND.voice || !window.speechSynthesis || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    u.rate = 0.85;
    const hv = _voices.find(v => /he|iw/i.test(v.lang));
    if (hv) u.voice = hv;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

// ---------- WebAudio chimes ----------
let _ac = null;
function ac() { if (!_ac) { try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} } return _ac; }
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
  if (c.state === 'suspended') c.resume();
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

Object.assign(window, { speakHe, chime, Confetti });
