import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimitCheck, rateLimitResponse } from '@/lib/rateLimit'

// POST /api/ai/help — מורה פרטי. גישה אנונימית (ללא התחברות) עם הגבלת קצב לפי IP.
export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'AI is not configured' }, { status: 503 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  const rl = await rateLimitCheck(ip, 'ai-generate')
  if (!rl.ok) return rateLimitResponse(rl)

  let body: { question?: string; subject?: string; grade?: number; lang?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const question = (body.question ?? '').toString().slice(0, 800).trim()
  if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

  const subject = (body.subject ?? '').toString().slice(0, 60)
  const grade = Number.isFinite(body.grade) ? body.grade : undefined
  const lang = body.lang === 'en' ? 'English' : 'Hebrew'

  try {
    const anthropic = new Anthropic({ apiKey: key })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system:
        `You are a friendly, patient tutor for school students. ` +
        `Explain step by step in simple, encouraging language a child can follow. ` +
        `Always answer in ${lang}. Subject: ${subject || 'general'}${grade ? `, grade ${grade}` : ''}. ` +
        `Keep it short, use a small example, and end with a one-line encouragement.`,
      messages: [{ role: 'user', content: question }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ text })
  } catch (err: unknown) {
    console.error('ai/help', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI error' },
      { status: 500 }
    )
  }
}
