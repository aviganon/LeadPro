/**
 * Verifies a Firebase Auth ID token on the Edge runtime (middleware).
 * firebase-admin is Node-only; jose + Google's JWKS matches the same checks as verifyIdToken.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

export async function verifyFirebaseIdTokenEdge(idToken: string): Promise<{ uid: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
  if (!projectId) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set')

  const issuer = `https://securetoken.google.com/${projectId}`
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer,
    audience: projectId,
  })

  const uid = typeof payload.sub === 'string' ? payload.sub : null
  if (!uid) throw new Error('Invalid token: missing sub')
  return { uid }
}
