'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUser } from '@/lib/db'

// This component runs on every page load and keeps the __session and __role
// cookies in sync with Firebase Auth state.
// Middleware reads these cookies to protect routes server-side.

export function SessionSync() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        const token = await fbUser.getIdToken()
        // Set session cookie (expires with browser session)
        document.cookie = `__session=${token}; path=/; SameSite=Lax`

        // Set role cookie for admin route protection
        const user = await getUser(fbUser.uid)
        if (user) {
          document.cookie = `__role=${user.role}; path=/; SameSite=Lax`
        }
      } else {
        // Clear cookies on sign-out
        document.cookie = '__session=; path=/; max-age=0'
        document.cookie = '__role=; path=/; max-age=0'
      }
    })
    return unsub
  }, [])

  return null
}
