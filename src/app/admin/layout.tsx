import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'
import { decodeSessionCookieToken } from '@/lib/sessionCookieCodec'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = decodeSessionCookieToken(cookieStore.get('__session')?.value)
  if (!session) {
    redirect('/auth?redirect=/admin')
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(session)
    const userDoc = await getAdminFirestore().collection('users').doc(decoded.uid).get()
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      redirect('/dashboard')
    }
  } catch {
    redirect('/auth?redirect=/admin')
  }

  return <>{children}</>
}
