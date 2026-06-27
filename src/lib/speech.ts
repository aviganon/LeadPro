// קול מחמיא למשחקים (Web Speech API). נכשל בשקט בדפדפנים ללא תמיכה.
// נשמע רק לאחר אינטראקציה (לחיצה על תשובה), כך שאין בעיית autoplay.

const PRAISE = ['כל הכבוד!', 'מצוין!', 'יופי!', 'אלוף!', 'מדהים!', 'נכון מאוד!', 'איזה יופי!', 'ענק!', 'כל הכבוד לך!', 'מעולה!']
const CHEER = ['כל הכבוד! סיימת יפה מאוד!', 'מדהים! עבודה מצוינת!', 'איזה אלוף! כל הכבוד!', 'וואו, עבודה נהדרת!', 'יופי גדול! המשך כך!']

const KEY = 'apex_voice'

/** האם הקול מופעל (ברירת מחדל: כן). */
export function voiceEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try { return window.localStorage.getItem(KEY) !== '0' } catch { return true }
}

export function setVoiceEnabled(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? '1' : '0')
    if (!on) window.speechSynthesis?.cancel()
  } catch { /* ignore */ }
}

/** הקראת טקסט בעברית. */
export function speakHe(text: string, opts?: { rate?: number; pitch?: number }) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(text.normalize('NFC'))
    u.lang = 'he-IL'
    u.rate = opts?.rate ?? 1
    u.pitch = opts?.pitch ?? 1.15
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* ignore */ }
}

function pick(a: string[]): string { return a[Math.floor(Math.random() * a.length)] }

/** מחמאה קצרה אקראית — לתשובה נכונה. */
export function praiseAloud() { if (voiceEnabled()) speakHe(pick(PRAISE)) }

/** עידוד ארוך יותר — לסיום משחק. */
export function cheerAloud() { if (voiceEnabled()) speakHe(pick(CHEER)) }
