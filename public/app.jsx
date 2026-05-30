/* ============================================================
   HEBREW HEROES — exercise session + app root + settings
   ============================================================ */

// ---------- a graded run through one level's exercises ----------
function ExerciseSession({ area, level, onComplete, onExit }) {
  const [index, setIndex] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [flash, setFlash] = React.useState(false);
  const total = level.exercises.length;
  const ex = level.exercises[index];

  const solved = React.useCallback(() => {
    window.chime('coin');
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      if (index + 1 >= total) {
        const m = mistakes;
        const stars = m === 0 ? 3 : m <= 2 ? 2 : 1;
        onComplete(stars, total * 5 + stars * 5);
      } else setIndex(index + 1);
    }, 850);
  }, [index, total, mistakes]);

  const wrong = React.useCallback(() => setMistakes(m => m + 1), []);

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#fffaf0,#fff2dc)' }}>
      {/* progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 74, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', zIndex: 45 }}>
        <button className="icon-btn" onClick={onExit} aria-label="Exit" style={{ width: 52, height: 52 }}>
          <span style={{ fontSize: 22, color: 'var(--ink-soft)' }}>✕</span>
        </button>
        <div style={{ flex: 1, height: 22, background: '#ece4d6', borderRadius: 999, overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.1)' }}>
          <div style={{ height: '100%', width: `${(index / total) * 100}%`, background: 'linear-gradient(90deg,#6ee7a8,#34c87f)', borderRadius: 999, transition: 'width .5s cubic-bezier(.3,1.4,.5,1)' }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--ink-soft)', minWidth: 54, textAlign: 'right' }}>{index + 1}/{total}</div>
      </div>

      <ExerciseRenderer key={index} ex={ex} onSolved={solved} onWrong={wrong} />

      {flash && <Confetti count={28} origin="mid" />}
      {flash && (
        <div className="pop-in" style={{ position: 'absolute', top: 96, left: '50%', transform: 'translateX(-50%)', background: 'var(--correct)', color: '#fff', fontWeight: 700, fontSize: 26, padding: '10px 30px', borderRadius: 999, boxShadow: 'var(--soft)', zIndex: 55 }}>
          נכון! Correct!
        </div>
      )}
    </div>
  );
}

// ---------- Settings modal (product-facing, behind gear) ----------
function Settings({ snd, onChange, onClose, onReset }) {
  const Row = ({ label, on, set }) => (
    <button onClick={() => set(!on)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '16px 20px', background: '#fff', borderRadius: 'var(--r-md)', boxShadow: 'var(--pop)', marginBottom: 14 }}>
      <span style={{ fontSize: 21, fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
      <span style={{ width: 60, height: 34, borderRadius: 999, background: on ? 'var(--meadow-2)' : '#d7d0c4', position: 'relative', transition: 'background .2s' }}>
        <span style={{ position: 'absolute', top: 4, left: on ? 30 : 4, width: 26, height: 26, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 2px 4px rgba(0,0,0,.2)' }} />
      </span>
    </button>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(40,36,64,.55)', display: 'grid', placeItems: 'center', zIndex: 60 }}>
      <div className="pop-in" style={{ width: 460, background: 'var(--paper)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--soft-lg)', padding: 32, position: 'relative' }}>
        <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 18, right: 18, width: 44, height: 44, borderRadius: '50%', background: '#f0ece4', fontSize: 22, color: 'var(--ink-soft)' }}>✕</button>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>Settings</div>
        <Row label="🔊 Sound effects" on={snd.sfx} set={v => onChange('sfx', v)} />
        <Row label="🗣️ Hebrew voice" on={snd.voice} set={v => onChange('voice', v)} />
        <Row label="🌿 Reduce motion" on={snd.reduce} set={v => onChange('reduce', v)} />
        <div style={{ borderTop: '2px dashed #e0d8c8', margin: '8px 0 16px' }} />
        <button className="btn ghost" onClick={onReset} style={{ width: '100%', justifyContent: 'center', color: 'var(--coral-deep)', fontSize: 18 }}>Reset all progress</button>
      </div>
    </div>
  );
}

// ============================================================
//  APP ROOT
// ============================================================
const SAVE_KEY = 'hebrew-heroes-v1';
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; }
}

function App() {
  const saved = React.useRef(loadSave()).current;
  const [view, setView] = React.useState('map');            // map|area|preview|session|complete|stickers
  const [areaIdx, setAreaIdx] = React.useState(0);
  const [level, setLevel] = React.useState(null);
  const [lastResult, setLastResult] = React.useState({ stars: 0, coins: 0 });
  const [unlockAll, setUnlockAll] = React.useState(false);

  const [progress, setProgress] = React.useState(saved.progress || {});  // levelId -> stars
  const [coins, setCoins] = React.useState(saved.coins || 0);
  const [stickers, setStickers] = React.useState(saved.stickers || []);
  const [snd, setSnd] = React.useState(saved.snd || { sfx: true, voice: true, reduce: false });
  const [showSettings, setShowSettings] = React.useState(false);

  const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);

  // persist
  React.useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ progress, coins, stickers, snd }));
  }, [progress, coins, stickers, snd]);

  // apply sound + motion settings globally
  React.useEffect(() => {
    window.HH_SOUND.sfx = snd.sfx; window.HH_SOUND.voice = snd.voice;
    document.getElementById('stage').classList.toggle('reduce-motion', !!snd.reduce);
  }, [snd]);

  // expose unlock-all to the Tweaks panel
  React.useEffect(() => { window.__hhTweak = { setUnlockAll, setSnd: (k, v) => setSnd(s => ({ ...s, [k]: v })), getSnd: () => snd }; });

  const playable = AREAS.filter(a => a.levels);
  const areaUnlocked = (i) => {
    const a = AREAS[i];
    if (a.locked) return false;
    if (unlockAll) return true;
    const pIdx = playable.indexOf(a);
    if (pIdx <= 0) return true;
    const prev = playable[pIdx - 1];
    return prev.levels.every(l => progress[l.id]);
  };
  const levelUnlocked = (area, i) => unlockAll || i === 0 || !!progress[area.levels[i - 1].id];

  const setSnding = (k, v) => setSnd(s => ({ ...s, [k]: v }));
  const resetAll = () => { setProgress({}); setCoins(0); setStickers([]); setShowSettings(false); setView('map'); };

  const onComplete = (stars, coinsEarned) => {
    setProgress(p => ({ ...p, [level.id]: Math.max(p[level.id] || 0, stars) }));
    setCoins(c => c + coinsEarned);
    setStickers(s => s.includes(level.reward.label) ? s : [...s, level.reward.label]);
    setLastResult({ stars, coins: coinsEarned });
    setView('complete');
  };

  // next level helper
  const nextLevel = () => {
    if (!level) return null;
    const idxInOrder = window.LEVEL_ORDER.findIndex(o => o.levelId === level.id);
    const nxt = window.LEVEL_ORDER[idxInOrder + 1];
    if (!nxt) return null;
    const a = AREAS.find(x => x.id === nxt.areaId);
    const l = a.levels.find(x => x.id === nxt.levelId);
    return { a, l, areaIdx: AREAS.indexOf(a) };
  };
  const hasNext = !!nextLevel();

  const area = AREAS[areaIdx];

  return (
    <React.Fragment>
      {view === 'map' && (
        <WorldMap progress={progress} areaUnlocked={areaUnlocked} coins={coins} stars={totalStars}
          onArea={(i) => { setAreaIdx(i); setView('area'); }}
          onStickers={() => setView('stickers')} onSettings={() => setShowSettings(true)} />
      )}
      {(view === 'area' || view === 'preview') && (
        <AreaView area={area} progress={progress} levelUnlocked={levelUnlocked} coins={coins} stars={totalStars}
          onLevel={(lv) => { setLevel(lv); setView('preview'); }}
          onBack={() => setView('map')} onStickers={() => setView('stickers')} onSettings={() => setShowSettings(true)} />
      )}
      {view === 'preview' && level && (
        <LevelPreview area={area} level={level} onStart={() => setView('session')} onBack={() => setView('area')} />
      )}
      {view === 'session' && (
        <ExerciseSession area={area} level={level}
          onComplete={onComplete} onExit={() => setView('area')} />
      )}
      {view === 'complete' && (
        <LevelComplete level={level} starsEarned={lastResult.stars} coinsEarned={lastResult.coins}
          hasNext={hasNext}
          onReplay={() => setView('session')}
          onMap={() => setView('map')}
          onNext={() => { const n = nextLevel(); if (n) { setAreaIdx(n.areaIdx); setLevel(n.l); setView('preview'); } }} />
      )}
      {view === 'stickers' && (
        <StickerBook stickers={stickers} coins={coins} stars={totalStars} onBack={() => setView('map')} />
      )}
      {showSettings && (
        <Settings snd={snd} onChange={setSnding} onClose={() => setShowSettings(false)} onReset={resetAll} />
      )}
    </React.Fragment>
  );
}

// ---------- reviewer-facing Tweaks panel (separate, unscaled root) ----------
function HHTweaks() {
  const [t, setTweak] = useTweaks({ sfx: true, voice: true, reduce: false, unlockAll: false });
  React.useEffect(() => {
    const api = window.__hhTweak;
    if (!api) return;
    api.setSnd('sfx', t.sfx); api.setSnd('voice', t.voice); api.setSnd('reduce', t.reduce);
  }, [t.sfx, t.voice, t.reduce]);
  React.useEffect(() => { if (window.__hhTweak) window.__hhTweak.setUnlockAll(t.unlockAll); }, [t.unlockAll]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Sound & motion" />
      <TweakToggle label="Sound effects" value={t.sfx} onChange={v => setTweak('sfx', v)} />
      <TweakToggle label="Hebrew voice" value={t.voice} onChange={v => setTweak('voice', v)} />
      <TweakToggle label="Reduce motion" value={t.reduce} onChange={v => setTweak('reduce', v)} />
      <TweakSection label="Demo" />
      <TweakToggle label="Unlock all worlds" value={t.unlockAll} onChange={v => setTweak('unlockAll', v)} />
    </TweaksPanel>
  );
}

// ---------- mount + responsive scaling ----------
function scaleStage() {
  const stage = document.getElementById('stage');
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
  stage.style.transform = `scale(${s})`;
}
window.addEventListener('resize', scaleStage);
scaleStage();

ReactDOM.createRoot(document.getElementById('stage')).render(<App />);
ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<HHTweaks />);
