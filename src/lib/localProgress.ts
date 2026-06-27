// מעקב התקדמות/מוכנות מקומי (בדפדפן) — עובד גם בלי הרשמה.
const KEY = 'apex_progress'

export interface SubjectProgress {
  answered: number   // סך השאלות שנענו (תרגול)
  correct: number    // סך התשובות הנכונות (תרגול)
  attempts: number   // מספר סבבי תרגול שהושלמו
  best: number       // הניקוד הגבוה ביותר בתרגול
  bestExam: number   // הציון הגבוה ביותר במבחן (0–100)
  examsTaken: number // מספר מבחנים שהושלמו
}

const EMPTY: SubjectProgress = { answered: 0, correct: 0, attempts: 0, best: 0, bestExam: 0, examsTaken: 0 }

type Store = Record<string, Partial<SubjectProgress>>

function read(): Store {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}
function write(s: Store) {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

/** ממזג עם ברירות המחדל כך שרשומות ישנות (לפני שדות המבחן) לא ישברו. */
function normalize(p?: Partial<SubjectProgress>): SubjectProgress {
  return { ...EMPTY, ...(p ?? {}) }
}

export function getSubjectProgress(subjectId: string): SubjectProgress {
  return normalize(read()[subjectId])
}

export function addQuizResult(subjectId: string, correct: number, total: number, score: number) {
  const s = read()
  const p = normalize(s[subjectId])
  s[subjectId] = {
    ...p,
    answered: p.answered + total,
    correct: p.correct + correct,
    attempts: p.attempts + 1,
    best: Math.max(p.best, score),
  }
  write(s)
}

/** רישום תוצאת מבחן — grade באחוזים (0–100). שומר את הגבוה ביותר. */
export function addExamResult(subjectId: string, grade: number) {
  const s = read()
  const p = normalize(s[subjectId])
  s[subjectId] = {
    ...p,
    bestExam: Math.max(p.bestExam, Math.round(grade)),
    examsTaken: p.examsTaken + 1,
  }
  write(s)
}

/**
 * מוכנות למבחן:
 * • אם נעשה לפחות מבחן אחד — הציון הטוב ביותר במבחן (מדד אמיתי).
 * • אחרת — אחוז הדיוק בתרגול (אינדיקציה רכה עד שניגשים למבחן).
 */
export function readinessPct(p: SubjectProgress): number {
  if (p.examsTaken > 0) return p.bestExam
  if (p.answered === 0) return 0
  return Math.round((p.correct / p.answered) * 100)
}

/** האם המוכנות מבוססת על מבחן אמיתי (ולא רק תרגול). */
export function readinessFromExam(p: SubjectProgress): boolean {
  return p.examsTaken > 0
}

// ===== ארנק כוכבים מצטבר — נצבר על פני כל המשחקים והסבבים (לא מתאפס) =====
const STARS_KEY = 'apex_stars'
const GAMES_KEY = 'apex_games_done'

export function getStars(): number {
  if (typeof window === 'undefined') return 0
  try { return Number(window.localStorage.getItem(STARS_KEY)) || 0 } catch { return 0 }
}
export function getGamesDone(): number {
  if (typeof window === 'undefined') return 0
  try { return Number(window.localStorage.getItem(GAMES_KEY)) || 0 } catch { return 0 }
}
/** מוסיף נקודות לארנק הכוכבים המצטבר ומחזיר את הסך החדש. נקרא בסיום כל משחק. */
export function addStars(n: number): number {
  if (typeof window === 'undefined') return 0
  const total = getStars() + Math.max(0, Math.round(n))
  try {
    window.localStorage.setItem(STARS_KEY, String(total))
    window.localStorage.setItem(GAMES_KEY, String(getGamesDone() + 1))
  } catch { /* ignore */ }
  return total
}

/** סיכום גלובלי על פני כל המקצועות — לתצוגה במסך הבית. */
export function getGlobalStats(): { points: number; answered: number; subjects: number } {
  const s = read()
  const vals = Object.values(s).map(normalize)
  return {
    points: vals.reduce((a, p) => a + p.best, 0),
    answered: vals.reduce((a, p) => a + p.answered, 0),
    subjects: vals.filter((p) => p.answered > 0 || p.examsTaken > 0).length,
  }
}
