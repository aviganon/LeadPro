import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const { userId } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined

  if (isActive === undefined) {
    return NextResponse.json({ error: 'isActive required' }, { status: 400 })
  }

  if (userId === auth.adminUid && !isActive) {
    return NextResponse.json({ error: 'Cannot deactivate own account' }, { status: 400 })
  }

  try {
    const db = getAdminFirestore()
    const ref = db.collection('users').doc(userId)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    await ref.update({
      isActive,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin/users PATCH', e)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
