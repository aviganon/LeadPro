'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { sendHeartbeat } from '@/lib/presence'

const HEARTBEAT_MS = 30_000

/** שולח פעימת לב כל 30 שניות בזמן שהדף פעיל — מזין את "מחוברים עכשיו" בניהול. */
export function PresenceTracker() {
  const { user } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    const beat = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void sendHeartbeat(user?.name ?? null, pathname || '/')
      }
    }
    beat()
    const id = window.setInterval(beat, HEARTBEAT_MS)
    const onVis = () => { if (document.visibilityState === 'visible') beat() }
    document.addEventListener('visibilitychange', onVis)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [user, pathname])

  return null
}
