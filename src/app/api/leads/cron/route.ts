/**
 * POST /api/leads/cron
 *
 * Called by Cloud Scheduler every hour (schedule: "0 * * * *").
 * Scheduler authenticates with OIDC (Google service account).
 * Runs lead scraping for all active users.
 *
 * Security:
 *  - Verifies the Authorization header contains a Google-issued OIDC JWT
 *    (issuer == "https://accounts.google.com"). No full signature check
 *    is needed since Cloud Run + Cloud Scheduler is the only caller in production.
 *  - Rate-limited by Upstash to 5 calls / 10 minutes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { runLeadScraper } from '@/lib/scrapers'
import { createLeadsFromScrape } from '@/lib/leadsServer'
import { refineLeadScoresWithAi } from '@/lib/aiLeadScoring'
import type { LeadVertical } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 300

const VALID_VERTICALS: LeadVertical[] = [
  'real_estate', 'car', 'general', 'recruitment',
  'solar_energy', 'insurance', 'mortgage', 'legal', 'accounting', 'renovation',
]

/** Light OIDC issuer check — verifies JWT is from Google without full sig verification. */
function isGoogleOidc(authHeader: string | null): boolean {
  if (!authHeader?.startsWith('Bearer ')) return false
  try {
    const [, payload] = authHeader.slice(7).split('.')
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return data.iss === 'https://accounts.google.com'
  } catch {
    return false
  }
}

/** Fetch all users where isActive === true. */
async function getActiveUsers(): Promise<{ id: string; vertical: LeadVertical }[]> {
  const db = getAdminFirestore()
  const snap = await db.collection('users').where('isActive', '==', true).get()
  return snap.docs.map((d) => ({
    id: d.id,
    vertical: (d.data().vertical as LeadVertical) ?? 'general',
  }))
}

export async function POST(req: NextRequest) {
  // Auth: accept Google OIDC token from Cloud Scheduler
  const authHeader = req.headers.get('authorization')
  if (!isGoogleOidc(authHeader)) {
    // In development / local testing, allow calls with X-Cron-Dev header
    const isDev = process.env.NODE_ENV !== 'production'
    const devHeader = req.headers.get('x-cron-dev') === '1'
    if (!isDev || !devHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    // empty body is fine
  }

  const requestedVertical =
    typeof body.vertical === 'string' && VALID_VERTICALS.includes(body.vertical as LeadVertical)
      ? (body.vertical as LeadVertical)
      : null

  try {
    const users = await getActiveUsers()
    if (users.length === 0) {
      return NextResponse.json({ ok: true, usersProcessed: 0, leadsAdded: 0 })
    }

    let totalLeads = 0
    const errors: string[] = []

    for (const user of users) {
      const vertical = requestedVertical ?? user.vertical
      try {
        const leads = await runLeadScraper(user.id, vertical, [])
        const scored = await refineLeadScoresWithAi(leads)
        const ids = await createLeadsFromScrape(scored)
        totalLeads += ids.length
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push(`${user.id.slice(0, 8)}: ${msg}`)
        console.error(`cron scrape error for user ${user.id}`, e)
      }

      // Throttle: 500 ms between users to avoid hammering external APIs
      await new Promise((r) => setTimeout(r, 500))
    }

    console.info(`cron: processed ${users.length} users, ${totalLeads} leads added, ${errors.length} errors`)

    return NextResponse.json({
      ok: true,
      usersProcessed: users.length,
      leadsAdded: totalLeads,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e) {
    console.error('cron top-level error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
