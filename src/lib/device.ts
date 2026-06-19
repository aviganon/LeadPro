// מזהה מכשיר אנונימי ויציב (נשמר בדפדפן) — מאפשר שמירת/שיפור ניקוד וטבלת מנצחים בלי הרשמה.
const KEY = 'apex_device_id'

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = window.localStorage.getItem(KEY)
    if (!id) {
      id = (crypto.randomUUID?.() ?? `d-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      window.localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return 'anon'
  }
}

const NAME_KEY = 'apex_player_name'
export function getSavedName(): string {
  if (typeof window === 'undefined') return ''
  try { return window.localStorage.getItem(NAME_KEY) ?? '' } catch { return '' }
}
export function saveName(name: string) {
  try { window.localStorage.setItem(NAME_KEY, name) } catch { /* ignore */ }
}
