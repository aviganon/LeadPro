'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getStars, setStars } from '@/lib/localProgress'
import { incrementUserStars } from '@/lib/db'

/**
 * מסנכרן את ארנק הכוכבים בין המכשיר לחשבון בכניסה למערכת:
 * - אם במכשיר יש יותר (כוכבים שנצברו לפני התחברות) — דוחף את ההפרש לחשבון.
 * - אם בחשבון יש יותר (נצברו במכשיר אחר) — מושך את הסך למכשיר.
 * רץ פעם אחת לכל משתמש.
 */
export function StarsSync() {
  const { user } = useAuth()
  const syncedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!user || syncedFor.current === user.id) return
    syncedFor.current = user.id
    const local = getStars()
    const server = user.stars ?? 0
    if (local > server) {
      void incrementUserStars(user.id, local - server, 0).catch(() => { /* offline */ })
    } else if (server > local) {
      setStars(server)
    }
  }, [user])

  return null
}
