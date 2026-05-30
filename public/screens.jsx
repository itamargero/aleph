/* ============================================================
   HEBREW HEROES — screens
   WorldMap, AreaView, LevelPreview, LevelComplete, StickerBook, TopBar
   ============================================================ */

// ---------- top HUD (coins / stars / sticker book) ----------
function TopBar({ coins, stars, onStickers, onSettings }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', zIndex: 40 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Pill icon="coin" value={coins} />
        <Pill icon="star" value={stars} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="icon-btn" onClick={onStickers} aria-label="Sticker book" title="Sticker book">
          <Icon name="medal" size={34} />
        </button>
        <button className="icon-btn" onClick={onSettings} aria-label="Settings" title="Settings">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7a7066" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.3 2.4a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.4h5l.3-2.4a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6a7 7 0 0 0 .1-1z"/></svg>
        </button>
      </div>
    </div>
  );
}
function Pill({ icon, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 999, padding: '7px 18px 7px 8px', boxShadow: 'var(--pop)', fontWeight: 700, fontSize: 24, color: 'var(--ink)' }}>
      <Icon name={icon} size={34} /> {value}
    </div>
  );
}

// ---------- clouds ----------
function Clouds() {
  const list = [{ x: 120, y: 70, s: 1 }, { x: 620, y: 50, s: 1.3 }, { x: 1100, y: 90, s: .9 }, { x: 1600, y: 60, s: 1.15 }, { x: 2000, y: 100, s: 1 }];
  return list.map((c, i) => (
    <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, transform: `scale(${c.s})`, animation: `float-cloud ${10 + i * 2}s ease-in-out ${i}s infinite alternate`, opacity: .9 }}>
      <svg width="150" height="70" viewBox="0 0 150 70"><g fill="#fff"><circle cx="40" cy="40" r="26"/><circle cx="70" cy="30" r="32"/><circle cx="105" cy="42" r="24"/><rect x="36" y="40" width="74" height="24" rx="12"/></g></svg>
    </div>
  ));
}

// ---------- WORLD MAP ----------
function WorldMap({ progress, areaUnlocked, coins, stars, onArea, onStickers, onSettings }) {
  const scroller = React.useRef(null);
  const pts = [
    [200, 580], [470, 410], [740, 590], [1010, 410],
    [1280, 590], [1550, 410], [1820, 590], [2080, 430],
  ];
  const themeGrad = {
    sun: 'linear-gradient(180deg,#ffce4a,#f7a823)', meadow: 'linear-gradient(180deg,#6ee7a8,#34c87f)',
    sky: 'linear-gradient(180deg,#8fd6ff,#5cb3ff)', coral: 'linear-gradient(180deg,#ff7a8a,#ef4f66)',
    grape: 'linear-gradient(180deg,#a98bff,#7c5cf0)',
  };
  // build smooth road path
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [x, y] = pts[i];
    const mx = (px + x) / 2;
    d += ` C ${mx} ${py}, ${mx} ${y}, ${x} ${y}`;
  }
  // find current recommended area index (first unlocked & not fully complete)
  const curIdx = AREAS.findIndex((a, i) => areaUnlocked(i) && a.levels && a.levels.some(l => !progress[l.id]));

  React.useEffect(() => {
    if (scroller.current && curIdx >= 0) {
      const tx = Math.max(0, pts[curIdx][0] - 500);
      scroller.current.scrollTo({ left: tx, behavior: 'smooth' });
    }
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#bdeaff 0%,#8fd6ff 38%,#cdeeff 55%)' }}>
      <TopBar coins={coins} stars={stars} onStickers={onStickers} onSettings={onSettings} />
      <div style={{ position: 'absolute', top: 84, left: '50%', transform: 'translateX(-50%)', zIndex: 30, textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', background: 'rgba(124,92,240,.85)', padding: '6px 26px', borderRadius: 999, boxShadow: 'var(--pop)' }}>Hebrew Heroes</div>
      </div>
      <div ref={scroller} style={{ position: 'absolute', inset: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ position: 'relative', width: 2300, height: 800 }}>
          {/* meadow ground */}
          <svg width="2300" height="800" style={{ position: 'absolute', inset: 0 }}>
            <path d="M0 300 Q575 220 1150 320 T2300 300 V800 H0 Z" fill="#7fdcb0"/>
            <path d="M0 360 Q575 300 1150 380 T2300 360 V800 H0 Z" fill="#5ccf95"/>
            {/* road */}
            <path d={d} fill="none" stroke="#fff6e3" strokeWidth="42" strokeLinecap="round" opacity=".85"/>
            <path d={d} fill="none" stroke="#ffce4a" strokeWidth="42" strokeLinecap="round" strokeDasharray="2 60" opacity=".7"/>
          </svg>
          <Clouds />
          {/* area islands */}
          {AREAS.map((a, i) => {
            const [x, y] = pts[i];
            const unlocked = areaUnlocked(i);
            const levelsDone = a.levels ? a.levels.filter(l => progress[l.id]).length : 0;
            const totalLevels = a.levels ? a.levels.length : 0;
            const complete = totalLevels > 0 && levelsDone === totalLevels;
            const isCurrent = i === curIdx;
            return (
              <div key={a.id} style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                {isCurrent && (
                  <div style={{ position: 'absolute', left: '50%', top: -118, transform: 'translateX(-50%)' }} className="bob">
                    <Mascot mood="cheer" size={96} />
                    <div style={{ background: '#fff', borderRadius: 16, padding: '4px 14px', fontWeight: 700, fontSize: 16, boxShadow: 'var(--pop)', marginTop: -6 }}>Play here!</div>
                  </div>
                )}
                <button onClick={() => unlocked && onArea(i)} disabled={!unlocked}
                  className={isCurrent ? '' : ''}
                  style={{
                    width: 156, height: 156, borderRadius: '50%',
                    background: unlocked ? themeGrad[a.theme] : 'linear-gradient(180deg,#cfd6dd,#aeb6bf)',
                    boxShadow: isCurrent ? '0 10px 0 rgba(0,0,0,.16), 0 0 0 8px rgba(255,255,255,.7)' : '0 10px 0 rgba(0,0,0,.16)',
                    display: 'grid', placeItems: 'center', position: 'relative',
                    animation: isCurrent ? 'glow-pulse 1.8s infinite' : 'none', cursor: unlocked ? 'pointer' : 'default',
                  }}>
                  <div style={{ width: 116, height: 116, borderRadius: '50%', background: 'rgba(255,255,255,.55)', display: 'grid', placeItems: 'center' }}>
                    {unlocked ? <Icon name={a.icon} size={84} /> : <Icon name="lock" size={64} />}
                  </div>
                  {complete && <div style={{ position: 'absolute', top: -6, right: -6 }}><Icon name="star" size={48} /></div>}
                </button>
                <div style={{ marginTop: 12, background: 'rgba(255,255,255,.92)', borderRadius: 14, padding: '6px 14px', boxShadow: 'var(--pop)', display: 'inline-block' }}>
                  <div style={{ fontWeight: 700, fontSize: 19, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{a.name}</div>
                  {unlocked
                    ? <div style={{ fontSize: 14, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{totalLevels ? `${levelsDone}/${totalLevels} levels` : a.blurb}</div>
                    : <div style={{ fontSize: 14, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{a.locked ? 'Coming soon' : 'Locked'}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- AREA VIEW (levels along a little path) ----------
function AreaView({ area, progress, levelUnlocked, coins, stars, onLevel, onBack, onStickers, onSettings }) {
  const themeBg = {
    sun: 'linear-gradient(180deg,#fff0c4,#ffe49a)', meadow: 'linear-gradient(180deg,#d6ffe8,#a8f0c8)',
    grape: 'linear-gradient(180deg,#ece4ff,#d6c8ff)', sky: 'linear-gradient(180deg,#dff3ff,#bde6ff)',
    coral: 'linear-gradient(180deg,#ffe0e4,#ffc4cc)',
  }[area.theme];
  const slots = [[260, 540], [560, 420], [860, 540], [1080, 380]];
  return (
    <div style={{ position: 'absolute', inset: 0, background: themeBg }}>
      <TopBar coins={coins} stars={stars} onStickers={onStickers} onSettings={onSettings} />
      <button className="btn ghost" onClick={onBack} style={{ position: 'absolute', top: 90, left: 26, zIndex: 40, fontSize: 18, padding: '12px 22px' }}>← Map</button>
      <div style={{ position: 'absolute', top: 96, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 30 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{area.name}</div>
        <div className="he" style={{ fontSize: 24, color: 'var(--ink-soft)' }}>{area.he}</div>
      </div>
      <svg width="1280" height="800" style={{ position: 'absolute', inset: 0 }}>
        <path d={`M ${slots[0][0]} ${slots[0][1]} Q 410 400 ${slots[1][0]} ${slots[1][1]} T ${slots[2][0]} ${slots[2][1]} Q 980 420 ${slots[3][0]} ${slots[3][1]}`}
          fill="none" stroke="#fff" strokeWidth="20" strokeLinecap="round" strokeDasharray="2 34" opacity=".8"/>
      </svg>
      {area.levels.map((lv, i) => {
        const [x, y] = slots[i];
        const earned = progress[lv.id] || 0;
        const unlocked = levelUnlocked(area, i);
        const isNext = unlocked && !earned && (i === 0 || progress[area.levels[i-1].id]);
        return (
          <div key={lv.id} style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <button onClick={() => unlocked && onLevel(lv)} disabled={!unlocked} style={{
              width: 130, height: 130, borderRadius: '50%',
              background: unlocked ? 'linear-gradient(180deg,#fff,#fff4dc)' : 'linear-gradient(180deg,#e6e0d4,#cfc8ba)',
              boxShadow: isNext ? '0 8px 0 rgba(0,0,0,.14), 0 0 0 7px rgba(255,194,60,.6)' : '0 8px 0 rgba(0,0,0,.14)',
              display: 'grid', placeItems: 'center', position: 'relative',
              animation: isNext ? 'glow-pulse 1.8s infinite' : 'none', cursor: unlocked ? 'pointer' : 'default',
            }}>
              {unlocked ? <span style={{ fontSize: 44, fontWeight: 700, color: 'var(--grape-deep)' }}>{i + 1}</span> : <Icon name="lock" size={52} />}
              {/* stars */}
              {unlocked && (
                <div style={{ position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                  {[0,1,2].map(s => <Icon key={s} name="star" size={26} style={{ filter: s < earned ? 'none' : 'grayscale(1) opacity(.35)' }} />)}
                </div>
              )}
            </button>
            <div style={{ marginTop: 22, fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{lv.title}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- LEVEL PREVIEW ----------
function LevelPreview({ area, level, onStart, onBack }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(40,36,64,.55)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
      <div style={{ width: 620, background: 'var(--card)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--soft-lg)', padding: 40, textAlign: 'center', position: 'relative' }}>
        <button onClick={onBack} aria-label="Close" style={{ position: 'absolute', top: 18, right: 18, width: 44, height: 44, borderRadius: '50%', background: '#f0ece4', fontSize: 22, color: 'var(--ink-soft)' }}>✕</button>
        <div style={{ display: 'inline-block', background: 'var(--paper)', borderRadius: '50%', padding: 14, boxShadow: 'var(--pop)' }}>
          <Icon name={area.icon} size={72} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 14 }}>{area.name} · Level {area.levels.indexOf(level) + 1}</div>
        <div style={{ fontSize: 34, fontWeight: 700, marginTop: 2 }}>{level.title}</div>
        <div className="he" style={{ fontSize: 26, color: 'var(--grape-deep)', marginTop: 2 }}>{level.he}</div>
        <div style={{ fontSize: 20, color: 'var(--ink-soft)', marginTop: 14 }}>{level.objective}</div>
        {level.teaches.length > 0 && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', margin: '22px 0' }}>
            {level.teaches.map((t, i) => (
              <div key={i} className="he" style={{ minWidth: 60, padding: '8px 16px', background: 'var(--paper)', borderRadius: 16, fontSize: 36, fontWeight: 700, color: 'var(--ink)', boxShadow: 'var(--pop)' }}>
                {WORDS[t] ? WORDS[t].plain : t}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 18, color: 'var(--ink-soft)', margin: '8px 0 22px' }}>
          <Icon name="medal" size={32} /> Reward: <b style={{ color: 'var(--ink)' }}>{level.reward.label}</b>
          <span style={{ color: 'var(--ink-faint)' }}>· {level.exercises.length} tasks · ~2 min</span>
        </div>
        <button className="btn go" onClick={onStart} style={{ fontSize: 26, padding: '18px 56px' }}>Let’s go!</button>
      </div>
    </div>
  );
}

// ---------- LEVEL COMPLETE ----------
function LevelComplete({ level, starsEarned, coinsEarned, onReplay, onMap, onNext, hasNext }) {
  const [chestOpen, setChestOpen] = React.useState(false);
  React.useEffect(() => { window.chime('fanfare'); const t = setTimeout(() => { setChestOpen(true); window.chime('unlock'); }, 700); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#7c5cf0,#5b3fd0)', display: 'grid', placeItems: 'center', zIndex: 50, overflow: 'hidden' }}>
      <Confetti count={70} />
      {/* rays */}
      <div style={{ position: 'absolute', width: 1000, height: 1000, background: 'conic-gradient(from 0deg, rgba(255,255,255,.10) 0 12deg, transparent 12deg 30deg)', borderRadius: '50%', animation: 'spin-slow 24s linear infinite' }} />
      <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 44, fontWeight: 700, textShadow: '0 3px 0 rgba(0,0,0,.18)', whiteSpace: 'nowrap' }}>Level Complete!</div>
        {/* stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '18px 0' }}>
          {[0,1,2].map(s => (
            <div key={s} style={{ animation: s < starsEarned ? `star-fill .5s ${0.3 + s * 0.25}s both` : 'none', opacity: s < starsEarned ? 1 : .3, transform: s === 1 ? 'translateY(-14px) scale(1.2)' : 'none' }}>
              <Icon name="star" size={s === 1 ? 92 : 76} />
            </div>
          ))}
        </div>
        {/* treasure chest */}
        <div onClick={() => { if (!chestOpen) { setChestOpen(true); window.chime('unlock'); } }} style={{ cursor: 'pointer' }}>
          {!chestOpen
            ? <div className="bob"><Chest open={false} /><div style={{ fontSize: 18, marginTop: 6 }}>tap to open!</div></div>
            : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Chest open={true} />
                <div style={{ background: '#fff', color: 'var(--ink)', borderRadius: 22, padding: '14px 26px', marginTop: 8, boxShadow: 'var(--soft)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name={level.reward.icon} size={56} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 22 }}>{level.reward.label}</div>
                    <div style={{ fontSize: 16, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 4 }}>+{coinsEarned} <Icon name="coin" size={22} /> earned</div>
                  </div>
                </div>
              </div>}
        </div>
        {chestOpen && (
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 28 }}>
            <button className="btn ghost" onClick={onReplay} style={{ fontSize: 18 }}>↻ Replay</button>
            <button className="btn ghost" onClick={onMap} style={{ fontSize: 18 }}>Map</button>
            {hasNext && <button className="btn sun" onClick={onNext} style={{ fontSize: 20 }}>Next level →</button>}
          </div>
        )}
      </div>
    </div>
  );
}
function Chest({ open }) {
  return (
    <svg width="150" height="130" viewBox="0 0 150 130">
      {open && <g><circle cx="75" cy="40" r="50" fill="rgba(255,235,150,.4)"/></g>}
      <rect x="25" y="60" width="100" height="55" rx="10" fill="#c98a4b"/>
      <rect x="25" y="60" width="100" height="55" rx="10" fill="none" stroke="#9a6630" strokeWidth="4"/>
      <rect x="62" y="78" width="26" height="26" rx="4" fill="#ffce4a"/>
      <g style={{ transformOrigin: '75px 60px', transform: open ? 'rotate(-26deg) translateY(-4px)' : 'none', transition: 'transform .4s' }}>
        <path d="M25 60 Q25 30 75 30 Q125 30 125 60 Z" fill="#a96a30"/>
        <path d="M25 60 Q25 30 75 30 Q125 30 125 60 Z" fill="none" stroke="#7a4e26" strokeWidth="4"/>
        <rect x="22" y="56" width="106" height="12" rx="5" fill="#ffce4a"/>
      </g>
    </svg>
  );
}

// ---------- STICKER BOOK ----------
function StickerBook({ stickers, coins, stars, onBack }) {
  const allRewards = [];
  AREAS.forEach(a => a.levels && a.levels.forEach(l => allRewards.push(l.reward)));
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#fff0c4,#ffd98c)' }}>
      <TopBar coins={coins} stars={stars} onStickers={() => {}} onSettings={() => {}} />
      <button className="btn ghost" onClick={onBack} style={{ position: 'absolute', top: 90, left: 26, zIndex: 40, fontSize: 18, padding: '12px 22px' }}>← Back</button>
      <div style={{ position: 'absolute', top: 96, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>My Sticker Book</div>
        <div style={{ fontSize: 18, color: 'var(--ink-soft)' }}>{stickers.length} of {allRewards.length} collected</div>
      </div>
      <div style={{ position: 'absolute', top: 190, left: 80, right: 80, bottom: 50, background: 'rgba(255,255,255,.6)', borderRadius: 'var(--r-lg)', boxShadow: 'inset 0 4px 16px rgba(0,0,0,.08)', padding: 36, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 22, alignContent: 'start', overflowY: 'auto' }}>
        {allRewards.map((r, i) => {
          const got = stickers.includes(r.label);
          return (
            <div key={i} style={{ textAlign: 'center' }}>
              <div className={got ? 'pop-in' : ''} style={{ aspectRatio: '1', borderRadius: 'var(--r-md)', background: got ? '#fff' : 'rgba(0,0,0,.06)', boxShadow: got ? 'var(--pop)' : 'none', display: 'grid', placeItems: 'center', filter: got ? 'none' : 'none' }}>
                {got ? <Icon name={r.icon} size={76} /> : <div style={{ opacity: .25 }}><Icon name={r.icon} size={64} style={{ filter: 'grayscale(1) brightness(.4)' }} /></div>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, color: got ? 'var(--ink)' : 'var(--ink-faint)' }}>{got ? r.label : '???'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { WorldMap, AreaView, LevelPreview, LevelComplete, StickerBook, TopBar });
