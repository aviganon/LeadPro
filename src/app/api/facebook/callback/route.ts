import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getFacebookUserInfo,
  getUserGroups,
} from '@/lib/facebook'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'
import { encryptToken } from '@/lib/crypto'
import { decodeSessionCookieToken } from '@/lib/sessionCookieCodec'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/dashboard?fb_error=denied', req.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?fb_error=missing', req.url))
  }

  const sessionCookie = decodeSessionCookieToken(req.cookies.get('__session')?.value)
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard?fb_error=no_session', req.url))
  }

  let uid: string
  try {
    const decoded = await getAdminAuth().verifyIdToken(sessionCookie)
    uid = decoded.uid
  } catch {
    return NextResponse.redirect(new URL('/dashboard?fb_error=invalid_session', req.url))
  }

  if (state !== uid) {
    return NextResponse.redirect(new URL('/dashboard?fb_error=state_mismatch', req.url))
  }

  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/facebook/callback`

    const { accessToken: shortToken } = await exchangeCodeForToken(code, redirectUri)
    const { accessToken: longToken, expiresIn } = await getLongLivedToken(shortToken)
    const fbUser = await getFacebookUserInfo(longToken)
    const fbGroups = await getUserGroups(longToken)

    const tokenExpiry = new Date(Date.now() + expiresIn * 1000)
    const encrypted = await encryptToken(longToken)

    const db = getAdminFirestore()
    await db.collection('fb_tokens').doc(state).set({
      userId: state,
      fbUserId: fbUser.id,
      accessToken: encrypted,
      tokenEncrypted: true,
      tokenExpiry,
      scopes: ['public_profile', 'email'],
      createdAt: FieldValue.serverTimestamp(),
    })

    const groups = fbGroups.map(g => ({
      id: g.id,
      name: g.name,
      memberCount: g.member_count,
      privacy: (g.privacy ?? 'CLOSED') as 'OPEN' | 'CLOSED' | 'SECRET',
      isSelected: false,
    }))

    await db.collection('fb_groups').doc(state).set({
      userId: state,
      groups,
      lastSynced: FieldValue.serverTimestamp(),
    })

    await db.collection('users').doc(state).update({
      facebookConnected: true,
      facebookUserId: fbUser.id,
      facebookTokenExpiry: tokenExpiry,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.redirect(new URL('/dashboard?fb_connected=1', req.url))
  } catch (err: unknown) {
    console.error('Facebook OAuth error:', err)
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.redirect(new URL(`/dashboard?fb_error=${encodeURIComponent(msg)}`, req.url))
  }
}
