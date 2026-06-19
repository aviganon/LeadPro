import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimitCheck, rateLimitResponse } from '@/lib/rateLimit'
import { AI_MODEL, logAiUsage } from '@/lib/aiUsage'

function audienceForLevel(level: string, grade: number): string {
  if (level === 'student') return `college / practical-engineering (הנדסאי) students, year ${grade}`
  if (level === 'middle_high') return `middle/high-school students, grade ${grade}`
  return `young elementary-school children, grade ${grade}`
}

// POST /api/ai/questions — מייצר שאלות תרגול. גישה אנונימית עם הגבלת קצב לפי IP.
export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'AI is not configured' }, { status: 503 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  const rl = await rateLimitCheck(ip, 'ai-generate')
  if (!rl.ok) return rateLimitResponse(rl)

  let body: { subject?: string; subjectName?: string; grade?: number; topic?: string; count?: number; level?: string; lang?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const subject = (body.subjectName || body.subject || '').toString().slice(0, 80) || 'general'
  const grade = Number.isFinite(body.grade) ? Number(body.grade) : 1
  const level = (body.level ?? 'elementary').toString()
  const topic = (body.topic ?? '').toString().slice(0, 80)
  const count = Math.min(Math.max(Number(body.count) || 5, 1), 10)
  const lang = body.lang === 'en' ? 'English' : 'Hebrew'

  try {
    const anthropic = new Anthropic({ apiKey: key })
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      system:
        `You generate level-appropriate multiple-choice practice questions for ${audienceForLevel(level, grade)}. ` +
        `Match the difficulty and terminology to that audience. ` +
        `Return ONLY valid JSON, no markdown fences. Schema: ` +
        `{"questions":[{"prompt":string,"options":[string,string,string,string],"answer":string,"explanation":string}]}. ` +
        `"answer" must exactly equal one of the options. Write all text in ${lang}.`,
      messages: [{
        role: 'user',
        content: `Subject: ${subject}.${topic ? ` Topic: ${topic}.` : ''} Generate ${count} questions.`,
      }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
    const jsonStr = raw.trim().replace(/^```json?\s*/i, '').replace(/```$/i, '').trim()
    let parsed: { questions?: unknown }
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'AI returned malformed output' }, { status: 502 })
    }

    await logAiUsage({
      type: 'questions', level, subject,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    })

    const questions = Array.isArray(parsed.questions) ? parsed.questions : []
    return NextResponse.json({ questions })
  } catch (err: unknown) {
    console.error('ai/questions', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI error' },
      { status: 500 }
    )
  }
}
