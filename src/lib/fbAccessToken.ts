import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { decryptToken } from '@/lib/crypto'

export async function getFacebookAccessTokenForUser(
  userId: string
): Promise<{ accessToken: string; tokenExpiry: Date | null } | null> {
  const snap = await getAdminFirestore().collection('fb_tokens').doc(userId).get()
  if (!snap.exists) return null

  const d = snap.data()!
  let accessToken = d.accessToken as string
  if (d.tokenEncrypted === true) {
    accessToken = await decryptToken(accessToken)
  }

  const te = d.tokenExpiry
  let tokenExpiry: Date | null = null
  if (te != null) {
    const maybeTs = te as { toDate?: () => Date }
    if (typeof maybeTs.toDate === 'function') {
      tokenExpiry = maybeTs.toDate()
    } else if (te instanceof Date) {
      tokenExpiry = te
    }
  }

  return { accessToken, tokenExpiry }
}
