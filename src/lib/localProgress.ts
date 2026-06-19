// מעקב התקדמות/מוכנות מקומי (בדפדפן) — עובד גם בלי הרשמה.
const KEY = 'apex_progress'

export interface SubjectProgress {
  answered: number   // סך השאלות שנענו
  correct: number    // סך התשובות הנכונות
  attempts: number   // מספר סבבים שהושלמו
  best: number       // הניקוד הגבוה ביותר
}

const EMPTY: SubjectProgress = { answered: 0, correct: 0, attempts: 0, best: 0 }

type Store = Record<string, SubjectProgress>

function read(): Store {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}
function write(s: Store) {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

export function getSubjectProgress(subjectId: string): SubjectProgress {
  return read()[subjectId] ?? EMPTY
}

export function addQuizResult(subjectId: string, correct: number, total: number, score: number) {
  const s = read()
  const p = s[subjectId] ?? { ...EMPTY }
  s[subjectId] = {
    answered: p.answered + total,
    correct: p.correct + correct,
    attempts: p.attempts + 1,
    best: Math.max(p.best, score),
  }
  write(s)
}

/** מוכנות = אחוז הדיוק הכולל (תשובות נכונות מתוך כל מה שנענה). */
export function readinessPct(p: SubjectProgress): number {
  if (p.answered === 0) return 0
  return Math.round((p.correct / p.answered) * 100)
}
