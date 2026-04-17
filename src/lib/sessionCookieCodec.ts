/**
 * עוגיית __session מכילה JWT של Firebase — קידוד כדי שלא יישברו תווים בעייתיים.
 * decode תואם גם לערכים ישנים שלא עברו encode (JWT רגיל בלי %).
 */
export function encodeSessionCookieToken(token: string): string {
  return encodeURIComponent(token)
}

export function decodeSessionCookieToken(value: string | undefined): string | undefined {
  if (value == null || value === '') return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
