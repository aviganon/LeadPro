'use client'

import { auth } from '@/lib/firebase'

/**
 * Writes __session / __role cookies via the server so they are committed
 * before navigation (avoids first-login redirect loop with client-side router).
 */
export async function syncSessionCookies(): Promise<void> {
  const fbUser = auth.currentUser
  if (!fbUser) {
    await fetch('/api/auth/session', { method: 'DELETE' })
    return
  }

  const token = await fbUser.getIdToken()
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) {
    throw new Error('Failed to sync session cookies')
  }
}
