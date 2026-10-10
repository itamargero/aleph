/* Responsive illustrated navigation. Pictures and play controls lead; words are supplemental. */
function PlayGlyph({ size = 32 }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><path d="M10 5 Q7 3 7 7 V25 Q7 29 10 27 L27 18 Q30 16 27 14Z" fill="currentColor"/></svg>;
}
function HomeGlyph() {
  return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M3 15 16 4l13 11M7 13v15h18V13M13 28V18h6v10" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function TopBar({ coins, stars, onStickers, onSettings }) {
  const Status = window.OfflineBadge;
  return <header className="top-bar">
    <div className="score-pills"><Pill icon="coin" value={coins}/><Pill icon="star" value={stars}/></div>
    <div className="top-actions">{Status && <Status/>}
      {onStickers && <button className="icon-btn" onClick={onStickers} aria-label="Sticker book"><Icon name="medal" size={36}/></button>}
      {onSettings && <button className="icon-btn settings-button" onClick={onSettings} aria-label="Parent settings"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="m10 2-1 3-3 1-3-1-2 4 3 2v2l-3 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-3-2v-2l3-2-2-4-3 1-3-1-1-3z"/></svg></button>}
    </div>
  </header>;
}
function Pill({ icon, value }) {
  return <div className="score-pill" aria-label={`${value} ${icon === 'coin' ? 'coins' : 'stars'}`}><Icon name={icon} size={30}/><span>{value}</span></div>;
}
function ProgressDots({ total, done }) {
  return <div className="progress-dots" aria-label={`${done} of ${total} levels complete`}>{Array.from({length:total}, (_, i) => <span key={i} className={i < done ? 'filled' : ''}>{i < done ? '✓' : ''}</span>)}</div>;
}
function WorldMap({ progress, areaUnlocked, coins, stars, onArea, onStickers, onSettings, onPlay }) {
  const current = AREAS.findIndex((a, i) => areaUnlocked(i) && a.levels?.some(l => !progress[l.id]));
  const playIndex = current >= 0 ? current : 0;
  return <div className="screen world-screen">
    <TopBar coins={coins} stars={stars} onStickers={onStickers} onSettings={onSettings}/>
    <main className="world-content">
      <section className="welcome-garden" aria-label="Start your Hebrew adventure">
        <div className="welcome-mascot"><Mascot mood="cheer" size={132}/><span className="welcome-sparkle" aria-hidden="true">✦</span></div>
        <div className="welcome-title"><h1 className="he" lang="he">בואו נשחק!</h1><span className="subtle-label">Hebrew Heroes</span></div>
        <button className="btn go big-play" onClick={onPlay || (() => onArea(playIndex))} aria-label="Play next lesson"><PlayGlyph size={48}/><span className="he" lang="he">קדימה</span></button>
      </section>
      <div className="world-grid" aria-label="Learning worlds">
        {AREAS.map((a, i) => {
          const unlocked = areaUnlocked(i), levels = a.levels || [];
          const done = levels.filter(l => progress[l.id]).length;
          return <button key={a.id} className={`world-card theme-${a.theme}${i === current ? ' current-world' : ''}${!unlocked ? ' locked-world' : ''}`} onClick={() => onArea(i)} disabled={!unlocked} aria-label={`${a.name}, ${unlocked ? `${done} of ${levels.length} levels complete` : 'locked'}`}>
            <span className="world-picture"><Icon name={a.icon} size={88}/>{!unlocked && <span className="world-lock"><Icon name="lock" size={32}/></span>}{unlocked && done === levels.length && <span className="world-lock"><Icon name="star" size={32}/></span>}</span>
            <span className="world-name he" lang="he">{a.he}</span>
            <ProgressDots total={levels.length} done={done}/>
            {i === current && <span className="world-play-cue"><PlayGlyph size={20}/></span>}
          </button>;
        })}
      </div>
    </main>
  </div>;
}
function AreaView({ area, progress, levelUnlocked, coins, stars, onLevel, onBack, onStickers, onSettings }) {
  return <div className={`screen area-screen theme-${area.theme}`}>
    <TopBar coins={coins} stars={stars} onStickers={onStickers} onSettings={onSettings}/>
    <main className="area-content">
      <div className="screen-heading"><button className="icon-btn" onClick={onBack} aria-label="Back to map"><HomeGlyph/></button><div className="area-title"><Icon name={area.icon} size={70}/><h1 className="he" lang="he">{area.he}</h1></div><span className="heading-spacer"/></div>
      <div className="level-grid">
        {area.levels.map((lv, i) => {
          const earned = progress[lv.id] || 0, unlocked = levelUnlocked(area, i);
          const next = unlocked && !earned && (i === 0 || progress[area.levels[i-1].id]);
          const first = lv.exercises[0];
          const word = WORDS[first?.wordKey || first?.answer];
          return <button key={lv.id} onClick={() => onLevel(lv)} disabled={!unlocked} className={`level-card${next ? ' next-level' : ''}${!unlocked ? ' locked-world' : ''}`} aria-label={`${lv.title}, ${unlocked ? `${earned} stars` : 'locked'}`}>
            <span className="level-number">{i+1}</span>
            <span className="level-picture">{!unlocked ? <Icon name="lock" size={68}/> : word ? <Icon name={word.icon} size={90}/> : first?.promptKey ? <span className="he level-letter">{first.promptKey}</span> : <Icon name={lv.reward.icon} size={90}/>}</span>
            <span className="he level-title" lang="he">{lv.he}</span>
            <span className="star-row">{[0,1,2].map(s => <Icon key={s} name="star" size={28} style={{opacity:s<earned ? 1 : .25}}/>)}</span>
            {next && <span className="level-play"><PlayGlyph size={24}/></span>}
          </button>;
        })}
      </div>
      <div className="garden-friend" aria-hidden="true"><Mascot size={112} mood="happy"/></div>
    </main>
  </div>;
}
// Native dialogs are not used because the static shell also hosts the parent settings modal.
// Focus returns to the opener and keyboard focus stays in the active child dialog.
function useChildDialog(ref, onClose) {
  React.useEffect(() => {
    const previous = document.activeElement;
    const panel = ref.current;
    panel?.querySelector('[data-autofocus]')?.focus();
    const key = (event) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab') return;
      const buttons = Array.from(panel.querySelectorAll('button:not(:disabled)'));
      const first = buttons[0], last = buttons[buttons.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    panel?.addEventListener('keydown', key);
    return () => { panel?.removeEventListener('keydown', key); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
}
function LevelPreview({ area, level, onStart, onBack }) {
  const ref = React.useRef(null); useChildDialog(ref, onBack);
  return <div className="modal-backdrop child-preview">
    <section ref={ref} className="modal-card preview-card" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <button className="icon-btn modal-close" onClick={onBack} aria-label="Close lesson preview">✕</button>
      <div className="preview-hero"><Mascot mood="cheer" size={108}/><Icon name={area.icon} size={96}/></div>
      <h2 id="preview-title" className="he" lang="he">{level.he}</h2>
      <div className="teaching-pictures" dir="rtl">{level.teaches.map((t, i) => {
        const word = WORDS[t];
        return <button key={i} className="teaching-chip" onClick={() => { window.unlockAudio?.(); window.speakHe(t); }} aria-label={`Listen to ${word?.en || LETTERS[t]?.name || t}`}>{word && <Icon name={word.icon} size={58}/>}<span className="he">{word?.plain || t}</span><span className="tiny-speaker" aria-hidden="true">♫</span></button>;
      })}</div>
      <div className="preview-reward" aria-label={`Reward: ${level.reward.label}`}><Icon name={level.reward.icon} size={50}/><ProgressDots total={level.exercises.length} done={0}/></div>
      <button data-autofocus className="btn go preview-start" onClick={onStart} aria-label="Start lesson"><PlayGlyph size={40}/><span className="he" lang="he">קדימה!</span></button>
    </section>
  </div>;
}
function LevelComplete({ level, starsEarned, coinsEarned, onReplay, onMap, onNext, hasNext }) {
  const [chestOpen, setChestOpen] = React.useState(false);
  React.useEffect(() => { window.chime('fanfare'); const timer = setTimeout(() => { setChestOpen(true); window.chime('unlock'); }, 700); return () => clearTimeout(timer); }, []);
  return <div className="screen complete-screen"><Confetti count={42}/><main className="complete-content">
    <h1 className="he" lang="he">כל הכבוד!</h1>
    <div className="complete-stars">{[0,1,2].map(s => <span key={s} className={s<starsEarned ? 'pop-in' : ''} style={{opacity:s<starsEarned ? 1 : .25}}><Icon name="star" size={s === 1 ? 84 : 70}/></span>)}</div>
    <Mascot mood="cheer" size={120}/>
    <button className="chest-button" onClick={() => { if (!chestOpen) { setChestOpen(true); window.chime('unlock'); } }} aria-label="Open reward chest" disabled={chestOpen}><Chest open={chestOpen}/>{!chestOpen && <span className="tap-cue" aria-hidden="true">☝</span>}</button>
    {chestOpen && <div className="reward-card pop-in"><Icon name={level.reward.icon} size={76}/><span className="reward-coins">+{coinsEarned}<Icon name="coin" size={30}/></span></div>}
    <div className="complete-actions">
      <button className="icon-btn" onClick={onMap} aria-label="Back to map"><HomeGlyph/></button>
      <button className="icon-btn replay-button" onClick={onReplay} aria-label="Replay lesson">↻</button>
      {hasNext && <button className="btn sun next-button" onClick={onNext} aria-label="Play next lesson"><PlayGlyph size={40}/></button>}
    </div>
  </main></div>;
}
function Chest({ open }) {
  return <svg width="150" height="130" viewBox="0 0 150 130" aria-hidden="true">{open && <circle cx="75" cy="40" r="50" fill="rgba(255,235,150,.4)"/>}<rect x="25" y="60" width="100" height="55" rx="10" fill="#c98a4b" stroke="#9a6630" strokeWidth="4"/><rect x="62" y="78" width="26" height="26" rx="4" fill="#ffce4a"/><g style={{transformOrigin:'75px 60px', transform:open ? 'rotate(-26deg) translateY(-4px)' : 'none',transition:'transform .4s'}}><path d="M25 60 Q25 30 75 30 Q125 30 125 60Z" fill="#a96a30" stroke="#7a4e26" strokeWidth="4"/><rect x="22" y="56" width="106" height="12" rx="5" fill="#ffce4a"/></g></svg>;
}
function StickerBook({ stickers, coins, stars, onBack }) {
  const rewards = AREAS.flatMap(a => (a.levels || []).map(l => l.reward));
  const [selected, setSelected] = React.useState(null);
  return <div className="screen sticker-screen"><TopBar coins={coins} stars={stars}/><main className="sticker-content">
    <div className="screen-heading"><button className="icon-btn" onClick={onBack} aria-label="Back to map"><HomeGlyph/></button><h1 className="he" lang="he">המדבקות שלי</h1><span className="heading-spacer"/></div>
    <div className="sticker-summary" aria-label={`${stickers.length} of ${rewards.length} stickers collected`}><Icon name="medal" size={38}/><span>{stickers.length} / {rewards.length}</span></div>
    <div className="sticker-grid">{rewards.map((r, i) => {
      const got = stickers.includes(r.label);
      return <button key={i} className={`sticker-card${got ? ' collected' : ''}${selected === i ? ' selected' : ''}`} disabled={!got} aria-label={`${r.label}${got ? ', collected' : ', not collected'}`} onClick={() => { setSelected(i); window.chime('tap'); }}><Icon name={r.icon} size={78}/>{got ? <span className="sticker-check" aria-hidden="true">✓</span> : <span className="sticker-lock"><Icon name="lock" size={24}/></span>}</button>;
    })}</div>
  </main></div>;
}
Object.assign(window, { WorldMap, AreaView, LevelPreview, LevelComplete, StickerBook, TopBar });
