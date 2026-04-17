/**
 * ציון לידים עם Claude (אופציונלי) — מופעל רק כש-LEAD_AI_SCORING=1 ו-ANTHROPIC_API_KEY מוגדר.
 * עולה כסף; מומלץ רק ל-batches קטנים.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { Lead } from '@/types'

const BATCH = 12

export async function refineLeadScoresWithAi(
  leads: Omit<Lead, 'id'>[]
): Promise<Omit<Lead, 'id'>[]> {
  if (process.env.LEAD_AI_SCORING !== '1') return leads
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || leads.length === 0) return leads

  const anthropic = new Anthropic({ apiKey: key })
  const out = leads.map((l) => ({ ...l }))

  for (let i = 0; i < out.length; i += BATCH) {
    const chunk = out.slice(i, i + BATCH)
    const lines = chunk
      .map((l, j) => `${j + 1}. [${l.source}/${l.vertical}] ${l.notes.slice(0, 400)}`)
      .join('\n')
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `You score sales leads in Israel (Hebrew ok). For each numbered line, reply with ONLY a JSON array of integers 0-100 (conversion likelihood), same length and order as lines. No text outside JSON.\n\n${lines}`,
          },
        ],
      })
      const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
      const jsonMatch = text.match(/\[[\s\d,]+\]/)
      const arr = jsonMatch ? (JSON.parse(jsonMatch[0]) as unknown[]) : null
      if (Array.isArray(arr) && arr.length === chunk.length) {
        for (let k = 0; k < chunk.length; k++) {
          const n = Number(arr[k])
          if (!Number.isFinite(n)) continue
          const sc = Math.min(100, Math.max(0, Math.round(n)))
          out[i + k] = { ...out[i + k]!, qualityScore: sc }
        }
      }
    } catch (e) {
      console.error('refineLeadScoresWithAi', e)
    }
  }

  return out
}
