import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimitCheck, rateLimitResponse } from '@/lib/rateLimit'
import { AI_MODEL, logAiUsage } from '@/lib/aiUsage'

// מתאים את סגנון ההסבר לרמה שנבחרה
function systemForLevel(level: string, subject: string, grade: number | undefined, lang: string): string {
  const subjectLine = `Subject: ${subject || 'general'}${grade ? `, grade/year ${grade}` : ''}.`
  if (level === 'student') {
    return (
      `You are a knowledgeable academic tutor for a college / practical-engineering (הנדסאי) student. ${subjectLine} ` +
      `Answer at a post-secondary level: precise, use correct professional terminology, include the relevant formula, rule, standard or regulation when applicable, and a short worked example. ` +
      `Be rigorous but clear. Always answer in ${lang}.`
    )
  }
  if (level === 'middle_high') {
    return (
      `You are a friendly, patient tutor for a middle/high-school teenager. ${subjectLine} ` +
      `Explain step by step in clear language with one concrete example. Encourage at the end. Always answer in ${lang}.`
    )
  }
  // elementary (default)
  return (
    `You are a warm, playful tutor for a young child in elementary school. ${subjectLine} ` +
    `Explain in very simple words a child can follow, use a tiny everyday example, keep it short, and end with one encouraging sentence. Always answer in ${lang}.`
  )
}

// POST /api/ai/help — מורה פרטי. גישה אנונימית (ללא התחברות) עם הגבלת קצב לפי IP.
export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'AI is not configured' }, { status: 503 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  const rl = await rateLimitCheck(ip, 'ai-generate')
  if (!rl.ok) return rateLimitResponse(rl)

  let body: { question?: string; subject?: string; subjectName?: string; grade?: number; level?: string; lang?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const question = (body.question ?? '').toString().slice(0, 800).trim()
  if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

  const subject = (body.subjectName || body.subject || '').toString().slice(0, 80)
  const grade = Number.isFinite(body.grade) ? body.grade : undefined
  const level = (body.level ?? 'elementary').toString()
  const lang = body.lang === 'en' ? 'English' : 'Hebrew'

  try {
    const anthropic = new Anthropic({ apiKey: key })
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 700,
      system: systemForLevel(level, subject, grade, lang),
      messages: [{ role: 'user', content: question }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    await logAiUsage({
      type: 'help', level, subject,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    })
    return NextResponse.json({ text })
  } catch (err: unknown) {
    console.error('ai/help', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI error' },
      { status: 500 }
    )
  }
}
