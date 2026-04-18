import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

const PLANS = ['free', 'basic', 'pro', 'enterprise'] as const
const VERTICALS = [
  'real_estate', 'car', 'general', 'recruitment',
  'solar_energy', 'insurance', 'mortgage', 'legal', 'accounting', 'renovation',
] as const
const ROLES = ['admin', 'user'] as const

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const { userId } = await ctx.params
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : undefined
  const isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined
  const vertical =
    body.vertical !== undefined && VERTICALS.includes(body.vertical as (typeof VERTICALS)[number])
      ? body.vertical
      : undefined
  const plan =
    body.plan !== undefined && PLANS.includes(body.plan as (typeof PLANS)[number])
      ? body.plan
      : undefined
  const role =
    body.role !== undefined && ROLES.includes(body.role as (typeof ROLES)[number])
      ? body.role
      : undefined

  const hasField =
    name !== undefined ||
    isActive !== undefined ||
    vertical !== undefined ||
    plan !== undefined ||
    role !== undefined

  if (!hasField) {
    return NextResponse.json({ error: 'אין שדות לעדכון' }, { status: 400 })
  }

  if (userId === auth.adminUid && isActive === false) {
    return NextResponse.json({ error: 'לא ניתן לכבות את החשבון שלך' }, { status: 400 })
  }

  if (userId === auth.adminUid && role === 'user') {
    return NextResponse.json({ error: 'לא ניתן להסיר מעצמך הרשאת מנהל' }, { status: 400 })
  }

  try {
    const db = getAdminFirestore()
    const ref = db.collection('users').doc(userId)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
    if (name !== undefined) updates.name = name
    if (isActive !== undefined) updates.isActive = isActive
    if (vertical !== undefined) updates.vertical = vertical
    if (plan !== undefined) updates.plan = plan
    if (role !== undefined) updates.role = role

    await ref.update(updates)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin/users PATCH', e)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
