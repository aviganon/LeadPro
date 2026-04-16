'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { syncSessionCookies } from '@/lib/sessionCookieClient'

// Keeps __session / __role cookies aligned with Firebase Auth.
// Middleware uses __session for route protection.

export function SessionSync() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      void syncSessionCookies()
    })
    return unsub
  }, [])

  return null
}
