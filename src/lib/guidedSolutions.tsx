import type { GuidedSol } from '@/components/GuidedSolution'

const op = (a: Set<string>, id: string) => (a.has(id) ? 1 : 0.16)
const T = 'var(--foreground)'
const M = 'var(--muted-foreground)'
const P = 'var(--primary)'
const G = 'var(--success)'

// ===== חפירה — מרחק מינימלי לאחסון עפר (טריגונומטריה) =====
const excavation: GuidedSol = {
  id: 'excavation-distance',
  title: 'חפירה — מרחק אחסון העפר',
  question: 'חפירה בעומק 3.00 מ\', שיפוע טבעי α=40°, רוחב שוחה 1.20 מ\'. מהו המרחק L ממרכז החפירה לערמת החומר?',
  answer: 5.18, unit: 'מ\'', tolerance: 0.06,
  steps: [
    { title: 'נתון: עומק 3.00 מ\', זווית שיפוע α=40°, רוחב שוחה 1.20 מ\'. נמצא את L.', on: ['ground'] },
    { title: 'השיפוע יוצר משולש ישר-זווית: הניצב האנכי הוא העומק (3.00 מ\') והזווית α=40°.', math: 'a = 3 ÷ tan(40°)', on: ['tri', 'depth', 'ang'] },
    { title: 'מציבים tan(40°) ≈ 0.839 ומקבלים את ההיטל האופקי של השיפוע:', math: 'a = 3 ÷ 0.839 = 3.58 מ\'', on: ['tri', 'arun'] },
    { title: 'מחברים ממרכז החפירה: חצי השוחה + 0.50 + ההיטל a + 0.50 (מרחק מינ\' מהשפה).', math: 'L = 1.20÷2 + 0.50 + 3.58 + 0.50', on: ['arun', 'lmeas'] },
    { title: 'זהו המרחק המינימלי המותר לאחסון עפר החפירה:', math: 'L = 0.60 + 0.50 + 3.58 + 0.50 = 5.18 מ\'', on: ['lmeas'] },
  ],
  Diagram: ({ active }) => (
    <svg viewBox="0 0 640 290" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1="20" y1="96" x2="245" y2="96" stroke={T} strokeWidth="3" />
      <line x1="465" y1="96" x2="620" y2="96" stroke={T} strokeWidth="3" />
      <polyline points="245,96 325,236 385,236 465,96" fill="none" stroke={M} strokeWidth="2" />
      <rect x="340" y="120" width="30" height="116" fill="color-mix(in oklch, var(--accent) 25%, transparent)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="355" y="182" textAnchor="middle" fontSize="12" fill="var(--accent)" transform="rotate(90 355 182)">שוחה</text>
      <g style={{ opacity: op(active, 'tri'), transition: 'opacity .4s' }}>
        <polygon points="245,96 325,236 245,236" fill="color-mix(in oklch, var(--primary) 18%, transparent)" stroke={P} strokeWidth="2" />
        <line x1="245" y1="96" x2="245" y2="236" stroke={P} strokeWidth="2.5" />
      </g>
      <g style={{ opacity: op(active, 'depth'), transition: 'opacity .4s' }}>
        <text x="233" y="170" textAnchor="middle" fontSize="14" fill={P} fontWeight="500" transform="rotate(-90 233 170)">3.00 מ&#39;</text>
      </g>
      <g style={{ opacity: op(active, 'ang'), transition: 'opacity .4s' }}>
        <path d="M 275 236 A 30 30 0 0 1 263 213" fill="none" stroke={P} strokeWidth="2" />
        <text x="288" y="228" fontSize="13" fill={P} fontWeight="500">α=40°</text>
      </g>
      <g style={{ opacity: op(active, 'arun'), transition: 'opacity .4s' }}>
        <line x1="245" y1="252" x2="325" y2="252" stroke={P} strokeWidth="2.5" />
        <text x="285" y="268" textAnchor="middle" fontSize="13" fill={P} fontWeight="500">a</text>
      </g>
      <g style={{ opacity: op(active, 'ground'), transition: 'opacity .4s' }}>
        <circle cx="545" cy="80" r="13" fill="#EF9F27" /><circle cx="560" cy="88" r="10" fill="#BA7517" /><circle cx="533" cy="86" r="9" fill="#854F0B" />
        <text x="545" y="62" textAnchor="middle" fontSize="12" fill={M}>ערמה</text>
      </g>
      <g style={{ opacity: op(active, 'lmeas'), transition: 'opacity .4s' }}>
        <line x1="355" y1="48" x2="545" y2="48" stroke={G} strokeWidth="2.5" />
        <line x1="355" y1="42" x2="355" y2="120" stroke={G} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="545" y1="42" x2="545" y2="74" stroke={G} strokeWidth="1" strokeDasharray="3 3" />
        <text x="450" y="38" textAnchor="middle" fontSize="15" fill={G} fontWeight="500">L</text>
      </g>
    </svg>
  ),
}

// ===== מדרכת מעבר — גובה מקסימלי לפי פיתגורס =====
const walkway: GuidedSol = {
  id: 'walkway-slope',
  title: 'מדרכת מעבר — גובה לפי השיפוע',
  question: 'מדרכת מעבר באורך 7.00 מ\' בשיפוע המרבי המותר (1 אנכי ל-1.5 אופקי). מהו הגובה המקסימלי H בין המפלסים?',
  answer: 3.88, unit: 'מ\'', tolerance: 0.06,
  steps: [
    { title: 'השיפוע המרבי המותר הוא 1 אנכי ל-1.5 אופקי, כלומר ההיטל האופקי גדול פי 1.5 מהגובה.', math: 'L = 1.5 · H', on: ['L', 'slope'] },
    { title: 'אורך המדרכה (7.00 מ\') הוא היתר במשולש ישר-זווית שניצביו H ו-L.', math: '7² = H² + L²', on: ['hyp', 'H', 'L'] },
    { title: 'מציבים L = 1.5H ומפתחים:', math: '49 = H² + (1.5H)² = 3.25·H²', on: ['H', 'L'] },
    { title: 'מחלצים את H:', math: 'H = √(49 ÷ 3.25) = 3.88 מ\'', on: ['H'] },
    { title: 'אם נדרש גובה 3.50 מ\' (נמוך מ-3.88) — השיפוע מותר ותקין.', math: '3.50 מ\' < 3.88 מ\'  ✓', on: ['H', 'hyp'] },
  ],
  Diagram: ({ active }) => (
    <svg viewBox="0 0 640 250" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1="40" y1="40" x2="240" y2="40" stroke={T} strokeWidth="3" />
      <line x1="400" y1="200" x2="600" y2="200" stroke={T} strokeWidth="3" />
      <text x="120" y="30" textAnchor="middle" fontSize="12" fill={M}>תקרה</text>
      <text x="500" y="222" textAnchor="middle" fontSize="12" fill={M}>תקרה</text>
      <g style={{ opacity: op(active, 'hyp'), transition: 'opacity .4s' }}>
        <line x1="240" y1="40" x2="400" y2="200" stroke="var(--accent)" strokeWidth="4" />
        <text x="332" y="108" fontSize="14" fill="var(--accent)" fontWeight="500" transform="rotate(45 332 108)">7.00 מ&#39;</text>
      </g>
      <g style={{ opacity: op(active, 'slope'), transition: 'opacity .4s' }}>
        {[0, 1, 2, 3].map((k) => <rect key={k} x={258 + k * 34} y={48 + k * 34} width="12" height="12" rx="2" fill={P} transform={`rotate(45 ${264 + k * 34} ${54 + k * 34})`} />)}
      </g>
      <g style={{ opacity: op(active, 'H'), transition: 'opacity .4s' }}>
        <line x1="240" y1="40" x2="240" y2="200" stroke={P} strokeWidth="2.5" strokeDasharray="5 4" />
        <text x="226" y="124" textAnchor="middle" fontSize="15" fill={P} fontWeight="500" transform="rotate(-90 226 124)">H</text>
      </g>
      <g style={{ opacity: op(active, 'L'), transition: 'opacity .4s' }}>
        <line x1="240" y1="200" x2="400" y2="200" stroke={G} strokeWidth="2.5" strokeDasharray="5 4" />
        <text x="320" y="218" textAnchor="middle" fontSize="14" fill={G} fontWeight="500">L = 1.5H</text>
      </g>
    </svg>
  ),
}

// ===== עגורן צריח — עומס בטוח ומשקולת מבחן =====
const crane: GuidedSol = {
  id: 'crane-moment',
  title: 'עגורן צריח — משקולת מבחן',
  question: 'מומנט העבודה הבטוח של עגורן צריח הוא 60 טון·מ\'. מה משקל משקולת המבחן לבדיקת גובל עומס יתר, ברדיוס 20 מ\'? (בטון)',
  answer: 3.75, unit: 'טון', tolerance: 0.05,
  steps: [
    { title: 'עומס העבודה הבטוח שווה למומנט מחולק ברדיוס (זרוע הכוח).', math: 'עומס = מומנט ÷ רדיוס', on: ['jib', 'rad'] },
    { title: 'מציבים מומנט 60 טון·מ\' ורדיוס 20 מ\':', math: '60 ÷ 20 = 3 טון', on: ['rad', 'load'] },
    { title: 'משקולת המבחן לבדיקת גובל עומס היתר היא 25% מעל העומס הבטוח.', math: 'משקולת = עומס × 1.25', on: ['load'] },
    { title: 'מחשבים:', math: '3 × 1.25 = 3.75 טון  ✓', on: ['load', 'test'] },
  ],
  Diagram: ({ active }) => (
    <svg viewBox="0 0 640 250" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1="60" y1="220" x2="240" y2="220" stroke={T} strokeWidth="3" />
      <rect x="118" y="60" width="20" height="160" fill="color-mix(in oklch, var(--foreground) 12%, transparent)" stroke={T} strokeWidth="1.5" />
      <g style={{ opacity: op(active, 'jib'), transition: 'opacity .4s' }}>
        <line x1="128" y1="66" x2="540" y2="66" stroke={P} strokeWidth="4" />
        <line x1="128" y1="40" x2="80" y2="66" stroke={M} strokeWidth="2" />
        <rect x="60" y="66" width="36" height="20" rx="3" fill="color-mix(in oklch, var(--foreground) 15%, transparent)" stroke={M} strokeWidth="1" />
      </g>
      <g style={{ opacity: op(active, 'rad'), transition: 'opacity .4s' }}>
        <line x1="128" y1="96" x2="500" y2="96" stroke={G} strokeWidth="2" strokeDasharray="5 4" />
        <text x="314" y="90" textAnchor="middle" fontSize="14" fill={G} fontWeight="500">רדיוס = 20 מ&#39;</text>
      </g>
      <g style={{ opacity: op(active, 'load'), transition: 'opacity .4s' }}>
        <line x1="500" y1="66" x2="500" y2="150" stroke={M} strokeWidth="1.5" />
        <rect x="476" y="150" width="48" height="40" rx="4" fill="color-mix(in oklch, var(--primary) 20%, transparent)" stroke={P} strokeWidth="2" />
        <text x="500" y="175" textAnchor="middle" fontSize="13" fill={P} fontWeight="500">עומס</text>
      </g>
      <g style={{ opacity: op(active, 'test'), transition: 'opacity .4s' }}>
        <text x="500" y="212" textAnchor="middle" fontSize="14" fill={P} fontWeight="500">3.75 טון</text>
      </g>
    </svg>
  ),
}

// ===== אביזר הרמה — עומס עבודה בטוח לפי מקדם ביטחון =====
const cable: GuidedSol = {
  id: 'cable-safety-factor',
  title: 'כבל הרמה — עומס עבודה בטוח',
  question: 'כבל פלדה נקרע בכוח של 84 טון. מהו עומס העבודה הבטוח להרמת בני אדם (מקדם ביטחון 10)? (בטון)',
  answer: 8.4, unit: 'טון', tolerance: 0.05,
  steps: [
    { title: 'עומס העבודה הבטוח (ע.ע.ב) שווה לכוח הקריעה מחולק במקדם הביטחון.', math: 'ע.ע.ב = כוח קריעה ÷ מקדם', on: ['break', 'factor'] },
    { title: 'להרמת בני אדם מקדם הביטחון הוא 10 (להרמת מטענים — 6).', math: 'מקדם = 10', on: ['factor'] },
    { title: 'מציבים ומחשבים:', math: '84 ÷ 10 = 8.4 טון  ✓', on: ['result'] },
  ],
  Diagram: ({ active }) => (
    <svg viewBox="0 0 640 230" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1="120" y1="40" x2="520" y2="40" stroke={T} strokeWidth="3" />
      <line x1="320" y1="40" x2="320" y2="150" stroke={M} strokeWidth="3" />
      <g style={{ opacity: op(active, 'break'), transition: 'opacity .4s' }}>
        <text x="320" y="30" textAnchor="middle" fontSize="14" fill={T} fontWeight="500">כוח קריעה = 84 טון</text>
      </g>
      <g style={{ opacity: op(active, 'factor'), transition: 'opacity .4s' }}>
        <rect x="250" y="86" width="140" height="34" rx="6" fill="color-mix(in oklch, var(--primary) 16%, transparent)" stroke={P} strokeWidth="1.5" />
        <text x="320" y="108" textAnchor="middle" fontSize="14" fill={P} fontWeight="500">÷ מקדם 10</text>
      </g>
      <g style={{ opacity: op(active, 'result'), transition: 'opacity .4s' }}>
        <rect x="256" y="152" width="128" height="44" rx="8" fill="color-mix(in oklch, var(--success) 18%, transparent)" stroke={G} strokeWidth="2" />
        <text x="320" y="180" textAnchor="middle" fontSize="17" fill={G} fontWeight="500">ע.ע.ב = 8.4 טון</text>
      </g>
    </svg>
  ),
}

/** פתרונות מודרכים לפי מספר קורס. */
export const GUIDED_SOLUTIONS: Record<string, GuidedSol[]> = {
  '6966': [excavation, walkway, crane, cable],
}
