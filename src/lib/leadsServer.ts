import { createHash } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import type { DocumentData, DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import type { Lead } from '@/types'

const BATCH_MAX = 400

/** מפתח יציב לליד מאותו מקור — מונע כפילויות ב-Firestore בין הרצות איסוף */
function stableScrapeLeadDocId(lead: Omit<Lead, 'id'>): string {
  const rd = (lead.rawData ?? {}) as Record<string, unknown>
  const seed = [
    lead.userId,
    lead.source,
    String(rd.listingId ?? rd.id ?? ''),
    String(rd.url ?? rd.link ?? ''),
    String(rd.permalink ?? rd.feedUrl ?? ''),
    lead.notes.slice(0, 240),
  ].join('|')
  const h = createHash('sha256').update(seed).digest('hex')
  return `sc_${h}`
}

function leadFirestoreData(lead: Omit<Lead, 'id'>): Record<string, unknown> {
  return {
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
    updatedAt: FieldValue.serverTimestamp(),
  }
}

/**
 * Writes scraped leads with the Admin SDK (required on serverless API routes).
 * מזהה דוקומנט יציב לפי userId+source+מזהה מודעה/קישור — עדכון אם הציון גבוה יותר.
 */
export async function createLeadsFromScrape(leads: Omit<Lead, 'id'>[]): Promise<string[]> {
  if (leads.length === 0) return []
  const db = getAdminFirestore()
  const col = db.collection('leads')
  const ids: string[] = []

  for (let i = 0; i < leads.length; i += BATCH_MAX) {
    const slice = leads.slice(i, i + BATCH_MAX)
    const refs: DocumentReference<DocumentData>[] = slice.map((lead) =>
      col.doc(stableScrapeLeadDocId(lead))
    )

    const snapshots: DocumentSnapshot[] = []
    for (let j = 0; j < refs.length; j += 10) {
      const chunk = refs.slice(j, j + 10)
      const got = await db.getAll(...chunk)
      snapshots.push(...got)
    }

    const batch = db.batch()
    let ops = 0
    for (let k = 0; k < slice.length; k++) {
      const lead = slice[k]!
      const ref = refs[k]!
      const snap = snapshots[k]!

      if (snap.exists) {
        const prevScore = (snap.data()?.qualityScore as number) ?? 0
        if (lead.qualityScore > prevScore) {
          batch.update(ref, {
            qualityScore: lead.qualityScore,
            notes: lead.notes,
            rawData: lead.rawData ?? {},
            vertical: lead.vertical,
            source: lead.source,
            updatedAt: FieldValue.serverTimestamp(),
          })
          ops += 1
          ids.push(ref.id)
        }
      } else {
        batch.set(ref, {
          ...leadFirestoreData(lead),
          createdAt: FieldValue.serverTimestamp(),
        })
        ops += 1
        ids.push(ref.id)
      }
    }
    if (ops > 0) await batch.commit()
  }

  return ids
}
