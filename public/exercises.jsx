/* ============================================================
   HEBREW HEROES — exercise engine
   One renderer, many exercise types. Each reports onSolved().
   Exposes window.ExerciseRenderer, window.AudioButton
   ============================================================ */

// round "hear it again" button
function AudioButton({ text, size = 78, big }) {
  const [ping, setPing] = React.useState(false);
  const play = () => { setPing(true); window.speakHe(text); window.chime('tap'); setTimeout(() => setPing(false), 600); };
  return (
    <button onClick={play} aria-label="Play sound" style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(180deg,#8fd6ff,#5cb3ff)',
      boxShadow: '0 7px 0 rgba(0,0,0,.16)', display: 'grid', placeItems: 'center',
      transition: 'transform .1s', transform: ping ? 'scale(.92)' : 'scale(1)',
    }}>
      <svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="#fff">
        <path d="M4 9v6h4l5 5V4L8 9H4z"/>
        <path d="M16 8.5a4 4 0 0 1 0 7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {big && <path d="M18.5 5.5a8 8 0 0 1 0 13" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>}
      </svg>
    </button>
  );
}

// hook handling pick → correct/wrong feedback for single-answer exercises
function useChoice(answer, onSolved, onWrong) {
  const [status, setStatus] = React.useState({});  // value -> 'wrong' | 'correct'
  const [done, setDone] = React.useState(false);
  const [reveal, setReveal] = React.useState(false);
  const attempts = React.useRef(0);

  const pick = (val) => {
    if (done || status[val] === 'wrong') return;
    if (val === answer) {
      setStatus(s => ({ ...s, [val]: 'correct' }));
      setDone(true);
      window.chime('correct');
      setTimeout(() => onSolved && onSolved(), 750);
    } else {
      attempts.current += 1;
      setStatus(s => ({ ...s, [val]: 'wrong' }));
      window.chime('wrong');
      onWrong && onWrong(attempts.current);
      if (attempts.current >= 2) setTimeout(() => setReveal(true), 250);
    }
  };
  return { status, done, reveal, attempts, pick };
}

// the mascot speech bubble shown in every exercise
function Coach({ text, mood }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, position: 'absolute', left: 28, bottom: 24 }}>
      <Mascot mood={mood} size={96} />
      {text && (
        <div className="pop-in" style={{
          background: '#fff', borderRadius: '22px 22px 22px 6px', padding: '12px 18px',
          boxShadow: 'var(--soft)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', maxWidth: 230, marginBottom: 18,
        }}>{text}</div>
      )}
    </div>
  );
}

// ---- generic card grid for choice exercises ----
function CardGrid({ children, cols }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22, justifyItems: 'center', width: '100%', maxWidth: 720 }}>
      {children}
    </div>
  );
}
function cardStyle(state, base = {}) {
  let extra = {};
  if (state === 'correct') extra = { background: 'linear-gradient(180deg,#d6ffe8,#9ff0c2)', boxShadow: '0 0 0 6px var(--correct), var(--pop)' };
  else if (state === 'wrong') extra = { opacity: .45, boxShadow: '0 0 0 5px #ffb4b4, var(--pop)' };
  else if (state === 'reveal') extra = { boxShadow: '0 0 0 6px var(--gold), var(--pop)', animation: 'glow-pulse 1.2s infinite' };
  return { ...base, ...extra };
}

// ---------- LETTER CHOICE (also handles audio_to_letter) ----------
function LetterChoice({ ex, onSolved, onWrong }) {
  const { status, reveal, attempts, pick } = useChoice(ex.answer, onSolved, onWrong);
  const isAudio = ex.type === 'audio_to_letter';
  const target = isAudio ? ex.speak : ex.promptKey;
  React.useEffect(() => { const t = setTimeout(() => window.speakHe(target), 500); return () => clearTimeout(t); }, []);
  const coach = attempts.current >= 2 ? 'Here it is — tap the glowing one!' :
                attempts.current === 1 ? 'Almost! Try again 💛'.replace('💛','') : '';
  return (
    <ExLayout
      prompt={
        isAudio
          ? <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 18 }}>Which letter makes this sound?</div>
              <AudioButton text={ex.speak} size={104} big />
            </div>
          : <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 10 }}>Find this letter</div>
              <div className="he" style={{ fontSize: 150, lineHeight: 1, color: 'var(--grape-deep)' }}>{ex.promptKey}</div>
              <div style={{ marginTop: 6 }}><AudioButton text={ex.promptKey} size={56} /></div>
            </div>
      }
      coach={coach}
    >
      <CardGrid cols={4}>
        {ex.options.map((o, i) => {
          const st = status[o] || (reveal && o === ex.answer ? 'reveal' : null);
          return (
            <button key={i} onClick={() => { pick(o); if (o !== ex.answer) {} else {} }}
              className={status[o] === 'wrong' ? 'wiggle' : st === 'correct' ? 'pop-in' : ''}
              style={cardStyle(st, {
                width: 130, height: 150, borderRadius: 'var(--r-md)', background: '#fff',
                boxShadow: 'var(--pop)', display: 'grid', placeItems: 'center', transition: 'all .15s',
              })}>
              <span className="he" style={{ fontSize: 96, lineHeight: 1, color: 'var(--ink)' }}>{o}</span>
            </button>
          );
        })}
      </CardGrid>
    </ExLayout>
  );
}

// ---------- PICTURE TO WORD ----------
function PictureToWord({ ex, onSolved, onWrong }) {
  const { status, reveal, attempts, pick } = useChoice(ex.answer, onSolved, onWrong);
  const w = WORDS[ex.answer];
  const coach = attempts.current >= 1 ? 'Look at the picture and listen!' : '';
  return (
    <ExLayout
      prompt={
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 14 }}>Which word matches?</div>
          <div style={{ width: 220, height: 220, borderRadius: 'var(--r-lg)', background: 'linear-gradient(180deg,#fff,#fff4dc)', boxShadow: 'var(--soft)', display: 'grid', placeItems: 'center', margin: '0 auto' }}>
            <Icon name={ex.icon} size={150} />
          </div>
        </div>
      }
      coach={coach}
    >
      <CardGrid cols={ex.options.length > 3 ? 4 : 3}>
        {ex.options.map((o, i) => {
          const st = status[o] || (reveal && o === ex.answer ? 'reveal' : null);
          return (
            <button key={i} onClick={() => pick(o)}
              className={status[o] === 'wrong' ? 'wiggle' : st === 'correct' ? 'pop-in' : ''}
              style={cardStyle(st, { minWidth: 150, padding: '22px 10px', borderRadius: 'var(--r-md)', background: '#fff', boxShadow: 'var(--pop)', transition: 'all .15s' })}>
              <div className="he" style={{ fontSize: 52, color: 'var(--ink)' }}>{WORDS[o] ? WORDS[o].plain : o}</div>
            </button>
          );
        })}
      </CardGrid>
    </ExLayout>
  );
}

// ---------- AUDIO TO WORD ----------
function AudioToWord({ ex, onSolved, onWrong }) {
  const { status, reveal, attempts, pick } = useChoice(ex.answer, onSolved, onWrong);
  React.useEffect(() => { const t = setTimeout(() => window.speakHe(WORDS[ex.speakKey].plain), 500); return () => clearTimeout(t); }, []);
  const coach = attempts.current >= 1 ? 'Tap the speaker to hear it again 🔊'.replace('🔊','') : '';
  return (
    <ExLayout
      prompt={
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 18 }}>Listen — which word is it?</div>
          <AudioButton text={WORDS[ex.speakKey].plain} size={104} big />
        </div>
      }
      coach={coach}
    >
      <CardGrid cols={3}>
        {ex.options.map((o, i) => {
          const st = status[o] || (reveal && o === ex.answer ? 'reveal' : null);
          return (
            <button key={i} onClick={() => pick(o)}
              className={status[o] === 'wrong' ? 'wiggle' : st === 'correct' ? 'pop-in' : ''}
              style={cardStyle(st, { minWidth: 150, padding: '22px 10px', borderRadius: 'var(--r-md)', background: '#fff', boxShadow: 'var(--pop)', transition: 'all .15s' })}>
              <div className="he" style={{ fontSize: 52, color: 'var(--ink)' }}>{WORDS[o].plain}</div>
            </button>
          );
        })}
      </CardGrid>
    </ExLayout>
  );
}

// ---------- FILL MISSING WORD ----------
function FillMissing({ ex, onSolved, onWrong }) {
  const { status, reveal, attempts, pick } = useChoice(ex.blankAnswer, onSolved, onWrong);
  const solved = Object.values(status).includes('correct');
  return (
    <ExLayout
      prompt={
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 18 }}>Finish the sentence</div>
          <div className="he" dir="rtl" style={{ fontSize: 64, color: 'var(--ink)', display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
            <span>{ex.before}</span>
            <span style={{ minWidth: 150, borderBottom: '6px dashed var(--grape)', color: 'var(--grape-deep)', padding: '0 12px' }}>
              {solved ? WORDS[ex.blankAnswer].plain : '\u00A0'}
            </span>
          </div>
        </div>
      }
      coach={attempts.current >= 1 ? 'Which word fits best?' : ''}
    >
      <CardGrid cols={3}>
        {ex.options.map((o, i) => {
          const st = status[o] || (reveal && o === ex.blankAnswer ? 'reveal' : null);
          const label = WORDS[o] ? WORDS[o].plain : o;
          return (
            <button key={i} onClick={() => pick(o)}
              className={status[o] === 'wrong' ? 'wiggle' : st === 'correct' ? 'pop-in' : ''}
              style={cardStyle(st, { minWidth: 150, padding: '22px 10px', borderRadius: 'var(--r-md)', background: '#fff', boxShadow: 'var(--pop)', transition: 'all .15s' })}>
              <div className="he" style={{ fontSize: 48, color: 'var(--ink)' }}>{label}</div>
            </button>
          );
        })}
      </CardGrid>
    </ExLayout>
  );
}

// ---------- BUILD WORD ----------
function BuildWord({ ex, onSolved, onWrong }) {
  const word = WORDS[ex.wordKey];
  const letters = React.useMemo(() => Array.from(word.plain), [ex.wordKey]);
  // tiles in RTL: first letter is rightmost. We store slots left->right = reversed reading? Keep logical order.
  const [slots, setSlots] = React.useState(() => letters.map(() => null));
  const [tiles, setTiles] = React.useState(() => shuffle(letters.map((ch, i) => ({ id: i, ch }))));
  const [done, setDone] = React.useState(false);
  const [bad, setBad] = React.useState(false);

  React.useEffect(() => { const t = setTimeout(() => window.speakHe(word.plain), 500); return () => clearTimeout(t); }, []);

  const placeNext = (tile) => {
    if (done) return;
    const idx = slots.findIndex(s => s === null);
    if (idx === -1) return;
    const next = [...slots]; next[idx] = tile;
    setSlots(next); setTiles(tiles.filter(t => t.id !== tile.id)); window.chime('tap');
    if (next.every(Boolean)) check(next);
  };
  const check = (filled) => {
    const built = filled.map(t => t.ch).join('');
    if (built === word.plain) { setDone(true); window.chime('correct'); setTimeout(() => onSolved && onSolved(), 800); }
    else { setBad(true); window.chime('wrong'); onWrong && onWrong(1);
      setTimeout(() => { setBad(false); setTiles(shuffle(letters.map((ch,i)=>({id:i,ch})))); setSlots(letters.map(()=>null)); }, 900); }
  };
  const removeSlot = (i) => {
    if (done || !slots[i]) return;
    const tile = slots[i]; const next = [...slots]; next[i] = null;
    setSlots(next); setTiles([...tiles, tile]);
  };
  return (
    <ExLayout
      prompt={
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 14 }}>Build the word</div>
          <div style={{ width: 170, height: 170, borderRadius: 'var(--r-lg)', background: 'linear-gradient(180deg,#fff,#fff4dc)', boxShadow: 'var(--soft)', display: 'grid', placeItems: 'center', margin: '0 auto' }}>
            <Icon name={word.icon} size={120} />
          </div>
          <div style={{ marginTop: 8 }}><AudioButton text={word.plain} size={52} /></div>
        </div>
      }
      coach={bad ? 'Oops! Let\u2019s try the order again.' : 'Tap the letters in order →'}
    >
      {/* slots: render RTL so building reads right-to-left */}
      <div dir="rtl" className={bad ? 'wiggle' : ''} style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 30 }}>
        {slots.map((s, i) => (
          <button key={i} onClick={() => removeSlot(i)} style={{
            width: 92, height: 110, borderRadius: 'var(--r-sm)',
            background: s ? (done ? 'linear-gradient(180deg,#d6ffe8,#9ff0c2)' : '#fff') : 'rgba(124,92,240,.08)',
            border: s ? 'none' : '3px dashed var(--grape)', boxShadow: s ? 'var(--pop)' : 'none',
            display: 'grid', placeItems: 'center',
          }}>
            <span className="he" style={{ fontSize: 64, color: 'var(--ink)' }}>{s ? s.ch : ''}</span>
          </button>
        ))}
      </div>
      <div dir="rtl" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 600 }}>
        {tiles.map(t => (
          <button key={t.id} onClick={() => placeNext(t)} style={{
            width: 84, height: 100, borderRadius: 'var(--r-sm)', background: 'linear-gradient(180deg,#ffce4a,#f7a823)',
            boxShadow: '0 6px 0 rgba(0,0,0,.16)', display: 'grid', placeItems: 'center',
          }}>
            <span className="he" style={{ fontSize: 56, color: '#fff' }}>{t.ch}</span>
          </button>
        ))}
      </div>
    </ExLayout>
  );
}

// ---------- SENTENCE ORDER ----------
function SentenceOrder({ ex, onSolved, onWrong }) {
  const correct = ex.words;
  const [bank, setBank] = React.useState(() => shuffle(correct.map((w, i) => ({ id: i, w }))));
  const [line, setLine] = React.useState([]);
  const [done, setDone] = React.useState(false);
  const [bad, setBad] = React.useState(false);

  const add = (tok) => { if (done) return; setLine([...line, tok]); setBank(bank.filter(b => b.id !== tok.id)); window.chime('tap'); };
  const back = (tok) => { if (done) return; setBank([...bank, tok]); setLine(line.filter(b => b.id !== tok.id)); };

  React.useEffect(() => {
    if (line.length === correct.length) {
      const ok = line.every((t, i) => t.w === correct[i]);
      if (ok) { setDone(true); window.chime('correct'); window.speakHe(correct.join(' ')); setTimeout(() => onSolved && onSolved(), 1000); }
      else { setBad(true); window.chime('wrong'); onWrong && onWrong(1);
        setTimeout(() => { setBad(false); setBank(shuffle(correct.map((w,i)=>({id:i,w})))); setLine([]); }, 950); }
    }
  }, [line]);

  return (
    <ExLayout
      prompt={
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 8, whiteSpace: 'nowrap' }}>Put the words in order</div>
          <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--grape-deep)' }}>“{ex.en}”</div>
        </div>
      }
      coach={bad ? 'Close! Try a different order.' : 'Build the sentence from right to left →'}
    >
      {/* answer line (RTL) */}
      <div dir="rtl" className={bad ? 'wiggle' : ''} style={{
        minHeight: 110, width: 760, borderRadius: 'var(--r-md)',
        background: done ? 'linear-gradient(180deg,#d6ffe8,#9ff0c2)' : 'rgba(124,92,240,.06)',
        border: done ? 'none' : '3px dashed var(--grape)', display: 'flex', gap: 12, alignItems: 'center',
        justifyContent: 'center', flexWrap: 'wrap', padding: 16, marginBottom: 28,
      }}>
        {line.length === 0 && <span style={{ color: 'var(--ink-faint)', fontSize: 20, fontFamily: 'var(--font-ui)' }}>tap words below…</span>}
        {line.map(t => (
          <button key={t.id} onClick={() => back(t)} style={tileStyle('#fff', 'var(--ink)')}>
            <span className="he" style={{ fontSize: 42 }}>{t.w}</span>
          </button>
        ))}
      </div>
      <div dir="rtl" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 760 }}>
        {bank.map(t => (
          <button key={t.id} onClick={() => add(t)} style={tileStyle('linear-gradient(180deg,#a98bff,#7c5cf0)', '#fff')}>
            <span className="he" style={{ fontSize: 42 }}>{t.w}</span>
          </button>
        ))}
      </div>
    </ExLayout>
  );
}
function tileStyle(bg, color) {
  return { padding: '14px 24px', borderRadius: 'var(--r-sm)', background: bg, color, boxShadow: '0 6px 0 rgba(0,0,0,.14)' };
}

// ---------- shared layout: prompt up top, answers below, coach bottom-left ----------
function ExLayout({ prompt, children, coach }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '90px 40px 40px' }}>
      <div>{prompt}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>{children}</div>
      <Coach text={coach} mood={coach && /try|oops|close|almost/i.test(coach) ? 'think' : 'happy'} />
    </div>
  );
}

function shuffle(a) { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

function ExerciseRenderer(props) {
  const t = props.ex.type;
  if (t === 'letter_choice' || t === 'audio_to_letter') return <LetterChoice {...props} />;
  if (t === 'picture_to_word') return <PictureToWord {...props} />;
  if (t === 'audio_to_word') return <AudioToWord {...props} />;
  if (t === 'fill_missing') return <FillMissing {...props} />;
  if (t === 'build_word') return <BuildWord {...props} />;
  if (t === 'sentence_order') return <SentenceOrder {...props} />;
  return <div style={{ padding: 40 }}>Unknown exercise: {t}</div>;
}

Object.assign(window, { ExerciseRenderer, AudioButton });
