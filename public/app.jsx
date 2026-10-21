/* App navigation and durable progress. The exercise components own answer feedback;
   this session owns advancement, and cancels it when a child leaves a lesson. */
function ExerciseSession({ level, onComplete, onExit }) {
  const [index, setIndex] = React.useState(0);
  const [flash, setFlash] = React.useState(false);
  const mistakes = React.useRef(0);
  const advancing = React.useRef(false);
  const timer = React.useRef(null);
  const active = React.useRef(true);
  const total = level.exercises.length;

  React.useEffect(() => () => { active.current = false; clearTimeout(timer.current); window.stopSpeech?.(); }, []);
  React.useEffect(() => { advancing.current = false; }, [index]);

  const solved = () => {
    if (!active.current || advancing.current) return;
    advancing.current = true;
    window.chime('coin');
    setFlash(true);
    timer.current = setTimeout(() => {
      if (!active.current) return;
      setFlash(false);
      if (index + 1 === total) {
        const stars = mistakes.current === 0 ? 3 : mistakes.current <= 2 ? 2 : 1;
        onComplete(stars, total * 5 + stars * 5);
      } else setIndex(current => current + 1);
    }, 650);
  };

  return (
    <main className="session-screen">
      <header className="session-header">
        <button className="icon-btn" onClick={onExit} aria-label="Back to levels"><span aria-hidden="true">⌂</span></button>
        <div className="task-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (flash ? 1 : 0)}>
          {level.exercises.map((_, i) => <span key={i} className={i < index || (i === index && flash) ? 'filled' : i === index ? 'current' : ''} />)}
        </div>
        <OfflineBadge />
      </header>
      <ExerciseRenderer key={index} ex={level.exercises[index]} onSolved={solved} onWrong={() => { mistakes.current++; }} />
      {flash && <div className="success-toast" role="status" aria-label="Well done"><Icon name="star" size={40} /><span aria-hidden="true">✓</span></div>}
      {flash && <Confetti count={18} origin="mid" />}
    </main>
  );
}

function useOffline() {
  const [state, setState] = React.useState(() => window.HH_OFFLINE || { status: 'preparing', completed: 0, total: 0 });
  React.useEffect(() => {
    const changed = event => setState({ ...event.detail });
    window.addEventListener('hh-offline', changed);
    if (window.HH_OFFLINE) setState({ ...window.HH_OFFLINE });
    return () => window.removeEventListener('hh-offline', changed);
  }, []);
  return state;
}

function PlaneMark() {
  return <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M22 11V9l-8-5V2a2 2 0 0 0-4 0v2L2 9v2l8-2v7l-3 2v2l5-1 5 1v-2l-3-2V9z" /></svg>;
}

function OfflineBadge() {
  const offline = useOffline();
  const ready = offline.status === 'ready';
  const label = ready ? 'Ready for airplane' : offline.status === 'error' ? 'Download interrupted. Tap to retry.' : offline.status === 'unsupported' ? 'Offline play unavailable in this browser' : 'Saving for airplane';
  return <button className={`offline-badge ${ready ? 'ready' : ''}`} title={label} aria-label={label} onClick={() => { if (!ready) window.prepareOffline?.(); }}>
    <PlaneMark /><span className="offline-label">{ready ? 'Ready for airplane' : offline.status === 'error' ? 'Retry download' : offline.status === 'unsupported' ? 'Online only' : `${offline.total ? Math.floor(100 * offline.completed / offline.total) : 0}%`}</span>
    <span aria-hidden="true">{ready ? '✓' : offline.status === 'error' ? '↻' : '↓'}</span>
  </button>;
}
window.OfflineBadge = OfflineBadge;

/* Keep parent settings keyboard accessible, including closing and focus return. */
function useDialog(ref, onClose) {
  React.useEffect(() => {
    const previous = document.activeElement;
    const root = ref.current;
    root?.querySelector('button')?.focus();
    const keys = event => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const buttons = [...root.querySelectorAll('button:not(:disabled), a[href], input')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    root?.addEventListener('keydown', keys);
    return () => { root?.removeEventListener('keydown', keys); previous?.focus?.(); };
  }, [onClose]);
}

function Settings({ snd, onChange, onClose, onReset, saved }) {
  const offline = useOffline();
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [downloadResetError, setDownloadResetError] = React.useState('');
  const [holding, setHolding] = React.useState(false);
  const resetTimer = React.useRef(null);
  const dialog = React.useRef(null);
  useDialog(dialog, onClose);
  const cancelReset = () => { clearTimeout(resetTimer.current); resetTimer.current = null; setHolding(false); };
  React.useEffect(() => () => clearTimeout(resetTimer.current), []);
  const holdReset = () => {
    if (resetTimer.current) return;
    setHolding(true);
    resetTimer.current = setTimeout(() => { resetTimer.current = null; onReset(); }, 3000);
  };
  const row = (key, label, symbol) => <button className="setting-row" role="switch" aria-checked={snd[key]} onClick={() => onChange(key, !snd[key])}>
    <span><span aria-hidden="true">{symbol} </span>{label}</span><span className={`toggle ${snd[key] ? 'on' : ''}`} aria-hidden="true"><span /></span>
  </button>;
  return (
    <div className="modal-backdrop">
      <section className="modal-card settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title" ref={dialog}>
        <button className="icon-btn modal-close" onClick={onClose} aria-label="Close settings">✕</button>
        <h2 id="settings-title">For grown-ups</h2>
        {row('voice', 'Hebrew voice', '🔊')}
        {row('sfx', 'Happy sounds', '♫')}
        {row('reduce', 'Less movement', '🌿')}
        <div className="offline-info" role="status">
          <h3><PlaneMark /> {offline.status === 'ready' ? 'Ready for airplane' : 'Save for airplane'}</h3>
          <p>{offline.status === 'ready' ? 'Every lesson, picture, font, and Hebrew recording is saved on this device.' : offline.status === 'unsupported' ? 'Use Safari on the iPad to save the game for offline play.' : 'Keep this page open with Wi-Fi until the airplane shows a green check. The first download includes every world.'}</p>
          {offline.status === 'error' && <><p>The download was interrupted. Connect to Wi-Fi and try again.</p><button className="btn sun" onClick={() => window.prepareOffline?.()}>↻ Retry download</button></>}
          {offline.status === 'preparing' && <progress value={offline.completed} max={offline.total || 1} aria-label="Offline download progress" />}
          <p>On iPad: Safari → Share → Add to Home Screen. Open that icon while online and wait for the green airplane check there too. Before leaving, switch on airplane mode, reopen the game, and tap a speaker.</p>
          <p>To replace an old download, connect to Wi-Fi or mobile data. Resetting the airplane download keeps stars and stickers.</p>
          <button className="btn sun" onClick={() => {
            if (navigator.onLine === false) setDownloadResetError('Connect to Wi-Fi or mobile data before resetting the airplane download.');
            else window.location.assign('/reset-offline.html');
          }}>↻ Reset airplane download</button>
          {downloadResetError && <p role="alert">{downloadResetError}</p>}
          <p>Progress stays on this device. Keep the game installed and avoid clearing Safari website data.</p>
        </div>
        {!saved && <p role="alert">Your device could not save progress. Play still works, but keep this tab open to retain this session.</p>}
        {confirmReset ? <div className="reset-confirm"><p>Grown-ups: hold for 3 seconds to erase stars and stickers.</p>
          <button className={`btn coral ${holding ? 'holding' : ''}`} onPointerDown={holdReset} onPointerUp={cancelReset} onPointerLeave={cancelReset} onPointerCancel={cancelReset} onBlur={cancelReset}
            onKeyDown={event => { if ([' ', 'Enter'].includes(event.key) && !event.repeat) { event.preventDefault(); holdReset(); } }} onKeyUp={cancelReset}>Hold to erase progress</button>
          <button className="btn ghost" onClick={() => { cancelReset(); setConfirmReset(false); }}>Keep progress</button>
        </div> : <button className="reset-link" onClick={() => setConfirmReset(true)}>Reset progress…</button>}
      </section>
    </div>
  );
}

function App() {
  const [save, setSave] = React.useState(() => window.HH_PROGRESS.load());
  const [saveOkay, setSaveOkay] = React.useState(true);
  const [view, setView] = React.useState('map');
  const [areaIdx, setAreaIdx] = React.useState(() => window.HH_PROGRESS.next(save.progress).areaIdx);
  const [level, setLevel] = React.useState(null);
  const [run, setRun] = React.useState(0);
  const [lastResult, setLastResult] = React.useState({ stars: 0, coins: 0 });
  const [showSettings, setShowSettings] = React.useState(false);
  const [audioIssue, setAudioIssue] = React.useState(null);
  const complete = React.useRef(false);
  const { progress, coins, stickers, snd } = save;
  const stars = Object.values(progress).reduce((total, count) => total + count, 0);

  React.useEffect(() => { setSaveOkay(window.HH_PROGRESS.store(save)); }, [save]);
  React.useEffect(() => {
    window.HH_SOUND.sfx = snd.sfx; window.HH_SOUND.voice = snd.voice;
    if (!snd.voice) window.stopSpeech?.();
    else setAudioIssue(current => current?.status === 'muted' ? null : current);
    document.getElementById('stage').classList.toggle('reduce-motion', snd.reduce);
  }, [snd]);
  React.useEffect(() => {
    const unlock = () => window.unlockAudio?.();
    const audio = event => {
      const issue = event.detail;
      setAudioIssue(issue?.status === 'error' || issue?.status === 'muted' || (issue?.status === 'locked' && issue.error) ? issue : null);
    };
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
    window.addEventListener('hh-audio', audio);
    return () => { document.removeEventListener('pointerdown', unlock); document.removeEventListener('keydown', unlock); window.removeEventListener('hh-audio', audio); };
  }, []);

  const areaUnlocked = i => window.HH_PROGRESS.areaUnlocked(i, progress, save.unlockedAreas);
  const levelUnlocked = (area, i) => window.HH_PROGRESS.levelUnlocked(AREAS.indexOf(area), i, progress, save.unlockedAreas);
  const openLevel = (lv, idx = areaIdx) => { window.stopSpeech?.(); window.unlockAudio?.(); setAreaIdx(idx); setLevel(lv); setView('preview'); };
  const start = () => { window.unlockAudio?.(); complete.current = false; setRun(value => value + 1); setView('session'); };
  const onComplete = (earnedStars, earnedCoins) => {
    if (complete.current) return;
    complete.current = true;
    setSave(current => ({ ...current, progress: { ...current.progress, [level.id]: Math.max(current.progress[level.id] || 0, earnedStars) },
      coins: current.coins + earnedCoins, stickers: current.stickers.includes(level.reward.label) ? current.stickers : [...current.stickers, level.reward.label] }));
    setLastResult({ stars: earnedStars, coins: earnedCoins });
    setView('complete');
  };
  const orderIndex = level ? LEVEL_ORDER.findIndex(item => item.levelId === level.id) : -1;
  const next = LEVEL_ORDER[orderIndex + 1];
  const goNext = () => {
    if (!next) return;
    const idx = AREAS.findIndex(item => item.id === next.areaId);
    openLevel(AREAS[idx].levels.find(item => item.id === next.levelId), idx);
  };
  const map = () => { window.stopSpeech?.(); setView('map'); };
  const closeSettings = React.useCallback(() => setShowSettings(false), []);
  const hud = { coins, stars, onStickers: () => setView('stickers'), onSettings: () => setShowSettings(true) };
  const area = AREAS[areaIdx];
  return <>
    {view === 'map' && <WorldMap {...hud} progress={progress} areaUnlocked={areaUnlocked} onArea={i => { setAreaIdx(i); setView('area'); }}
      onPlay={() => { const recommended = window.HH_PROGRESS.next(progress); openLevel(recommended.level, recommended.areaIdx); }} />}
    {(view === 'area' || view === 'preview') && <AreaView {...hud} area={area} progress={progress} levelUnlocked={levelUnlocked} onLevel={lv => openLevel(lv)} onBack={map} />}
    {view === 'preview' && level && <LevelPreview area={area} level={level} onStart={start} onBack={() => setView('area')} />}
    {view === 'session' && level && <ExerciseSession key={`${level.id}-${run}`} level={level} onComplete={onComplete} onExit={() => setView('area')} />}
    {view === 'complete' && <LevelComplete level={level} starsEarned={lastResult.stars} coinsEarned={lastResult.coins} hasNext={!!next} onReplay={start} onMap={map} onNext={goNext} />}
    {view === 'stickers' && <StickerBook stickers={stickers} coins={coins} stars={stars} onBack={map} />}
    {showSettings && <Settings snd={snd} saved={saveOkay} onClose={closeSettings} onChange={(key, value) => setSave(current => ({ ...current, snd: { ...current.snd, [key]: value } }))}
      onReset={() => { window.stopSpeech?.(); setSave(window.HH_PROGRESS.normalize(null)); setShowSettings(false); setLevel(null); setView('map'); }} />}
    {audioIssue && <button className="audio-warning" aria-live="polite"
      onPointerDown={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}
      onClick={() => {
      if (audioIssue.status === 'muted') setShowSettings(true);
      else window.retryVoice?.();
    }}>{audioIssue.status === 'muted' ? '🔇 Hebrew voice is off. Open sound settings' : '🔊 Sound paused. Tap to try again'}</button>}
  </>;
}

ReactDOM.createRoot(document.getElementById('stage')).render(<App />);
