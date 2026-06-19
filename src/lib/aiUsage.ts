import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

// תמחור Claude Haiku 4.5 (דולר ל-1M טוקנים) — מקור: claude-api skill.
export const AI_MODEL = 'claude-haiku-4-5-20251001'
export const PRICE_INPUT_PER_MTOK = 1.0
export const PRICE_OUTPUT_PER_MTOK = 5.0

export function computeCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * PRICE_INPUT_PER_MTOK + (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK
}

interface LogArgs {
  type: 'help' | 'questions'
  level?: string
  subject?: string
  inputTokens: number
  outputTokens: number
}

/** רושם שימוש ב-AI לטובת מעקב עלויות. נכשל בשקט כדי לא לפגוע בתגובה למשתמש. */
export async function logAiUsage({ type, level, subject, inputTokens, outputTokens }: LogArgs): Promise<void> {
  try {
    const costUsd = computeCostUsd(inputTokens, outputTokens)
    await getAdminFirestore().collection('ai_usage').add({
      type,
      level: level ?? 'unknown',
      subject: subject ?? 'unknown',
      inputTokens,
      outputTokens,
      costUsd,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (e) {
    console.error('logAiUsage failed (non-fatal):', e)
  }
}
