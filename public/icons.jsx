/* ============================================================
   HEBREW HEROES — mascot + icon library (flat cartoon SVG)
   Exposes window.Mascot and window.Icon
   ============================================================ */

// ---- Alefi: the flying Aleph companion ----
// Body is the real glyph א so the letter the child is learning IS the hero.
function Mascot({ mood = 'happy', size = 150, style = {} }) {
  const blink = mood === 'cheer' || mood === 'happy';
  const eyeY = mood === 'sad' ? 44 : 42;
  const mouth = {
    happy:  'M40 64 Q60 80 80 64',
    cheer:  'M38 60 Q60 86 82 60 Q60 70 38 60 Z',
    think:  'M46 68 Q60 62 74 68',
    sad:    'M42 72 Q60 60 78 72',
  }[mood] || 'M40 64 Q60 80 80 64';
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} style={style} aria-hidden="true">
      {/* wings */}
      <g className="bob" style={{ transformOrigin: '60px 60px' }}>
        <ellipse cx="14" cy="58" rx="16" ry="11" fill="#bdeaff" transform="rotate(-18 14 58)"/>
        <ellipse cx="106" cy="58" rx="16" ry="11" fill="#bdeaff" transform="rotate(18 106 58)"/>
        {/* head blob */}
        <circle cx="60" cy="58" r="44" fill="#ffce4a"/>
        <circle cx="60" cy="58" r="44" fill="none" stroke="#f7a823" strokeWidth="4"/>
        {/* the aleph glyph as the face's "marking" */}
        <text x="60" y="58" textAnchor="middle" dominantBaseline="central"
              fontFamily="'Rubik', sans-serif" fontWeight="900" fontSize="78"
              fill="#f7a823" opacity="0.22">א</text>
        {/* cheeks */}
        <circle cx="38" cy="60" r="7" fill="#ff9aa6" opacity="0.7"/>
        <circle cx="82" cy="60" r="7" fill="#ff9aa6" opacity="0.7"/>
        {/* eyes */}
        <circle cx="47" cy={eyeY} r="8.5" fill="#fff"/>
        <circle cx="73" cy={eyeY} r="8.5" fill="#fff"/>
        <circle cx={49} cy={eyeY + 1} r="4.5" fill="#38322c"/>
        <circle cx={75} cy={eyeY + 1} r="4.5" fill="#38322c"/>
        <circle cx={50} cy={eyeY} r="1.6" fill="#fff"/>
        <circle cx={76} cy={eyeY} r="1.6" fill="#fff"/>
        {/* mouth */}
        <path d={mouth} fill={mood==='cheer' ? '#ef4f66' : 'none'} stroke="#38322c" strokeWidth="3.5" strokeLinecap="round"/>
        {/* little antenna sparkle */}
        <line x1="60" y1="14" x2="60" y2="4" stroke="#f7a823" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="60" cy="2" r="4" fill="#ff7a8a"/>
      </g>
    </svg>
  );
}

// ---- icon library ----
const ICONS = {
  // animals
  dog: (
    <g>
      <ellipse cx="50" cy="62" rx="30" ry="26" fill="#c98a4b"/>
      <ellipse cx="50" cy="70" rx="18" ry="15" fill="#f3d9b8"/>
      <path d="M22 34 Q14 30 16 50 Q24 50 28 44Z" fill="#a96a30"/>
      <path d="M78 34 Q86 30 84 50 Q76 50 72 44Z" fill="#a96a30"/>
      <circle cx="40" cy="56" r="4.5" fill="#38322c"/>
      <circle cx="60" cy="56" r="4.5" fill="#38322c"/>
      <ellipse cx="50" cy="68" rx="6" ry="4.5" fill="#38322c"/>
      <path d="M44 76 Q50 82 56 76" stroke="#38322c" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </g>
  ),
  cat: (
    <g>
      <ellipse cx="50" cy="60" rx="28" ry="26" fill="#9aa6b2"/>
      <path d="M28 40 L24 20 L42 34Z" fill="#9aa6b2"/>
      <path d="M72 40 L76 20 L58 34Z" fill="#9aa6b2"/>
      <path d="M30 38 L28 26 L38 34Z" fill="#ffb4c2"/>
      <path d="M70 38 L72 26 L62 34Z" fill="#ffb4c2"/>
      <circle cx="40" cy="56" r="5" fill="#2f8f6a"/>
      <circle cx="60" cy="56" r="5" fill="#2f8f6a"/>
      <path d="M46 66 L54 66 L50 71Z" fill="#ff7a8a"/>
      <path d="M50 71 L50 76" stroke="#38322c" strokeWidth="2.5"/>
      <path d="M30 66 L42 68 M30 72 L42 71 M70 66 L58 68 M70 72 L58 71" stroke="#cfd6dd" strokeWidth="2" strokeLinecap="round"/>
    </g>
  ),
  fish: (
    <g>
      <path d="M70 50 L92 34 L88 50 L92 66Z" fill="#ff9a3c"/>
      <ellipse cx="46" cy="50" rx="34" ry="22" fill="#ffb454"/>
      <path d="M20 50 Q34 36 50 38" stroke="#f08a1c" strokeWidth="3" fill="none"/>
      <circle cx="28" cy="44" r="5" fill="#fff"/>
      <circle cx="27" cy="44" r="2.6" fill="#38322c"/>
      <path d="M40 60 Q54 54 66 60" stroke="#f08a1c" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </g>
  ),
  bird: (
    <g>
      <ellipse cx="52" cy="56" rx="26" ry="24" fill="#67b8ff"/>
      <circle cx="38" cy="44" r="14" fill="#8fd6ff"/>
      <path d="M24 46 L10 50 L24 54Z" fill="#ffb454"/>
      <circle cx="36" cy="42" r="4" fill="#38322c"/>
      <path d="M62 50 Q84 44 80 64 Q70 60 60 60Z" fill="#3f93e0"/>
      <path d="M50 80 L46 90 M58 80 L60 90" stroke="#ffb454" strokeWidth="3" strokeLinecap="round"/>
    </g>
  ),
  horse: (
    <g>
      <path d="M40 86 L40 56 Q40 36 60 34 L72 30 Q84 30 82 44 L80 56 L70 56 L70 86" fill="#b07a44"/>
      <path d="M72 30 L88 24 L82 38Z" fill="#8a5a2c"/>
      <path d="M58 34 Q44 30 40 44 Q52 46 58 40Z" fill="#7a4e26"/>
      <circle cx="76" cy="40" r="3.4" fill="#38322c"/>
      <rect x="40" y="80" width="8" height="10" rx="3" fill="#8a5a2c"/>
      <rect x="62" y="80" width="8" height="10" rx="3" fill="#8a5a2c"/>
    </g>
  ),
  // food
  apple: (
    <g>
      <path d="M50 30 Q40 22 30 30 Q20 40 28 60 Q34 82 50 82 Q66 82 72 60 Q80 40 70 30 Q60 22 50 30Z" fill="#ff5d5d"/>
      <path d="M50 30 Q52 18 62 14" stroke="#7a4e26" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M52 24 Q64 18 70 24 Q60 30 52 28Z" fill="#4caf50"/>
      <ellipse cx="40" cy="44" rx="6" ry="9" fill="#fff" opacity="0.4"/>
    </g>
  ),
  banana: (
    <g>
      <path d="M22 40 Q26 74 60 80 Q86 82 82 70 Q60 74 42 56 Q30 44 34 36Z" fill="#ffd23c"/>
      <path d="M22 40 Q26 74 60 80" stroke="#e0a91c" strokeWidth="3" fill="none"/>
      <path d="M32 34 L36 38 L30 42Z" fill="#7a5a26"/>
    </g>
  ),
  bread: (
    <g>
      <path d="M22 56 Q22 36 50 36 Q78 36 78 56 L74 76 Q72 82 64 82 L36 82 Q28 82 26 76Z" fill="#e8a857"/>
      <path d="M22 56 Q22 36 50 36 Q78 36 78 56Z" fill="#f3c27a"/>
      <path d="M34 50 Q38 46 42 50 M50 48 Q54 44 58 48 M64 50 Q68 46 72 50" stroke="#c98a4b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </g>
  ),
  milk: (
    <g>
      <path d="M36 30 L64 30 L64 40 L70 52 L70 84 L30 84 L30 52 L36 40Z" fill="#fff"/>
      <path d="M36 30 L64 30 L64 40 L70 52 L70 84 L30 84 L30 52 L36 40Z" fill="none" stroke="#9fb6c9" strokeWidth="3"/>
      <rect x="30" y="60" width="40" height="24" fill="#bfe0ff"/>
      <path d="M30 60 L70 60 L70 84 L30 84Z" fill="none" stroke="#9fb6c9" strokeWidth="3"/>
      <circle cx="50" cy="50" r="5" fill="#ffce4a"/>
    </g>
  ),
  house: (
    <g>
      <path d="M50 22 L84 50 L74 50 L74 82 L26 82 L26 50 L16 50Z" fill="#ff7a8a"/>
      <rect x="26" y="50" width="48" height="32" fill="#ffd9a0"/>
      <rect x="42" y="60" width="16" height="22" rx="2" fill="#a96a30"/>
      <rect x="32" y="56" width="10" height="10" rx="2" fill="#8fd6ff"/>
    </g>
  ),
  sun: (
    <g>
      <circle cx="50" cy="50" r="22" fill="#ffce4a"/>
      <g stroke="#ffb43c" strokeWidth="5" strokeLinecap="round">
        <line x1="50" y1="14" x2="50" y2="24"/><line x1="50" y1="76" x2="50" y2="86"/>
        <line x1="14" y1="50" x2="24" y2="50"/><line x1="76" y1="50" x2="86" y2="50"/>
        <line x1="24" y1="24" x2="31" y2="31"/><line x1="69" y1="69" x2="76" y2="76"/>
        <line x1="76" y1="24" x2="69" y2="31"/><line x1="31" y1="69" x2="24" y2="76"/>
      </g>
    </g>
  ),
  book: (
    <g>
      <path d="M50 32 Q34 24 20 30 L20 76 Q34 70 50 78Z" fill="#ff7a8a"/>
      <path d="M50 32 Q66 24 80 30 L80 76 Q66 70 50 78Z" fill="#ffb454"/>
      <path d="M50 32 L50 78" stroke="#fff" strokeWidth="3"/>
      <path d="M28 42 L42 46 M28 52 L42 56 M58 46 L72 42 M58 56 L72 52" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
    </g>
  ),
  // areas
  village:  (<g><rect x="26" y="48" width="48" height="34" rx="4" fill="#ffd9a0"/><path d="M22 50 L50 26 L78 50Z" fill="#ff7a8a"/><rect x="44" y="60" width="14" height="22" fill="#a96a30"/><circle cx="50" cy="20" r="6" fill="#ffce4a"/></g>),
  garden:   (<g><path d="M20 82 Q50 70 80 82" fill="#34c87f"/><circle cx="36" cy="54" r="12" fill="#ff7a8a"/><circle cx="36" cy="54" r="4" fill="#ffce4a"/><circle cx="64" cy="50" r="13" fill="#a98bff"/><circle cx="64" cy="50" r="4" fill="#ffce4a"/><rect x="34" y="58" width="4" height="20" fill="#2f8f6a"/><rect x="62" y="54" width="4" height="24" fill="#2f8f6a"/></g>),
  bridge:   (<g><path d="M14 70 Q50 36 86 70" stroke="#a98bff" strokeWidth="10" fill="none"/><path d="M14 70 L14 82 M86 70 L86 82 M40 53 L40 78 M60 53 L60 78" stroke="#7c5cf0" strokeWidth="6" strokeLinecap="round"/></g>),
  forest:   (<g><path d="M50 18 L70 50 L58 50 L74 76 L26 76 L42 50 L30 50Z" fill="#2f8f6a"/><rect x="44" y="74" width="12" height="12" fill="#a96a30"/></g>),
  lake:     (<g><ellipse cx="50" cy="58" rx="34" ry="22" fill="#67b8ff"/><path d="M28 56 Q34 50 40 56 M52 60 Q58 54 64 60" stroke="#bdeaff" strokeWidth="4" fill="none" strokeLinecap="round"/><circle cx="62" cy="40" r="8" fill="#ffce4a"/></g>),
  castle:   (<g><rect x="28" y="44" width="44" height="40" fill="#ff9aa6"/><rect x="24" y="34" width="10" height="14" fill="#ff7a8a"/><rect x="45" y="30" width="10" height="18" fill="#ff7a8a"/><rect x="66" y="34" width="10" height="14" fill="#ff7a8a"/><rect x="44" y="62" width="12" height="22" fill="#a96a30"/></g>),
  market:   (<g><rect x="26" y="48" width="48" height="36" fill="#fff0d6"/><path d="M22 48 L78 48 L72 32 L28 32Z" fill="#ff7a8a"/><path d="M28 32 L36 48 M44 32 L44 48 M56 32 L52 48 M64 32 L60 48" stroke="#fff" strokeWidth="3"/></g>),
  mountain: (<g><path d="M16 80 L42 34 L56 58 L66 44 L84 80Z" fill="#a98bff"/><path d="M36 44 L42 34 L48 44 L43 50Z" fill="#fff"/><path d="M60 52 L66 44 L72 54Z" fill="#fff"/></g>),
  // rewards / misc
  alef:   (<g><circle cx="50" cy="50" r="40" fill="#ffce4a"/><text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontFamily="Rubik" fontWeight="900" fontSize="56" fill="#fff">א</text></g>),
  star:   (<g><path d="M50 14 L61 40 L89 42 L67 60 L75 88 L50 72 L25 88 L33 60 L11 42 L39 40Z" fill="#ffc23c" stroke="#f7a823" strokeWidth="3"/></g>),
  trophy: (<g><path d="M34 24 L66 24 L64 48 Q60 62 50 62 Q40 62 36 48Z" fill="#ffc23c"/><path d="M34 30 Q20 30 24 44 Q28 52 36 48" fill="none" stroke="#ffc23c" strokeWidth="6"/><path d="M66 30 Q80 30 76 44 Q72 52 64 48" fill="none" stroke="#ffc23c" strokeWidth="6"/><rect x="44" y="62" width="12" height="14" fill="#f7a823"/><rect x="34" y="76" width="32" height="8" rx="3" fill="#f7a823"/></g>),
  paw:    (<g><ellipse cx="50" cy="62" rx="18" ry="15" fill="#c98a4b"/><circle cx="32" cy="44" r="8" fill="#c98a4b"/><circle cx="46" cy="36" r="8" fill="#c98a4b"/><circle cx="62" cy="38" r="8" fill="#c98a4b"/><circle cx="74" cy="50" r="7" fill="#c98a4b"/></g>),
  medal:  (<g><path d="M38 18 L48 44 L34 44Z" fill="#67b8ff"/><path d="M62 18 L66 44 L52 44Z" fill="#ff7a8a"/><circle cx="50" cy="62" r="22" fill="#ffc23c" stroke="#f7a823" strokeWidth="4"/><text x="50" y="64" textAnchor="middle" dominantBaseline="central" fontFamily="Rubik" fontWeight="900" fontSize="22" fill="#fff">1</text></g>),
  coin:   (<g><circle cx="50" cy="50" r="34" fill="#ffce4a" stroke="#f7a823" strokeWidth="4"/><circle cx="50" cy="50" r="24" fill="none" stroke="#f7a823" strokeWidth="3"/><text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontFamily="Rubik" fontWeight="900" fontSize="30" fill="#f7a823">א</text></g>),
  lock:   (<g><rect x="30" y="46" width="40" height="34" rx="8" fill="#b7ad9f"/><path d="M38 46 V36 a12 12 0 0 1 24 0 V46" fill="none" stroke="#b7ad9f" strokeWidth="7"/><circle cx="50" cy="60" r="5" fill="#fff"/></g>),
};

function Icon({ name, size = 64, style = {} }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style} aria-hidden="true">
      {ICONS[name] || ICONS.star}
    </svg>
  );
}

Object.assign(window, { Mascot, Icon });
