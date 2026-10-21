/* Picture, sound and copy games for children who are still learning to read.
   Every delayed action is cancelled on exit, and refs guard rapid repeated taps. */
function useExerciseTimers() {
  const timers = React.useRef(new Set());
  const alive = React.useRef(true);
  React.useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; timers.current.forEach(clearTimeout); timers.current.clear(); window.stopSpeech?.(); };
  }, []);
  const later = React.useCallback((callback, delay) => {
    const timer = setTimeout(() => { timers.current.delete(timer); if (alive.current) callback(); }, delay);
    timers.current.add(timer); return timer;
  }, []);
  return { later, alive };
}
function useExerciseVoice(promptKey, target, followUp) {
  React.useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!active) return;
      const heard = await window.playPrompt?.(promptKey);
      if (active && heard !== false && target) {
        const spoken = await window.speakHe(target);
        if (active && spoken !== false && followUp) await window.speakHe(followUp);
      }
    }, 220);
    // A child's tap takes priority over automatic narration. Capture click
    // before React's answer/speaker handler starts its own recording, including
    // keyboard/assistive clicks, so a queued instruction cannot interrupt it.
    const cancel = () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('click', cancel, true);
      window.stopVoice?.();
    };
    document.addEventListener('click', cancel, { capture: true, once: true });
    return () => { cancel(); window.stopSpeech?.(); };
  }, [promptKey, target, followUp]);
}
function SpeakerGlyph({ size = 32 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M15 8a5 5 0 0 1 0 8m3-11a9 9 0 0 1 0 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}
function AudioButton({ text, promptKey, size = 64, big = false, label = 'Hear it again', disabled = false }) {
  const [playing, setPlaying] = React.useState(false);
  const { alive } = useExerciseTimers();
  const sequence = React.useRef(0);
  const play = async () => {
    window.unlockAudio?.();
    const run = ++sequence.current;
    setPlaying(true);
    try { if (promptKey) await window.playPrompt(promptKey); else await window.speakHe(text); }
    finally { if (alive.current && sequence.current === run) setPlaying(false); }
  };
  return <button className={`audio-btn${playing ? ' audio-playing' : ''}${big ? ' audio-big' : ''}`} onClick={play} disabled={disabled} aria-label={label} aria-pressed={playing} style={{'--audio-size':`${Math.max(size,56)}px`}}><SpeakerGlyph size={big ? 46 : 30}/></button>;
}
// Keep the success recording intact before moving on. Use the exercise's
// guarded timers so leaving the lesson cancels advancement; a stalled native
// player must still allow the child to continue after a bounded wait.
function finishAfterVoice(later, voice, callback) {
  let pauseDone = false, voiceDone = false, finished = false;
  const finish = () => {
    if (finished || !pauseDone || !voiceDone) return;
    finished = true;
    later(callback, 0);
  };
  const heard = () => { voiceDone = true; finish(); };
  later(() => { pauseDone = true; finish(); }, 850);
  later(heard, 10000);
  Promise.resolve(voice).then(heard, heard);
}
function useChoice(answer, onSolved, onWrong) {
  const [status, setStatus] = React.useState({});
  const [done, setDone] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);
  const choice = React.useRef({done:false,wrong:new Set()});
  const solved = React.useRef(onSolved); solved.current = onSolved;
  const wrong = React.useRef(onWrong); wrong.current = onWrong;
  const { later } = useExerciseTimers();
  const pick = (value) => {
    const current = choice.current;
    if (current.done || current.wrong.has(value)) return;
    window.unlockAudio?.();
    if (value === answer) {
      current.done = true; setDone(true); setStatus(s => ({...s,[value]:'correct'}));
      window.chime('correct');
      finishAfterVoice(later, window.playPrompt?.('correct'), () => solved.current?.());
    } else {
      current.wrong.add(value); setStatus(s => ({...s,[value]:'wrong'}));
      setAttempts(current.wrong.size); wrong.current?.(current.wrong.size);
      window.chime('wrong'); window.playPrompt?.('try-again');
    }
  };
  return {status,done,attempts,reveal:attempts > 0,pick};
}
function wordInfo(key) {
  return WORDS[key] || Object.values(WORDS).find(w => w.plain === key) || {plain:key,icon:null,en:key};
}
function ScenePicture({ icons = [], emoji, large = false }) {
  return <div className={`scene-picture${large ? ' large-scene' : ''}`} aria-hidden="true">{emoji ? <span className="scene-emoji">{emoji}</span> : icons.filter(Boolean).map((icon,i) => <Icon key={i} name={icon} size={icons.length > 2 ? 72 : 104}/>)}</div>;
}
function ChoiceMark({ state }) {
  return state && <span className={`choice-mark ${state}`} aria-hidden="true">{state === 'correct' ? '✓' : state === 'wrong' ? '↻' : '☝'}</span>;
}
function ChoiceCard({ value, label, icon, emoji, state, disabled, onPick, previewText, letter = false }) {
  return <div className={`answer-item${state ? ` answer-${state}` : ''}`}>
    <button className={`choice-card${letter ? ' letter-card' : ''}`} onClick={() => onPick(value)} disabled={disabled || state === 'wrong'} aria-label={label || `Choose ${value}`}>
      {icon && <Icon name={icon} size={94}/>} {emoji && <span className="choice-emoji" aria-hidden="true">{emoji}</span>}
      <span className={`he${icon || emoji ? ' choice-word' : ' choice-letter'}`} lang="he">{wordInfo(value).plain}</span><ChoiceMark state={state}/>
    </button>
    {previewText && <AudioButton text={previewText} label={`Listen to ${label || value}`} size={56} disabled={disabled}/>}
  </div>;
}
function CardGrid({ children, cols = 3 }) {
  return <div className="answer-grid" style={{'--answer-cols':cols}}>{children}</div>;
}
function Coach({ attempts = 0, done = false }) {
  return <div className="exercise-coach"><Mascot mood={done ? 'cheer' : attempts ? 'think' : 'happy'} size={78}/><span className={`coach-cue${done ? ' correct-cue' : ''}`} aria-hidden="true">{done ? '✓' : attempts ? '☝' : '✦'}</span></div>;
}
function ExLayout({ prompt, children, promptKey, attempts = 0, done = false }) {
  return <section className="exercise-layout" aria-label="Hebrew learning activity">
    <div className="exercise-guide"><AudioButton promptKey={promptKey} size={56} label="Hear how to play"/><span className="guide-symbols" aria-hidden="true">👀 <span>→</span> ☝</span></div>
    <div className="exercise-prompt">{prompt}</div>
    <div className="exercise-answers">{children}</div>
    <Coach attempts={attempts} done={done}/>
  </section>;
}
function LetterChoice({ ex, onSolved, onWrong }) {
  const choice = useChoice(ex.answer,onSolved,onWrong);
  const target = ex.model || ex.promptKey || ex.answer;
  useExerciseVoice('instruction-letter',ex.speak || target);
  return <ExLayout promptKey="instruction-letter" {...choice} prompt={<div className="letter-model"><span className="he model-glyph" lang="he">{target}</span><AudioButton text={ex.speak || target} size={72}/></div>}>
    <CardGrid cols={4}>{ex.options.map(o => <ChoiceCard key={o} value={o} label={`Choose letter ${LETTERS[o]?.name || o}`} letter state={choice.status[o] || (choice.reveal && o === ex.answer ? 'reveal' : '')} disabled={choice.done} onPick={choice.pick}/>)}</CardGrid>
  </ExLayout>;
}
function PictureToWord({ ex, onSolved, onWrong }) {
  const choice = useChoice(ex.answer,onSolved,onWrong), word = wordInfo(ex.answer);
  useExerciseVoice('instruction-picture',ex.answer);
  return <ExLayout promptKey="instruction-picture" {...choice} prompt={<div className="picture-model"><ScenePicture icons={[ex.icon || word.icon]}/><span className="he model-word" lang="he">{word.plain}</span><AudioButton text={ex.answer}/></div>}>
    <WordChoices ex={ex} choice={choice}/>
  </ExLayout>;
}
function WordChoices({ ex, choice }) {
  return <CardGrid cols={ex.options.length}>{ex.options.map(o => {
    const word = wordInfo(o);
    return <ChoiceCard key={o} value={o} label={`Choose ${word.en}`} icon={word.icon} previewText={o} state={choice.status[o] || (choice.reveal && o === ex.answer ? 'reveal' : '')} disabled={choice.done} onPick={choice.pick}/>;
  })}</CardGrid>;
}
function AudioToWord({ ex, onSolved, onWrong }) {
  const choice = useChoice(ex.answer,onSolved,onWrong);
  const target = ex.speakKey || ex.answer;
  useExerciseVoice('instruction-listen',target);
  return <ExLayout promptKey="instruction-listen" {...choice} prompt={<div className="listen-model"><span className="listen-ears" aria-hidden="true">👂</span><AudioButton text={target} size={100} big/></div>}><WordChoices ex={ex} choice={choice}/></ExLayout>;
}
function FillMissing({ ex, onSolved, onWrong }) {
  const choice = useChoice(ex.blankAnswer,onSolved,onWrong), word = wordInfo(ex.blankAnswer);
  const model = ex.model || `${ex.before} ${ex.blankAnswer} ${ex.after || ''}`.trim();
  useExerciseVoice('instruction-fill',model);
  return <ExLayout promptKey="instruction-fill" {...choice} prompt={<div className="sentence-prompt"><ScenePicture icons={ex.sceneIcons || [ex.iconAnswer || word.icon]}/><div className="model-strip"><span className="he" lang="he">{model}</span><AudioButton text={model}/></div><div className="fill-line he" dir="rtl"><span>{ex.before}</span><span className={`fill-slot${choice.done ? ' slot-complete' : ''}`}>{choice.done ? word.plain : <Icon name={ex.iconAnswer || word.icon} size={48}/>}</span><span>{ex.after}</span></div></div>}>
    <WordChoices ex={{...ex,answer:ex.blankAnswer}} choice={choice}/>
  </ExLayout>;
}
// Copy activities show the next shape and only accept the matching token.
// Incorrect taps leave the child's completed work in place.
function useCopyTokens(tokens, onSolved, onWrong) {
  const [filled,setFilled] = React.useState([]), [bad,setBad] = React.useState(null), [attempts,setAttempts] = React.useState(0), [done,setDone] = React.useState(false);
  const state = React.useRef({filled:[],done:false,bad:new Set(),attempts:0});
  const {later} = useExerciseTimers();
  const solved = React.useRef(onSolved); solved.current = onSolved;
  const wrong = React.useRef(onWrong); wrong.current = onWrong;
  const add = (token) => {
    const current = state.current;
    if (current.done || current.filled.some(t => t.id === token.id) || current.bad.has(token.id)) return;
    window.unlockAudio?.();
    if (token.value !== tokens[current.filled.length].value) {
      current.attempts++; current.bad.add(token.id); setAttempts(current.attempts); setBad(token.id);
      wrong.current?.(current.attempts); window.chime('wrong'); window.playPrompt?.('try-again');
      later(() => {current.bad.delete(token.id); setBad(b => b === token.id ? null : b);},650);
      return;
    }
    current.filled = [...current.filled,token]; setFilled(current.filled); setBad(null); window.chime('tap');
    if (current.filled.length === tokens.length) {
      current.done = true; setDone(true); window.chime('correct');
      finishAfterVoice(later, window.playPrompt?.('correct'), () => solved.current?.());
    }
  };
  const undo = () => {const current = state.current; if (current.done || !current.filled.length) return; current.filled = current.filled.slice(0,-1); setFilled(current.filled); window.chime('tap');};
  return {filled,bad,attempts,done,add,undo};
}
function BuildWord({ ex, onSolved, onWrong }) {
  const word = wordInfo(ex.wordKey);
  const tokens = React.useMemo(() => Array.from(word.plain).map((value,id) => ({value,id})),[ex.wordKey]);
  const bank = React.useMemo(() => shuffle(tokens),[tokens]);
  const copy = useCopyTokens(tokens,onSolved,onWrong);
  useExerciseVoice('instruction-build',ex.wordKey);
  return <ExLayout promptKey="instruction-build" {...copy} prompt={<div className="picture-model"><ScenePicture icons={[word.icon]}/><div className="model-strip"><span className="he model-word" lang="he">{word.plain}</span><AudioButton text={ex.wordKey}/></div></div>}>
    <div className="copy-direction" aria-hidden="true">←</div>
    <div className={`copy-slots letter-slots${copy.done ? ' slots-done' : ''}`} dir="rtl">
      {tokens.map((token,i) => <div key={i} className={`copy-slot${copy.filled[i] ? ' has-token' : ''}${i === copy.filled.length ? ' next-slot' : ''}`}><span className="he">{copy.filled[i]?.value || (i === copy.filled.length ? token.value : '')}</span></div>)}
    </div>
    <div className="copy-bank" dir="rtl">{bank.filter(t => !copy.filled.some(f => f.id === t.id)).map(token => <button key={token.id} className={`copy-tile letter-tile${copy.bad === token.id ? ' tile-wrong wiggle' : ''}${copy.attempts && token.value === tokens[copy.filled.length]?.value ? ' tile-help' : ''}`} disabled={copy.done} onClick={() => copy.add(token)} aria-label={`Add letter ${LETTERS[token.value]?.name || token.value}`}><span className="he">{token.value}</span></button>)}</div>
    {copy.filled.length > 0 && !copy.done && <button className="icon-btn undo-button" onClick={copy.undo} aria-label="Undo last letter">↶</button>}
  </ExLayout>;
}
function SentenceOrder({ ex, onSolved, onWrong }) {
  const model = ex.model || ex.words.join(' ');
  const tokens = React.useMemo(() => ex.words.map((value,id) => ({value,id})),[ex.words]);
  const bank = React.useMemo(() => shuffle(tokens),[tokens]);
  const copy = useCopyTokens(tokens,onSolved,onWrong);
  useExerciseVoice('instruction-sentence',model);
  const icons = ex.sceneIcons || ex.words.map(w => wordInfo(w).icon).filter(Boolean);
  return <ExLayout promptKey="instruction-sentence" {...copy} prompt={<div className="sentence-prompt"><ScenePicture icons={icons}/><div className="model-strip sentence-model" dir="rtl"><span className="he" lang="he">{model}</span><AudioButton text={model}/></div></div>}>
    <div className="copy-direction" aria-hidden="true">←</div>
    <div className={`copy-slots sentence-slots${copy.done ? ' slots-done' : ''}`} dir="rtl">{tokens.map((token,i) => <div key={i} className={`copy-slot${copy.filled[i] ? ' has-token' : ''}${i === copy.filled.length ? ' next-slot' : ''}`}><span className="he">{copy.filled[i]?.value || (i === copy.filled.length ? token.value : '•••')}</span></div>)}</div>
    <div className="copy-bank" dir="rtl">{bank.filter(t => !copy.filled.some(f => f.id === t.id)).map(token => <button key={token.id} className={`copy-tile word-tile${copy.bad === token.id ? ' tile-wrong wiggle' : ''}${copy.attempts && token.value === tokens[copy.filled.length]?.value ? ' tile-help' : ''}`} disabled={copy.done} onClick={() => copy.add(token)} aria-label={`Add ${token.value}`}><span className="he">{token.value}</span></button>)}</div>
    {copy.filled.length > 0 && !copy.done && <button className="icon-btn undo-button" onClick={copy.undo} aria-label="Undo last word">↶</button>}
  </ExLayout>;
}
function SoundChoice({ ex, onSolved, onWrong }) {
  const choice = useChoice(ex.answer,onSolved,onWrong);
  useExerciseVoice('instruction-sound',ex.speak || ex.answer);
  return <ExLayout promptKey="instruction-sound" {...choice} prompt={<div className="letter-model"><span className="he model-glyph syllable-model">{ex.model || ex.answer}</span><AudioButton text={ex.speak || ex.answer} size={80}/></div>}><CardGrid cols={ex.options.length}>{ex.options.map(o => <ChoiceCard key={o} value={o} letter label={`Choose ${o}`} previewText={o} state={choice.status[o] || (choice.reveal && o === ex.answer ? 'reveal' : '')} disabled={choice.done} onPick={choice.pick}/>)}</CardGrid></ExLayout>;
}
function StoryChoice({ ex, onSolved, onWrong }) {
  const choice = useChoice(ex.answer,onSolved,onWrong);
  useExerciseVoice('instruction-story',ex.story,ex.speak);
  return <ExLayout promptKey="instruction-story" {...choice} prompt={<div className="story-prompt"><ScenePicture icons={ex.sceneIcons} large/><div className="story-audio"><AudioButton text={ex.story} size={80} label="Listen to the story"/><span className="question-cue" aria-hidden="true">?</span><AudioButton text={ex.speak} size={64} label="Listen to the question"/></div></div>}><WordChoices ex={ex} choice={choice}/></ExLayout>;
}
function PhraseChoice({ ex, onSolved, onWrong }) {
  const choice = useChoice(ex.answer,onSolved,onWrong);
  useExerciseVoice('instruction-phrase',ex.speak);
  return <ExLayout promptKey="instruction-phrase" {...choice} prompt={<div className="picture-model"><ScenePicture emoji={ex.sceneEmoji}/><AudioButton text={ex.speak} size={80}/></div>}><CardGrid cols={ex.options.length}>{ex.options.map(o => <ChoiceCard key={o} value={o} label={`Choose phrase ${o}`} emoji={ex.optionEmojis[o]} previewText={o} state={choice.status[o] || (choice.reveal && o === ex.answer ? 'reveal' : '')} disabled={choice.done} onPick={choice.pick}/>)}</CardGrid></ExLayout>;
}
function shuffle(items) { const result = [...items]; for (let i=result.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1)); [result[i],result[j]]=[result[j],result[i]];} return result; }
function ExerciseRenderer(props) {
  const renderers = {letter_choice:LetterChoice,audio_to_letter:LetterChoice,picture_to_word:PictureToWord,audio_to_word:AudioToWord,audio_to_picture:AudioToWord,fill_missing:FillMissing,build_word:BuildWord,sentence_order:SentenceOrder,sound_choice:SoundChoice,story_choice:StoryChoice,phrase_choice:PhraseChoice};
  const Renderer = renderers[props.ex.type];
  return Renderer ? <Renderer {...props}/> : <main className="exercise-layout" role="alert"><Mascot mood="think" size={100}/><p>This activity could not load. Return to the map and try another lesson.</p></main>;
}
Object.assign(window,{ExerciseRenderer,AudioButton});
