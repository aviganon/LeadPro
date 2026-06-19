import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

const PLANS = ['free', 'basic', 'pro', 'enterprise'] as const
const ROLES = ['admin', 'user'] as const

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const plan = body.plan
  const role = body.role

  if (!email || !password || password.length < 6 || !name) {
    return NextResponse.json(
      { error: 'נדרשים אימייל, שם וסיסמה (לפחות 6 תווים)' },
      { status: 400 }
    )
  }

  const p = PLANS.includes(plan as (typeof PLANS)[number]) ? plan : 'free'
  const r = ROLES.includes(role as (typeof ROLES)[number]) ? role : 'user'

  try {
    const adminAuth = getAdminAuth()
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    })

    const db = getAdminFirestore()
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role: r,
      plan: p,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ ok: true, userId: userRecord.uid })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Create failed'
    if (msg.includes('email-already-exists') || msg.includes('already been registered')) {
      return NextResponse.json({ error: 'האימייל כבר רשום' }, { status: 409 })
    }
    console.error('admin/users POST', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
