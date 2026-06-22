// בנק תוכן התחלתי ליסודי (כיתות א'–ו') — מותאם לתכנית הלימודים בישראל.
// מתמטיקה (מחולל לפי כיתה × 3 רמות קושי), אנגלית, עברית, מדע.
// כל פריט מקבל מזהה דטרמיניסטי כדי שזריעה חוזרת לא תיצור כפילויות.

import { READING_CATEGORIES } from './readingContent'

export interface SeedDoc {
  collection: 'subjects' | 'topics' | 'questions' | 'games' | 'materials' | 'institutions' | 'departments'
  id: string
  data: Record<string, unknown>
}

type Diff = 1 | 2 | 3
interface Q { prompt: string; options: string[]; answer: string; explanation?: string; difficulty: Diff }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

/** 4 אפשרויות מספריות עם 3 מסיחים סבירים */
function numMc(correct: number): { options: string[]; answer: string } {
  const set = new Set<number>([correct])
  let d = 1
  while (set.size < 6) { set.add(correct + d); if (correct - d >= 0) set.add(correct - d); d++ }
  const arr = Array.from(set).filter((n) => n >= 0)
  const distractors = shuffle(arr.filter((n) => n !== correct)).slice(0, 3)
  return { options: shuffle([correct, ...distractors].map(String)), answer: String(correct) }
}
/** 4 אפשרויות טקסט; correct + מסיחים */
function textMc(correct: string, distractors: string[]): { options: string[]; answer: string } {
  const opts = shuffle([correct, ...shuffle(distractors).slice(0, 3)])
  return { options: opts, answer: correct }
}

// ============================ מתמטיקה ============================
function mathQuestions(grade: number): Q[] {
  const out: Q[] = []
  const add = (prompt: string, correct: number, difficulty: Diff, explanation?: string) =>
    out.push({ prompt, ...numMc(correct), difficulty, explanation })

  if (grade === 1) {
    for (let i = 0; i < 4; i++) { const a = rnd(1, 9), b = rnd(1, 10 - a); add(`כמה זה ${a} + ${b}?`, a + b, 1) }
    for (let i = 0; i < 3; i++) { const a = rnd(2, 10), b = rnd(1, a); add(`כמה זה ${a} − ${b}?`, a - b, 1) }
    for (let i = 0; i < 4; i++) { const a = rnd(5, 18), b = rnd(1, 20 - a); add(`כמה זה ${a} + ${b}?`, a + b, 2) }
    for (let i = 0; i < 3; i++) { const n = rnd(1, 19); add(`איזה מספר בא אחרי ${n}?`, n + 1, 2) }
    for (let i = 0; i < 4; i++) { const a = rnd(3, 9), b = rnd(2, 9), c = rnd(1, 5); add(`כמה זה ${a} + ${b} + ${c}?`, a + b + c, 3) }
  } else if (grade === 2) {
    for (let i = 0; i < 4; i++) { const a = rnd(5, 18), b = rnd(1, 20 - a); add(`כמה זה ${a} + ${b}?`, a + b, 1) }
    for (let i = 0; i < 4; i++) { const a = rnd(20, 90), b = rnd(5, 99 - a); add(`כמה זה ${a} + ${b}?`, a + b, 2) }
    for (let i = 0; i < 3; i++) { const a = rnd(30, 99), b = rnd(5, a); add(`כמה זה ${a} − ${b}?`, a - b, 2) }
    for (let i = 0; i < 4; i++) { const t = pick([2, 5, 10]), b = rnd(2, 9); add(`כמה זה ${t} × ${b}?`, t * b, 3) }
    for (let i = 0; i < 2; i++) { const a = rnd(3, 9), s = rnd(10, 18); add(`${a} + ⬜ = ${s}. מהו המספר החסר?`, s - a, 3) }
  } else if (grade === 3) {
    for (let i = 0; i < 4; i++) { const a = rnd(2, 5), b = rnd(2, 9); add(`כמה זה ${a} × ${b}?`, a * b, 1) }
    for (let i = 0; i < 4; i++) { const a = rnd(2, 9), b = rnd(2, 9); add(`כמה זה ${a} × ${b}?`, a * b, 2) }
    for (let i = 0; i < 3; i++) { const b = rnd(2, 9), q = rnd(2, 9); add(`כמה זה ${b * q} ÷ ${b}?`, q, 2, `${b} × ${q} = ${b * q}`) }
    for (let i = 0; i < 3; i++) { const a = rnd(100, 800), b = rnd(50, 199); add(`כמה זה ${a} + ${b}?`, a + b, 3) }
    for (let i = 0; i < 2; i++) { const half = pick([2, 4, 10]) * 2; add(`כמה זה חצי מ-${half}?`, half / 2, 3) }
  } else if (grade === 4) {
    for (let i = 0; i < 3; i++) { const a = rnd(3, 9), b = rnd(3, 9); add(`כמה זה ${a} × ${b}?`, a * b, 1) }
    for (let i = 0; i < 4; i++) { const a = rnd(11, 30), b = rnd(3, 9); add(`כמה זה ${a} × ${b}?`, a * b, 2) }
    for (let i = 0; i < 3; i++) { const b = rnd(3, 9), q = rnd(3, 12); add(`כמה זה ${b * q} ÷ ${b}?`, q, 2) }
    for (let i = 0; i < 3; i++) { const w = rnd(3, 12), h = rnd(2, 9); add(`מהו שטח מלבן ברוחב ${w} ובגובה ${h}? (שטח = רוחב × גובה)`, w * h, 3, `${w} × ${h}`) }
    for (let i = 0; i < 2; i++) { const w = rnd(3, 12), h = rnd(2, 9); add(`מהו היקף מלבן ברוחב ${w} ובגובה ${h}? (היקף = 2×(רוחב+גובה))`, 2 * (w + h), 3) }
    // בעיות מילוליות (כיתה ד' — לפי תוכנית משרד החינוך)
    for (let i = 0; i < 2; i++) { const a = rnd(3, 12), b = rnd(4, 25); add(`בכל קופסה ${a} עפרונות. כמה עפרונות יש ב-${b} קופסאות?`, a * b, 2, `${a} × ${b}`) }
    for (let i = 0; i < 2; i++) { const g = rnd(3, 8), n = rnd(3, 9); const tot = g * n; add(`${tot} תלמידים התחלקו שווה בשווה ל-${g} קבוצות. כמה תלמידים בכל קבוצה?`, n, 2, `${tot} ÷ ${g}`) }
    for (let i = 0; i < 1; i++) { const p = pick([3, 4, 5, 6, 8]), n = rnd(3, 9); add(`מחברת עולה ${p} ₪. כמה יעלו ${n} מחברות?`, p * n, 2, `${p} × ${n}`) }
    for (let i = 0; i < 1; i++) { const money = pick([50, 100]), cost = rnd(12, 45); add(`לדנה ${money} ₪ והיא קנתה משחק ב-${cost} ₪. כמה עודף היא קיבלה?`, money - cost, 2, `${money} − ${cost}`) }
    for (let i = 0; i < 2; i++) { const a = rnd(15, 40), b = rnd(10, 30), g = pick([2, 5]); const tot = a + b; if (tot % g === 0) add(`בחנות ${a} תפוחים ו-${b} אגסים. ארזו את כל הפירות שווה ב-${g} ארגזים. כמה פירות בכל ארגז?`, tot / g, 3, `(${a}+${b}) ÷ ${g}`); else i-- }
    for (let i = 0; i < 1; i++) { const d = pick([100, 150, 200, 250]), n = rnd(3, 6); add(`אורך הקפה אחת של המסלול ${d} מטר. כמה מטר רץ דני ב-${n} הקפות?`, d * n, 3, `${d} × ${n}`) }
  } else if (grade === 5) {
    for (let i = 0; i < 3; i++) { const a = rnd(6, 12), b = rnd(4, 12); add(`כמה זה ${a} × ${b}?`, a * b, 1) }
    for (let i = 0; i < 3; i++) { const d = pick([2, 4, 5, 10]); const k = rnd(1, d - 1); add(`כמה זה ${k}/${d} + ${k}/${d}? (כתבו את המונה אם המכנה ${d})`, 2 * k, 2, `מחברים מונים: ${k}+${k}`) }
    for (let i = 0; i < 3; i++) { const p = pick([10, 25, 50]); const base = pick([20, 40, 80, 100, 200]); add(`כמה זה ${p}% מתוך ${base}?`, (base * p) / 100, 2) }
    for (let i = 0; i < 3; i++) { const a = rnd(2, 9) / 1, b = rnd(2, 9) / 1; add(`כמה זה ${a}.5 + ${b}.5? (כתבו את התוצאה השלמה)`, a + b + 1, 3, `${a}.5 + ${b}.5 = ${a + b + 1}`) }
    for (let i = 0; i < 3; i++) { const nums = [rnd(2, 10), rnd(2, 10), rnd(2, 10)]; const avg = (nums[0] + nums[1] + nums[2]) / 3; if (Number.isInteger(avg)) add(`מהו הממוצע של ${nums.join(', ')}?`, avg, 3, `סכום ÷ 3`); else i-- }
  } else { // grade 6
    for (let i = 0; i < 3; i++) { const p = pick([10, 20, 25, 50]); const base = pick([40, 60, 80, 120, 200, 300]); add(`כמה זה ${p}% מתוך ${base}?`, (base * p) / 100, 1) }
    for (let i = 0; i < 3; i++) { const p = pick([15, 30, 40, 75]); const base = pick([20, 40, 80, 100, 200]); add(`כמה זה ${p}% מתוך ${base}?`, (base * p) / 100, 2) }
    for (let i = 0; i < 3; i++) { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 6); add(`קופסה במידות ${a}×${b}×${c}. מהו הנפח? (נפח = אורך×רוחב×גובה)`, a * b * c, 2) }
    for (let i = 0; i < 3; i++) { const x = rnd(2, 15), b = rnd(1, 9); add(`פתרו: x + ${b} = ${x + b}. כמה x?`, x, 3) }
    for (let i = 0; i < 2; i++) { const x = rnd(2, 9), b = rnd(2, 6); add(`פתרו: ${b} × x = ${b * x}. כמה x?`, x, 3) }
  }
  return out
}

function mathMemoryPairs(grade: number): { a: string; b: string }[] {
  const pairs: { a: string; b: string }[] = []
  for (let i = 0; i < 6; i++) {
    if (grade <= 1) { const a = rnd(1, 9), b = rnd(1, 10 - a); pairs.push({ a: `${a}+${b}`, b: `${a + b}` }) }
    else if (grade === 2) { const t = pick([2, 5, 10]), b = rnd(2, 9); pairs.push({ a: `${t}×${b}`, b: `${t * b}` }) }
    else if (grade <= 4) { const a = rnd(2, 9), b = rnd(2, 9); pairs.push({ a: `${a}×${b}`, b: `${a * b}` }) }
    else { const p = pick([10, 25, 50]); const base = pick([20, 40, 80, 100]); pairs.push({ a: `${p}% מ-${base}`, b: `${(base * p) / 100}` }) }
  }
  return pairs
}

// ============================ אנגלית ============================
const VOCAB: Record<number, { en: string; he: string }[]> = {
  1: [{ en: 'cat', he: 'חתול' }, { en: 'dog', he: 'כלב' }, { en: 'sun', he: 'שמש' }, { en: 'red', he: 'אדום' }, { en: 'blue', he: 'כחול' }, { en: 'one', he: 'אחד' }, { en: 'two', he: 'שתיים' }, { en: 'ball', he: 'כדור' }],
  2: [{ en: 'apple', he: 'תפוח' }, { en: 'water', he: 'מים' }, { en: 'house', he: 'בית' }, { en: 'tree', he: 'עץ' }, { en: 'green', he: 'ירוק' }, { en: 'big', he: 'גדול' }, { en: 'small', he: 'קטן' }, { en: 'hand', he: 'יד' }],
  3: [{ en: 'school', he: 'בית ספר' }, { en: 'friend', he: 'חבר' }, { en: 'book', he: 'ספר' }, { en: 'happy', he: 'שמח' }, { en: 'family', he: 'משפחה' }, { en: 'food', he: 'אוכל' }, { en: 'day', he: 'יום' }, { en: 'night', he: 'לילה' }],
  4: [{ en: 'beautiful', he: 'יפה' }, { en: 'because', he: 'בגלל' }, { en: 'together', he: 'ביחד' }, { en: 'animal', he: 'חיה' }, { en: 'morning', he: 'בוקר' }, { en: 'teacher', he: 'מורה' }, { en: 'play', he: 'לשחק' }, { en: 'read', he: 'לקרוא' }],
  5: [{ en: 'important', he: 'חשוב' }, { en: 'different', he: 'שונה' }, { en: 'weather', he: 'מזג אוויר' }, { en: 'country', he: 'מדינה' }, { en: 'language', he: 'שפה' }, { en: 'travel', he: 'לטייל' }, { en: 'remember', he: 'לזכור' }, { en: 'usually', he: 'בדרך כלל' }],
  6: [{ en: 'environment', he: 'סביבה' }, { en: 'experience', he: 'ניסיון' }, { en: 'knowledge', he: 'ידע' }, { en: 'opinion', he: 'דעה' }, { en: 'decide', he: 'להחליט' }, { en: 'describe', he: 'לתאר' }, { en: 'although', he: 'למרות' }, { en: 'available', he: 'זמין' }],
}
function englishQuestions(grade: number): Q[] {
  const words = VOCAB[grade] ?? VOCAB[3]
  const allHe = Object.values(VOCAB).flat().map((w) => w.he)
  return words.map((w, i) => {
    const distractors = shuffle(allHe.filter((h) => h !== w.he)).slice(0, 3)
    const { options, answer } = textMc(w.he, distractors)
    return { prompt: `What does "${w.en}" mean?`, options, answer, explanation: `${w.en} = ${w.he}`, difficulty: (i < 3 ? 1 : i < 6 ? 2 : 3) as Diff }
  })
}

// ============================ עברית ============================
const HEBREW: Record<number, Q[]> = {
  1: [
    { prompt: 'מה ההפך מ"גדול"?', ...textMc('קטן', ['ארוך', 'כבד', 'רחב']), difficulty: 1 },
    { prompt: 'מה ההפך מ"יום"?', ...textMc('לילה', ['בוקר', 'ערב', 'שעה']), difficulty: 1 },
    { prompt: 'מה ההפך מ"חם"?', ...textMc('קר', ['רטוב', 'יבש', 'חמים']), difficulty: 1 },
    { prompt: 'איזו מילה היא רבים של "כלב"?', ...textMc('כלבים', ['כלבה', 'כלבלב', 'כלב']), difficulty: 2 },
    { prompt: 'באיזו אות מתחילה המילה "שמש"?', ...textMc('ש', ['ס', 'ת', 'מ']), difficulty: 2 },
    { prompt: 'מה ההפך מ"פתוח"?', ...textMc('סגור', ['רחב', 'ריק', 'מלא']), difficulty: 3 },
  ],
  2: [
    { prompt: 'מה ההפך מ"מהיר"?', ...textMc('איטי', ['חזק', 'גבוה', 'רחוק']), difficulty: 1 },
    { prompt: 'מה ההפך מ"שמח"?', ...textMc('עצוב', ['כועס', 'עייף', 'רעב']), difficulty: 1 },
    { prompt: 'מהי מילה נרדפת ל"יפה"?', ...textMc('נחמד', ['גדול', 'מהיר', 'קר']), difficulty: 2 },
    { prompt: 'מהו הרבים של "ילד"?', ...textMc('ילדים', ['ילדה', 'ילדון', 'ילדות']), difficulty: 2 },
    { prompt: 'איזו מילה היא נקבה?', ...textMc('מורָה', ['מורֶה', 'תלמיד', 'ילד']), difficulty: 3 },
    { prompt: 'מה ההפך מ"עולה"?', ...textMc('יורד', ['רץ', 'עומד', 'נופל']), difficulty: 3 },
  ],
  3: [
    { prompt: 'מהי מילה נרדפת ל"שמח"?', ...textMc('מאושר', ['עצוב', 'כועס', 'עייף']), difficulty: 1 },
    { prompt: 'מה ההפך מ"חכם"?', ...textMc('טיפש', ['חרוץ', 'נחמד', 'גבוה']), difficulty: 1 },
    { prompt: 'מהי מילה נרדפת ל"רץ"?', ...textMc('דוהר', ['הולך', 'יושב', 'עומד']), difficulty: 2 },
    { prompt: 'מהו הרבים של "עיר"?', ...textMc('ערים', ['עירים', 'עיירה', 'עירות']), difficulty: 2 },
    { prompt: 'איזו מילה מתאימה: "הילד ___ אל בית הספר".', ...textMc('הלך', ['הלכה', 'הלכו', 'ילך']), difficulty: 3 },
    { prompt: 'מהו השורש של המילה "מִשְׂחָק"?', ...textMc('ש.ח.ק', ['מ.ש.ח', 'ח.ק.ק', 'ש.ק.ק']), difficulty: 3 },
  ],
  4: [
    { prompt: 'מהי מילה נרדפת ל"גדול"?', ...textMc('ענק', ['קטן', 'קצר', 'דק']), difficulty: 1 },
    { prompt: 'מה ההפך מ"מלא"?', ...textMc('ריק', ['כבד', 'רחב', 'חדש']), difficulty: 1 },
    { prompt: 'מהי מילה נרדפת ל"בית"?', ...textMc('מעון', ['רחוב', 'חדר', 'גן']), difficulty: 2 },
    { prompt: 'איזו מילה היא יחיד של "ספרים"?', ...textMc('ספר', ['ספרייה', 'סופר', 'ספרון']), difficulty: 2 },
    { prompt: 'מהו השורש של "כְּתִיבָה"?', ...textMc('כ.ת.ב', ['כ.ב.ת', 'ת.כ.ב', 'כ.ת.ת']), difficulty: 3 },
    { prompt: 'איזה משפט כתוב נכון?', ...textMc('אני אוהב לקרוא ספרים', ['אני אוהב לקרוא ספר ים', 'אני אהוב לקרוא ספרים', 'אני אוהב לכתוב ספרים אוכל']), difficulty: 3 },
  ],
  5: [
    { prompt: 'מהי מילה נרדפת ל"חשוב"?', ...textMc('משמעותי', ['קטן', 'מהיר', 'רחוק']), difficulty: 1 },
    { prompt: 'מה ההפך מ"אמיתי"?', ...textMc('מזויף', ['חדש', 'יקר', 'גדול']), difficulty: 1 },
    { prompt: 'מהי משמעות הביטוי "טמן ראשו בחול"?', ...textMc('התעלם מבעיה', ['עבד קשה', 'נח בחוף', 'בנה ארמון']), difficulty: 2 },
    { prompt: 'מהו השורש של "הִתְלַבְּשׁוּת"?', ...textMc('ל.ב.ש', ['ה.ל.ב', 'ת.ל.ב', 'ל.ש.ב']), difficulty: 2 },
    { prompt: 'איזו מילה היא שם תואר?', ...textMc('יפֶה', ['רץ', 'שולחן', 'כתב']), difficulty: 3 },
    { prompt: 'מהי מילה נרדפת ל"התחיל"?', ...textMc('פתח', ['סיים', 'עצר', 'חזר']), difficulty: 3 },
  ],
  6: [
    { prompt: 'מהי מילה נרדפת ל"מהיר"?', ...textMc('זריז', ['איטי', 'כבד', 'רחב']), difficulty: 1 },
    { prompt: 'מה ההפך מ"רחב"?', ...textMc('צר', ['ארוך', 'גבוה', 'כבד']), difficulty: 1 },
    { prompt: 'מהי משמעות הביטוי "יצא מגדרו"?', ...textMc('התרגש מאוד', ['יצא מהבית', 'בנה גדר', 'הסתגר']), difficulty: 2 },
    { prompt: 'איזו מילה היא פועל?', ...textMc('הלך', ['שולחן', 'יפה', 'מהר']), difficulty: 2 },
    { prompt: 'מהו השורש של "מַחְשֵׁב"?', ...textMc('ח.ש.ב', ['מ.ח.ש', 'ש.ב.ב', 'ח.ב.ש']), difficulty: 3 },
    { prompt: 'מהי מילה נרדפת ל"לפתע"?', ...textMc('פתאום', ['לאט', 'תמיד', 'אולי']), difficulty: 3 },
  ],
}

// ============================ מדע ============================
const SCIENCE: Record<number, Q[]> = {
  1: [
    { prompt: 'כמה חושים יש לאדם?', ...textMc('חמישה', ['שלושה', 'שבעה', 'עשרה']), difficulty: 1 },
    { prompt: 'מה צריך צמח כדי לגדול?', ...textMc('מים ושמש', ['שוקולד', 'חושך', 'קרח']), difficulty: 1 },
    { prompt: 'איזה מהבאים הוא חיה?', ...textMc('פרה', ['שולחן', 'אבן', 'כיסא']), difficulty: 1 },
    { prompt: 'באיזה איבר אנחנו מריחים?', ...textMc('האף', ['האוזן', 'היד', 'הברך']), difficulty: 2 },
    { prompt: 'מה קורה למים כשמקררים אותם מאוד?', ...textMc('הופכים לקרח', ['נעלמים', 'הופכים לאש', 'מתחממים']), difficulty: 2 },
    { prompt: 'מתי רואים את הכוכבים?', ...textMc('בלילה', ['בצהריים', 'בבוקר', 'אף פעם']), difficulty: 3 },
  ],
  2: [
    { prompt: 'איזה איבר שואב את הדם בגוף?', ...textMc('הלב', ['הקיבה', 'הריאות', 'הכבד']), difficulty: 1 },
    { prompt: 'מה נושמים בני אדם?', ...textMc('חמצן', ['פחמן דו-חמצני', 'מים', 'אבק']), difficulty: 1 },
    { prompt: 'איזו עונה היא הקרה ביותר?', ...textMc('חורף', ['קיץ', 'אביב', 'סתיו']), difficulty: 2 },
    { prompt: 'מאיפה מקבל הצמח אנרגיה?', ...textMc('מהשמש', ['מהירח', 'מהאדמה בלבד', 'מהרוח']), difficulty: 2 },
    { prompt: 'איזה מהבאים הוא יונק?', ...textMc('כלב', ['נחש', 'דג', 'צפרדע']), difficulty: 3 },
    { prompt: 'כמה רגליים יש לחרק?', ...textMc('שש', ['ארבע', 'שמונה', 'עשר']), difficulty: 3 },
  ],
  3: [
    { prompt: 'באילו שלושה מצבי צבירה נמצאים החומרים?', ...textMc('מוצק, נוזל, גז', ['קר, חם, פושר', 'קשה, רך, נוזל', 'מים, אש, אוויר']), difficulty: 1 },
    { prompt: 'איזה כוכב לכת אנחנו חיים עליו?', ...textMc('כדור הארץ', ['מאדים', 'נוגה', 'צדק']), difficulty: 1 },
    { prompt: 'איזה איבר מעכל את האוכל?', ...textMc('הקיבה', ['הלב', 'המוח', 'הריאות']), difficulty: 2 },
    { prompt: 'מה גורם ליום וללילה?', ...textMc('סיבוב כדור הארץ', ['הירח מסתתר', 'השמש כבה', 'העננים']), difficulty: 2 },
    { prompt: 'איזה מצב צבירה הוא של קיטור?', ...textMc('גז', ['מוצק', 'נוזל', 'אף אחד']), difficulty: 3 },
    { prompt: 'מה הופך קרח למים?', ...textMc('חימום', ['קירור', 'חושך', 'מלח']), difficulty: 3 },
  ],
  4: [
    { prompt: 'כמה כוכבי לכת יש במערכת השמש?', ...textMc('שמונה', ['שבעה', 'תשעה', 'עשרה']), difficulty: 1 },
    { prompt: 'איזה איבר שולט בגוף ומעבד מחשבות?', ...textMc('המוח', ['הלב', 'הקיבה', 'הכליה']), difficulty: 1 },
    { prompt: 'מהו הכוח שמושך אותנו אל הקרקע?', ...textMc('כוח הכבידה', ['כוח חשמלי', 'כוח שריר', 'לחץ אוויר']), difficulty: 2 },
    { prompt: 'איזה גז הצמחים פולטים ואנחנו נושמים?', ...textMc('חמצן', ['פחמן דו-חמצני', 'הליום', 'מימן']), difficulty: 2 },
    { prompt: 'מהו מסלע הקשיח שעוטף את כדור הארץ?', ...textMc('הקרום', ['הגלעין', 'המעטפת', 'האטמוספרה']), difficulty: 3 },
    { prompt: 'איזה איבר מסנן את הדם בגוף?', ...textMc('הכליה', ['הלב', 'הריאה', 'הקיבה']), difficulty: 3 },
  ],
  5: [
    { prompt: 'איזה איבר אחראי על הנשימה?', ...textMc('הריאות', ['הלב', 'הקיבה', 'הכבד']), difficulty: 1 },
    { prompt: 'מהו מקור האנרגיה העיקרי של כדור הארץ?', ...textMc('השמש', ['הירח', 'הרוח', 'הים']), difficulty: 1 },
    { prompt: 'מה זורם במעגל חשמלי סגור?', ...textMc('זרם חשמלי', ['מים', 'אוויר', 'אור בלבד']), difficulty: 2 },
    { prompt: 'איזו מערכת בגוף מובילה חמצן לתאים?', ...textMc('מערכת הדם', ['מערכת העיכול', 'מערכת השלד', 'מערכת העצבים']), difficulty: 2 },
    { prompt: 'מהו תהליך ייצור המזון בצמח באמצעות אור?', ...textMc('פוטוסינתזה', ['נשימה', 'אידוי', 'התעבות']), difficulty: 3 },
    { prompt: 'איזה חומר מוליך חשמל היטב?', ...textMc('מתכת', ['פלסטיק', 'עץ', 'גומי']), difficulty: 3 },
  ],
  6: [
    { prompt: 'מהי היחידה הבסיסית של כל היצורים החיים?', ...textMc('התא', ['האטום', 'האיבר', 'הרקמה']), difficulty: 1 },
    { prompt: 'איזו מערכת תומכת בגוף ומגינה על האיברים?', ...textMc('מערכת השלד', ['מערכת הדם', 'מערכת העיכול', 'מערכת הנשימה']), difficulty: 1 },
    { prompt: 'מהו שם הכוכב שבמרכז מערכת השמש?', ...textMc('השמש', ['הירח', 'כדור הארץ', 'מאדים']), difficulty: 2 },
    { prompt: 'מה קורה לחומר במעבר ממוצק לנוזל?', ...textMc('המסה', ['רתיחה', 'התעבות', 'קיפאון']), difficulty: 2 },
    { prompt: 'איזה כוח גורם למגנט למשוך ברזל?', ...textMc('כוח מגנטי', ['כוח הכבידה', 'כוח השריר', 'לחץ']), difficulty: 3 },
    { prompt: 'מהו תפקיד שרשרת המזון באקולוגיה?', ...textMc('מעבר אנרגיה בין יצורים', ['חימום כדור הארץ', 'ייצור גשם', 'סיבוב כדור הארץ']), difficulty: 3 },
  ],
}

// ============================ בנייה ============================
interface SubjectSeed {
  id: string; slug: string; nameHe: string; nameEn: string; icon: string; color: string; order: number
  qgen: (grade: number) => Q[]
}
const SUBJECTS: SubjectSeed[] = [
  { id: 'math', slug: 'math', nameHe: 'חשבון', nameEn: 'Math', icon: 'Calculator', color: '#7C3AED', order: 1, qgen: mathQuestions },
  { id: 'english', slug: 'english', nameHe: 'אנגלית', nameEn: 'English', icon: 'Languages', color: '#06B6D4', order: 2, qgen: englishQuestions },
  { id: 'hebrew', slug: 'hebrew', nameHe: 'עברית', nameEn: 'Hebrew', icon: 'BookA', color: '#EC4899', order: 3, qgen: (g) => HEBREW[g] ?? [] },
  { id: 'science', slug: 'science', nameHe: 'מדע', nameEn: 'Science', icon: 'FlaskConical', color: '#22C55E', order: 4, qgen: (g) => SCIENCE[g] ?? [] },
]

export function buildSeedDocs(): SeedDoc[] {
  const docs: SeedDoc[] = []

  for (const s of SUBJECTS) {
    docs.push({
      collection: 'subjects', id: s.id,
      data: { slug: s.slug, level: 'elementary', nameHe: s.nameHe, nameEn: s.nameEn, icon: s.icon, color: s.color, gradeFrom: 1, gradeTo: 6, order: s.order },
    })

    for (let grade = 1; grade <= 6; grade++) {
      const qs = s.qgen(grade)
      qs.forEach((q, i) => {
        docs.push({
          collection: 'questions', id: `${s.id}-g${grade}-q${i}`,
          data: {
            subjectId: s.id, level: 'elementary', grade, lang: s.id === 'english' ? 'en' : 'he', type: 'mc',
            prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation ?? '', difficulty: q.difficulty,
          },
        })
      })

      // חידון (משתמש במאגר השאלות אוטומטית)
      if (qs.length > 0) {
        docs.push({ collection: 'games', id: `${s.id}-g${grade}-quiz`, data: { subjectId: s.id, type: 'quiz', level: 'elementary', grade, titleHe: 'חידון', titleEn: 'Quiz', config: {} } })
      }

      // משחקים ייעודיים לפי מקצוע
      if (s.id === 'math') {
        docs.push({ collection: 'games', id: `math-g${grade}-memory`, data: { subjectId: 'math', type: 'memory', level: 'elementary', grade, titleHe: 'זיכרון תרגילים', titleEn: 'Math Memory', config: { pairs: mathMemoryPairs(grade) } } })
      }
      if (s.id === 'english') {
        const vocab = VOCAB[grade] ?? VOCAB[3]
        docs.push({ collection: 'games', id: `english-g${grade}-flashcards`, data: { subjectId: 'english', type: 'flashcards', level: 'elementary', grade, titleHe: 'כרטיסיות מילים', titleEn: 'Word Flashcards', config: { cards: vocab.map((w) => ({ front: w.en, back: w.he })) } } })
        docs.push({ collection: 'games', id: `english-g${grade}-memory`, data: { subjectId: 'english', type: 'memory', level: 'elementary', grade, titleHe: 'זיכרון מילים', titleEn: 'Word Memory', config: { pairs: vocab.map((w) => ({ a: w.en, b: w.he })) } } })
      }
      // עברית כיתה א' — משחקי לימוד קריאה עם ניקוד (מילים + תמונות)
      if (s.id === 'hebrew' && grade === 1) {
        docs.push({ collection: 'games', id: 'hebrew-g1-read-pic2word', data: { subjectId: 'hebrew', type: 'reading', level: 'elementary', grade, titleHe: 'תמונה ← מילה', titleEn: 'Picture to Word', config: { mode: 'pic2word', categories: READING_CATEGORIES } } })
        docs.push({ collection: 'games', id: 'hebrew-g1-read-word2pic', data: { subjectId: 'hebrew', type: 'reading', level: 'elementary', grade, titleHe: 'מילה ← תמונה', titleEn: 'Word to Picture', config: { mode: 'word2pic', categories: READING_CATEGORIES } } })
        docs.push({ collection: 'games', id: 'hebrew-g1-read-memory', data: { subjectId: 'hebrew', type: 'reading', level: 'elementary', grade, titleHe: 'זיכרון מילים ותמונות', titleEn: 'Word-Picture Memory', config: { mode: 'memory', categories: READING_CATEGORIES } } })
        docs.push({ collection: 'games', id: 'hebrew-g1-read-firstletter', data: { subjectId: 'hebrew', type: 'reading', level: 'elementary', grade, titleHe: 'מאיזו אות מתחילה?', titleEn: 'First Letter', config: { mode: 'firstletter', categories: READING_CATEGORIES } } })
      }

      // דף עזר קצר
      const tips: Record<string, string> = {
        math: 'טיפים: קראו את התרגיל לאט, פרקו מספרים גדולים לקטנים, ובדקו את התשובה בסוף. תרגול קצר כל יום עוזר הכי הרבה! 💪',
        english: 'דרכים לזכור מילים: שחקו בכרטיסיות ובזיכרון, אמרו את המילה בקול, וחפשו אותה בשיר או סרטון. ✨',
        hebrew: 'בעברית כדאי לשים לב לשורש המילה, להפכים ולמילים נרדפות. קריאת ספרים מרחיבה את אוצר המילים! 📚',
        science: 'במדע שואלים שאלות על העולם: למה, איך, ומה קורה אם? נסו לצפות, לשער ולבדוק. 🔬',
      }
      docs.push({
        collection: 'materials', id: `${s.id}-g${grade}-help`,
        data: { subjectId: s.id, level: 'elementary', grade, lang: 'he', order: 1, title: `${s.nameHe} — כיתה ${['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו'][grade]}`, bodyMarkdown: tips[s.id] ?? '' },
      })
    }
  }

  return docs
}
