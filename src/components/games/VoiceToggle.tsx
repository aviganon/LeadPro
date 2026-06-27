'use client'

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { voiceEnabled, setVoiceEnabled, praiseAloud } from '@/lib/speech'

/** כפתור הפעלה/השתקה של קול המחמאות. נשמר בדפדפן. */
export function VoiceToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(true)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- קריאת ההעדפה לאחר hydration
  useEffect(() => { setOn(voiceEnabled()) }, [])

  const toggle = () => {
    const v = !on
    setOn(v)
    setVoiceEnabled(v)
    if (v) praiseAloud() // משמיע דוגמה כשמדליקים
  }

  return (
    <button
      onClick={toggle}
      title={on ? 'השתקת קול' : 'הפעלת קול מחמאות'}
      aria-label={on ? 'השתקת קול' : 'הפעלת קול מחמאות'}
      className={`p-2 rounded-2xl border transition-colors ${on ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border'} ${className ?? ''}`}
    >
      {on ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  )
}
