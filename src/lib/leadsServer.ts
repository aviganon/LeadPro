import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import type { Lead } from '@/types'

const BATCH_MAX = 400

/**
 * Writes scraped leads with the Admin SDK (required on serverless API routes).
 */
export async function createLeadsFromScrape(leads: Omit<Lead, 'id'>[]): Promise<string[]> {
  if (leads.length === 0) return []
  const db = getAdminFirestore()
  const col = db.collection('leads')
  const ids: string[] = []

  for (let i = 0; i < leads.length; i += BATCH_MAX) {
    const slice = leads.slice(i, i + BATCH_MAX)
    const batch = db.batch()
    for (const lead of slice) {
      const ref = col.doc()
      batch.set(ref, {
        userId: lead.userId,
        vertical: lead.vertical,
        source: lead.source,
        status: lead.status,
        qualityScore: lead.qualityScore,
        ...(lead.name != null && lead.name !== '' ? { name: lead.name } : {}),
        ...(lead.phone != null && lead.phone !== '' ? { phone: lead.phone } : {}),
        ...(lead.email != null && lead.email !== '' ? { email: lead.email } : {}),
        notes: lead.notes,
        rawData: lead.rawData ?? {},
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      ids.push(ref.id)
    }
    await batch.commit()
  }

  return ids
}
