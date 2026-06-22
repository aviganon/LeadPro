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

// ============================================================
// ===== לימודי מבנים / סטטיקה (קורס 6902) =====
// חתך T משותף לשלושת הפתרונות הראשונים: אגף עליון 30×10 ס"מ, מתח אנכי 10×30 ס"מ.
//   A₁ = A₂ = 300 ס"מ²   →   מרכז כובד Yc = 25 ס"מ מהתחתית   →   Ix = 85,000 ס"מ⁴.
// ============================================================

/** מצייר את חתך ה-T (אגף 30×10 מעל מתח 10×30). סקלה 5px/ס"מ, תחתית ב-y=230. */
function TSection({ active, mode }: { active: Set<string>; mode: 'centroid' | 'inertia' }) {
  return (
    <svg viewBox="0 0 640 270" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* אגף עליון A₁ = 30×10 */}
      <g style={{ opacity: op(active, 'flange'), transition: 'opacity .4s' }}>
        <rect x="245" y="30" width="150" height="50" fill="color-mix(in oklch, var(--primary) 18%, transparent)" stroke={P} strokeWidth="2" />
        <text x="320" y="60" textAnchor="middle" fontSize="13" fill={P} fontWeight="500">A₁ = 30·10 = 300</text>
      </g>
      {/* מתח אנכי A₂ = 10×30 */}
      <g style={{ opacity: op(active, 'web'), transition: 'opacity .4s' }}>
        <rect x="295" y="80" width="50" height="150" fill="color-mix(in oklch, var(--success) 16%, transparent)" stroke={G} strokeWidth="2" />
        <text x="320" y="160" textAnchor="middle" fontSize="13" fill={G} fontWeight="500" transform="rotate(90 320 160)">A₂ = 10·30 = 300</text>
      </g>
      {/* קו ייחוס תחתון + ציר Y */}
      <line x1="225" y1="230" x2="430" y2="230" stroke={M} strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="230" y="246" fontSize="11" fill={M}>בסיס</text>
      <g style={{ opacity: op(active, 'y1'), transition: 'opacity .4s' }}>
        <line x1="410" y1="55" x2="410" y2="230" stroke={P} strokeWidth="1.5" />
        <circle cx="320" cy="55" r="3" fill={P} />
        <text x="424" y="146" textAnchor="middle" fontSize="12" fill={P} transform="rotate(-90 424 146)">y₁ = 35</text>
      </g>
      <g style={{ opacity: op(active, 'y2'), transition: 'opacity .4s' }}>
        <line x1="265" y1="155" x2="265" y2="230" stroke={G} strokeWidth="1.5" />
        <circle cx="320" cy="155" r="3" fill={G} />
        <text x="251" y="192" textAnchor="middle" fontSize="12" fill={G} transform="rotate(-90 251 192)">y₂ = 15</text>
      </g>
      <g style={{ opacity: op(active, 'yc'), transition: 'opacity .4s' }}>
        <line x1="235" y1="105" x2="455" y2="105" stroke="var(--accent)" strokeWidth="2.5" />
        <text x="470" y="100" textAnchor="middle" fontSize="14" fill="var(--accent)" fontWeight="500">Yc=25</text>
      </g>
      {mode === 'inertia' && (
        <>
          <g style={{ opacity: op(active, 'd1'), transition: 'opacity .4s' }}>
            <line x1="360" y1="55" x2="360" y2="105" stroke={P} strokeWidth="2.5" />
            <text x="385" y="82" textAnchor="middle" fontSize="12" fill={P} fontWeight="500">d₁=10</text>
          </g>
          <g style={{ opacity: op(active, 'd2'), transition: 'opacity .4s' }}>
            <line x1="360" y1="105" x2="360" y2="155" stroke={G} strokeWidth="2.5" />
            <text x="385" y="135" textAnchor="middle" fontSize="12" fill={G} fontWeight="500">d₂=10</text>
          </g>
        </>
      )}
    </svg>
  )
}

// ===== מרכז כובד של חתך מורכב =====
const centroidT: GuidedSol = {
  id: 'centroid-tsection',
  title: 'מרכז כובד — חתך T מורכב',
  question: 'חתך T בנוי משני מלבנים: אגף עליון 30×10 ס"מ ומתח אנכי 10×30 ס"מ. מהו המרחק Yc של מרכז הכובד מבסיס החתך?',
  answer: 25, unit: 'ס"מ', tolerance: 0.3,
  steps: [
    { title: 'מחלקים את החתך לשני מלבנים פשוטים ומחשבים את שטח כל אחד.', math: 'A₁ = 30·10 = 300 ;  A₂ = 10·30 = 300 ס"מ²', on: ['flange', 'web'] },
    { title: 'מוצאים את גובה מרכז הכובד של כל מלבן מהבסיס (התחתית).', math: 'y₁ = 30 + 10/2 = 35 ;  y₂ = 30/2 = 15', on: ['y1', 'y2'] },
    { title: 'מציבים בנוסחת מרכז הכובד המשוקלל לפי שטחים.', math: 'Yc = (A₁·y₁ + A₂·y₂) / (A₁ + A₂)', on: ['flange', 'web', 'y1', 'y2'] },
    { title: 'מחשבים — זהו מיקום הציר המרכזי שעליו נחשב בהמשך את מומנט האינרציה.', math: 'Yc = (300·35 + 300·15) / 600 = 25 ס"מ', on: ['yc'] },
  ],
  Diagram: ({ active }) => <TSection active={active} mode="centroid" />,
}

// ===== מומנט אינרציה (משפט הצירים המקבילים) =====
const inertiaT: GuidedSol = {
  id: 'inertia-tsection',
  title: 'מומנט אינרציה — חתך T (צירים מקבילים)',
  question: 'לאותו חתך T (Yc=25 ס"מ מהבסיס), חשב את מומנט האינרציה Ix סביב הציר המרכזי האופקי. (בס"מ⁴)',
  answer: 85000, unit: 'ס"מ⁴', tolerance: 200,
  steps: [
    { title: 'מומנט האינרציה העצמי של מלבן סביב צירו: I = b·h³/12.', math: 'I₁ = 30·10³/12 = 2500 ;  I₂ = 10·30³/12 = 22500', on: ['flange', 'web'] },
    { title: 'מרחק מרכז כל מלבן מהציר המרכזי (Yc=25).', math: 'd₁ = |35−25| = 10 ;  d₂ = |15−25| = 10', on: ['d1', 'd2', 'yc'] },
    { title: 'משפט הצירים המקבילים — מוסיפים לכל מלבן את A·d².', math: 'Ix = Σ(Iᵢ + Aᵢ·dᵢ²)', on: ['flange', 'web', 'd1', 'd2'] },
    { title: 'אגף: 2500 + 300·10² = 32500.  מתח: 22500 + 300·10² = 52500.', math: 'Ix = 32500 + 52500 = 85000 ס"מ⁴', on: ['yc'] },
  ],
  Diagram: ({ active }) => <TSection active={active} mode="inertia" />,
}

// ===== מאמץ כפיפה — קורה פשוטה בעומס מפולג =====
const bendingStress: GuidedSol = {
  id: 'bending-stress',
  title: 'מאמץ כפיפה — קורה פשוטה',
  question: 'קורה פשוטה במוטת 6 מ\' נושאת עומס מפולג אחיד q=4 טון/מ\'. חתך הקורה הוא ה-T שלמעלה (Ix=85000 ס"מ⁴, y_max=25 ס"מ). מהו מאמץ הכפיפה המרבי? (בק"ג/ס"מ²)',
  answer: 529, unit: 'ק"ג/ס"מ²', tolerance: 4,
  steps: [
    { title: 'מומנט מרבי בקורה פשוטה עם עומס מפולג אחיד נמצא באמצע המוטה.', math: 'Mmax = q·L²/8', on: ['beam', 'load'] },
    { title: 'מציבים q=4 טון/מ\' ו-L=6 מ\'.', math: 'Mmax = 4·6²/8 = 18 טון·מ\'', on: ['mdiag', 'mmax'] },
    { title: 'ממירים ליחידות ק"ג·ס"מ (×1000×100) לצורך חישוב המאמץ.', math: '18 טון·מ\' = 1,800,000 ק"ג·ס"מ', on: ['mmax'] },
    { title: 'מאמץ הכפיפה: המומנט כפול המרחק לסיב הקיצוני, חלקי מומנט האינרציה.', math: 'σ = Mmax·y_max / Ix', on: ['sec', 'stress'] },
    { title: 'מחשבים — המאמץ המרבי בסיב התחתון (המרוחק ביותר מהציר המרכזי).', math: 'σ = 1,800,000·25 / 85,000 = 529 ק"ג/ס"מ²', on: ['stress'] },
  ],
  Diagram: ({ active }) => (
    <svg viewBox="0 0 640 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* קורה + סמכים */}
      <g style={{ opacity: op(active, 'beam'), transition: 'opacity .4s' }}>
        <line x1="70" y1="70" x2="380" y2="70" stroke={T} strokeWidth="4" />
        <polygon points="70,70 58,90 82,90" fill={M} /><polygon points="380,70 368,90 392,90" fill={M} />
        <text x="225" y="118" textAnchor="middle" fontSize="12" fill={M}>L = 6 מ&#39;</text>
        <line x1="70" y1="104" x2="380" y2="104" stroke={M} strokeWidth="1" strokeDasharray="4 3" />
      </g>
      {/* עומס מפולג */}
      <g style={{ opacity: op(active, 'load'), transition: 'opacity .4s' }}>
        {[0,1,2,3,4,5,6].map((k) => <line key={k} x1={70 + k * 51.6} y1="34" x2={70 + k * 51.6} y2="64" stroke={P} strokeWidth="2" markerEnd="url(#qa)" />)}
        <line x1="70" y1="34" x2="380" y2="34" stroke={P} strokeWidth="2" />
        <text x="225" y="26" textAnchor="middle" fontSize="13" fill={P} fontWeight="500">q = 4 טון/מ&#39;</text>
        <defs><marker id="qa" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M1,1 L4,6 L7,1" fill="none" stroke={P} strokeWidth="1.5" /></marker></defs>
      </g>
      {/* דיאגרמת מומנטים */}
      <g style={{ opacity: op(active, 'mdiag'), transition: 'opacity .4s' }}>
        <line x1="70" y1="150" x2="380" y2="150" stroke={M} strokeWidth="1.5" />
        <path d="M 70 150 Q 225 250 380 150" fill="color-mix(in oklch, var(--accent) 14%, transparent)" stroke="var(--accent)" strokeWidth="2" />
      </g>
      <g style={{ opacity: op(active, 'mmax'), transition: 'opacity .4s' }}>
        <line x1="225" y1="150" x2="225" y2="232" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="225" y="270" textAnchor="middle" fontSize="13" fill="var(--accent)" fontWeight="500">Mmax = 18 טון·מ&#39;</text>
      </g>
      {/* חתך + פילוג מאמצים */}
      <g style={{ opacity: op(active, 'sec'), transition: 'opacity .4s' }}>
        <rect x="470" y="40" width="90" height="22" fill="none" stroke={M} strokeWidth="1.5" />
        <rect x="505" y="62" width="20" height="90" fill="none" stroke={M} strokeWidth="1.5" />
        <line x1="455" y1="107" x2="575" y2="107" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
      <g style={{ opacity: op(active, 'stress'), transition: 'opacity .4s' }}>
        <line x1="575" y1="40" x2="575" y2="152" stroke={P} strokeWidth="1" />
        <polygon points="575,40 600,40 575,107" fill="color-mix(in oklch, var(--success) 22%, transparent)" stroke={G} strokeWidth="1.5" />
        <polygon points="575,107 575,152 622,152" fill="color-mix(in oklch, var(--primary) 22%, transparent)" stroke={P} strokeWidth="1.5" />
        <text x="610" y="172" textAnchor="middle" fontSize="12" fill={P} fontWeight="500">σmax</text>
        <text x="575" y="190" textAnchor="middle" fontSize="11" fill={M}>y_max=25</text>
      </g>
    </svg>
  ),
}

// ===== תכן קורה — בחירת מודול התנגדות Wx =====
const bendingDesign: GuidedSol = {
  id: 'bending-design',
  title: 'תכן קורה — מודול התנגדות נדרש',
  question: 'קורה פשוטה במוטת 4 מ\' נושאת עומס מפולג q=3 טון/מ\'. המאמץ המותר σ=1600 ק"ג/ס"מ². מהו מודול ההתנגדות Wx הנדרש? (בס"מ³)',
  answer: 375, unit: 'ס"מ³', tolerance: 3,
  steps: [
    { title: 'מחשבים תחילה את המומנט המרבי בקורה.', math: 'Mmax = q·L²/8 = 3·4²/8 = 6 טון·מ\'', on: ['beam', 'mmax'] },
    { title: 'ממירים ליחידות ק"ג·ס"מ.', math: 'Mmax = 6 טון·מ\' = 600,000 ק"ג·ס"מ', on: ['mmax'] },
    { title: 'מודול ההתנגדות הנדרש = מומנט מרבי חלקי המאמץ המותר.', math: 'Wx = Mmax / σ', on: ['formula'] },
    { title: 'מחשבים את הדרישה.', math: 'Wx = 600,000 / 1600 = 375 ס"מ³', on: ['result'] },
    { title: 'בוחרים פרופיל תקני עם Wx גדול או שווה לדרישה — למשל IPN 260 (Wx=442 ס"מ³).', math: 'בחר Wx ≥ 375  →  IPN 260 ✓', on: ['result', 'profile'] },
  ],
  Diagram: ({ active }) => (
    <svg viewBox="0 0 640 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <g style={{ opacity: op(active, 'beam'), transition: 'opacity .4s' }}>
        <line x1="70" y1="60" x2="340" y2="60" stroke={T} strokeWidth="4" />
        <polygon points="70,60 58,80 82,80" fill={M} /><polygon points="340,60 328,80 352,80" fill={M} />
        {[0,1,2,3,4,5].map((k) => <line key={k} x1={70 + k * 54} y1="28" x2={70 + k * 54} y2="56" stroke={P} strokeWidth="2" />)}
        <line x1="70" y1="28" x2="340" y2="28" stroke={P} strokeWidth="2" />
        <text x="205" y="20" textAnchor="middle" fontSize="12" fill={P} fontWeight="500">q = 3 טון/מ&#39;</text>
        <text x="205" y="100" textAnchor="middle" fontSize="11" fill={M}>L = 4 מ&#39;</text>
      </g>
      <g style={{ opacity: op(active, 'mmax'), transition: 'opacity .4s' }}>
        <rect x="120" y="130" width="170" height="30" rx="6" fill="color-mix(in oklch, var(--accent) 14%, transparent)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="205" y="151" textAnchor="middle" fontSize="13" fill="var(--accent)" fontWeight="500">Mmax = 6 טון·מ&#39;</text>
      </g>
      <g style={{ opacity: op(active, 'formula'), transition: 'opacity .4s' }}>
        <text x="470" y="60" textAnchor="middle" fontSize="15" fill={T} fontWeight="500">Wx = Mmax / σ</text>
      </g>
      <g style={{ opacity: op(active, 'result'), transition: 'opacity .4s' }}>
        <rect x="395" y="95" width="150" height="40" rx="8" fill="color-mix(in oklch, var(--success) 16%, transparent)" stroke={G} strokeWidth="2" />
        <text x="470" y="121" textAnchor="middle" fontSize="15" fill={G} fontWeight="500">Wx = 375 ס&quot;מ³</text>
      </g>
      <g style={{ opacity: op(active, 'profile'), transition: 'opacity .4s' }}>
        <rect x="408" y="150" width="124" height="34" rx="6" fill="color-mix(in oklch, var(--primary) 14%, transparent)" stroke={P} strokeWidth="1.5" />
        <text x="470" y="172" textAnchor="middle" fontSize="13" fill={P} fontWeight="500">IPN 260</text>
      </g>
    </svg>
  ),
}

// ===== קריסת עמוד — שיטת ω (אומגה) =====
const buckling: GuidedSol = {
  id: 'column-buckling',
  title: 'קריסת עמוד — בדיקה בשיטת ω',
  question: 'עמוד פלדה מפרקי-מפרקי באורך 6 מ\' נושא עומס לחיצה N=16 טון. חתך: A=32 ס"מ², I_min=2048 ס"מ⁴. מקדם הקריסה מהטבלה ω=1.41. מהו מאמץ הקריסה? (בק"ג/ס"מ²)',
  answer: 705, unit: 'ק"ג/ס"מ²', tolerance: 5,
  steps: [
    { title: 'אורך הקריסה: עמוד מפרקי-מפרקי → מקדם k=1.', math: 'Le = k·L = 1·6 = 6 מ\' = 600 ס"מ', on: ['col', 'le'] },
    { title: 'רדיוס הגירציה (היניקה) של החתך סביב הציר החלש.', math: 'i = √(I_min / A) = √(2048/32) = 8 ס"מ', on: ['sect'] },
    { title: 'תלילות העמוד = אורך הקריסה חלקי רדיוס הגירציה.', math: 'λ = Le / i = 600 / 8 = 75', on: ['lambda'] },
    { title: 'לפי התלילות λ=75 שולפים מהטבלה את מקדם הקריסה ω.', math: 'ω(75) = 1.41', on: ['omega'] },
    { title: 'מאמץ הקריסה = ω כפול המאמץ הצירי. משווים למאמץ המותר (1400 ק"ג/ס"מ²).', math: 'σ = ω·N/A = 1.41·16000/32 = 705 < 1400 ✓', on: ['check'] },
  ],
  Diagram: ({ active }) => (
    <svg viewBox="0 0 640 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* עומס לחיצה */}
      <g style={{ opacity: op(active, 'load'), transition: 'opacity .4s' }}>
        <line x1="200" y1="14" x2="200" y2="46" stroke={P} strokeWidth="3" markerEnd="url(#na)" />
        <text x="200" y="10" textAnchor="middle" fontSize="13" fill={P} fontWeight="500">N = 16 טון</text>
        <defs><marker id="na" markerWidth="10" markerHeight="10" refX="5" refY="8" orient="auto"><path d="M1,1 L5,8 L9,1" fill="none" stroke={P} strokeWidth="1.6" /></marker></defs>
      </g>
      {/* עמוד + צורת קריסה */}
      <g style={{ opacity: op(active, 'col'), transition: 'opacity .4s' }}>
        <line x1="200" y1="48" x2="200" y2="248" stroke={T} strokeWidth="5" />
        <polygon points="200,248 188,266 212,266" fill={M} /><line x1="184" y1="266" x2="216" y2="266" stroke={M} strokeWidth="2" />
        <circle cx="200" cy="48" r="5" fill="none" stroke={M} strokeWidth="2" />
      </g>
      <g style={{ opacity: op(active, 'le'), transition: 'opacity .4s' }}>
        <path d="M 200 48 C 250 110 250 186 200 248" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 4" />
        <line x1="150" y1="48" x2="150" y2="248" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="135" y="152" textAnchor="middle" fontSize="13" fill="var(--accent)" fontWeight="500" transform="rotate(-90 135 152)">Le = 600 ס&quot;מ</text>
      </g>
      {/* חתך */}
      <g style={{ opacity: op(active, 'sect'), transition: 'opacity .4s' }}>
        <rect x="360" y="70" width="70" height="44" fill="color-mix(in oklch, var(--success) 14%, transparent)" stroke={G} strokeWidth="1.5" />
        <text x="395" y="58" textAnchor="middle" fontSize="12" fill={G}>A=32 · I=2048</text>
        <text x="395" y="98" textAnchor="middle" fontSize="13" fill={G} fontWeight="500">i = 8</text>
      </g>
      <g style={{ opacity: op(active, 'lambda'), transition: 'opacity .4s' }}>
        <rect x="345" y="140" width="120" height="32" rx="6" fill="color-mix(in oklch, var(--primary) 12%, transparent)" stroke={P} strokeWidth="1.5" />
        <text x="405" y="161" textAnchor="middle" fontSize="14" fill={P} fontWeight="500">λ = 75</text>
      </g>
      <g style={{ opacity: op(active, 'omega'), transition: 'opacity .4s' }}>
        <rect x="345" y="180" width="120" height="32" rx="6" fill="color-mix(in oklch, var(--primary) 12%, transparent)" stroke={P} strokeWidth="1.5" />
        <text x="405" y="201" textAnchor="middle" fontSize="14" fill={P} fontWeight="500">ω = 1.41</text>
      </g>
      <g style={{ opacity: op(active, 'check'), transition: 'opacity .4s' }}>
        <rect x="500" y="120" width="130" height="44" rx="8" fill="color-mix(in oklch, var(--success) 16%, transparent)" stroke={G} strokeWidth="2" />
        <text x="565" y="140" textAnchor="middle" fontSize="14" fill={G} fontWeight="500">σ = 705</text>
        <text x="565" y="156" textAnchor="middle" fontSize="11" fill={G}>&lt; 1400 ✓</text>
      </g>
    </svg>
  ),
}

/** פתרונות מודרכים לפי מספר קורס. */
export const GUIDED_SOLUTIONS: Record<string, GuidedSol[]> = {
  '6966': [excavation, walkway, crane, cable],
  '6902': [centroidT, inertiaT, bendingStress, bendingDesign, buckling],
}
