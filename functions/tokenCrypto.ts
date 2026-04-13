// Same algorithm as src/lib/crypto.ts — keep in sync for Cloud Functions runtime

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12

async function getKey(): Promise<CryptoKey> {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (!raw) throw new Error('TOKEN_ENCRYPTION_KEY env var not set')
  const keyBytes = Buffer.from(raw, 'base64')
  return crypto.subtle.importKey('raw', keyBytes, { name: ALGORITHM, length: KEY_LENGTH }, false, ['decrypt'])
}

export async function decryptToken(encryptedBase64: string): Promise<string> {
  const key = await getKey()
  const combined = Buffer.from(encryptedBase64, 'base64')
  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)
  const plaintext = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
