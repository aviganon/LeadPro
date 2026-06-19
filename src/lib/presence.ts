import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { getDeviceId } from './device'

/** שולח "פעימת לב" לשרת — מסמן שהמשתמש מחובר עכשיו. */
export async function sendHeartbeat(name: string | null, page: string): Promise<void> {
  try {
    await fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({ deviceId: getDeviceId(), name, page }),
    })
  } catch { /* ignore */ }
}

export interface PresenceRow {
  id: string
  name: string | null
  verified: boolean
  page: string
  lastSeenMs: number
}

/** מאזין בזמן אמת לכל רשומות הנוכחות (קריאה לאדמין בלבד). */
export function subscriberPresence(cb: (rows: PresenceRow[]) => void): () => void {
  return onSnapshot(collection(db, 'presence'), (snap) => {
    cb(snap.docs.map((d) => {
      const x = d.data() as { name?: string; verified?: boolean; page?: string; lastSeen?: { toMillis?: () => number } }
      return {
        id: d.id,
        name: x.name ?? null,
        verified: !!x.verified,
        page: x.page ?? '',
        lastSeenMs: x.lastSeen?.toMillis ? x.lastSeen.toMillis() : 0,
      }
    }))
  }, () => { /* ignore listener errors */ })
}

export const ONLINE_WINDOW_MS = 90_000
