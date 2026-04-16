import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { verifyApiAuth, requireMatchingUser } from '@/lib/apiAuth'
import { rateLimitCheck, rateLimitResponse } from '@/lib/rateLimit'

// POST /api/ai/generate-post — body must include `userId` (must match session).
export async function POST(req: NextRequest) {
  const auth = await verifyApiAuth(req)
  if (!auth.ok) return auth.response

  try {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 503 })

    const { prompt, userId } = await req.json()
    const own = requireMatchingUser(auth.uid, typeof userId === 'string' ? userId : null)
    if (!own.ok) return own.response

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const rl = await rateLimitCheck(auth.uid, 'ai-generate')
    if (!rl.ok) return rateLimitResponse(rl)

    const anthropic = new Anthropic({ apiKey: key })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ text })
  } catch (err: unknown) {
    console.error('ai generate-post', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI error' },
      { status: 500 }
    )
  }
}
