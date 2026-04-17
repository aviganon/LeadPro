import { NextRequest, NextResponse } from 'next/server'
import { refineLeadScoresWithAi } from '@/lib/aiLeadScoring'
import { runLeadScraper } from '@/lib/scrapers'
import { createLeadsFromScrape } from '@/lib/leadsServer'
import { verifyApiAuth, requireMatchingUser } from '@/lib/apiAuth'
import { rateLimitCheck, rateLimitResponse } from '@/lib/rateLimit'
import type { LeadVertical } from '@/types'

// POST /api/leads/scrape
export async function POST(req: NextRequest) {
  const auth = await verifyApiAuth(req)
  if (!auth.ok) return auth.response

  try {
    const { userId, vertical, keywords } = await req.json()

    const own = requireMatchingUser(auth.uid, typeof userId === 'string' ? userId : null)
    if (!own.ok) return own.response

    if (!vertical || !Array.isArray(keywords)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    // keywords ריק מותר — runLeadScraper משלים מילות מפתח לפי הקטגוריה (vertical)

    const rl = await rateLimitCheck(auth.uid, 'scrape')
    if (!rl.ok) return rateLimitResponse(rl)

    let leads = await runLeadScraper(auth.uid, vertical as LeadVertical, keywords)
    leads = await refineLeadScoresWithAi(leads)
    const leadIds = await createLeadsFromScrape(leads)

    return NextResponse.json({ success: true, count: leadIds.length, leadIds })
  } catch (err: unknown) {
    console.error('scrape route', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Scrape error' },
      { status: 500 }
    )
  }
}
