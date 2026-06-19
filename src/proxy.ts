import { NextResponse } from 'next/server'

/**
 * אין שער התחברות: האתר עולה עם גישה מלאה לכולם (לומדים בלי חשבון).
 * ההגנות נשארות במקום הנכון:
 *  - דפי /admin: נבדקים ב-src/app/admin/layout.tsx (server) + requireAdminSession ב-API.
 *  - /api/admin/*: requireAdminSession.
 *  - /api/ai/*: ציבורי בכוונה, מוגבל ב-rate-limit לפי IP.
 * משאירים proxy מינימלי (no-op) כנקודת הרחבה עתידית אם נרצה להחזיר gating חלקי.
 */
export function proxy() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
