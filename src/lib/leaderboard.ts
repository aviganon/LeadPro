import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase'
import { getDeviceId } from './device'
import type { LeaderboardEntry } from '@/types'

const LEADERBOARD = 'leaderboard'

/** מזהה טבלה לפי מקצוע וכיתה/שנה — כל קורס/מקצוע מקבל טבלה משלו */
export function scopeFor(subjectId: string, grade: number): string {
  return `${subjectId}:${grade}`
}

/** טבלת מנצחים למצב מבחן — ציוני מבחן בלבד (0–100). נפרדת מטבלת התרגול. */
export function examScopeFor(subjectId: string, grade: number): string {
  return `${subjectId}:${grade}:exam`
}

/** קריאת טופ הניקוד לטבלה (מיון בצד הלקוח — בלי אינדקס מורכב) */
export async function getLeaderboard(scope: string, top = 20): Promise<LeaderboardEntry[]> {
  const snap = await getDocs(query(collection(db, LEADERBOARD), where('scope', '==', scope)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as LeaderboardEntry))
    .sort((a, b) => b.score - a.score)
    .slice(0, top)
}

/** שליחת ניקוד (שומר את הגבוה ביותר). עובד בלי הרשמה — לפי מזהה מכשיר. */
export async function submitScore(scope: string, name: string, score: number): Promise<{ ok: boolean; best?: number; error?: string }> {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ scope, name, score, deviceId: getDeviceId() }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: d.error ?? 'שגיאה' }
    return { ok: true, best: d.best }
  } catch {
    return { ok: false, error: 'שגיאת רשת' }
  }
}
