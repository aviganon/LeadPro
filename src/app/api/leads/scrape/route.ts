import { NextRequest, NextResponse } from 'next/server'
import { runLeadScraper } from '@/lib/scrapers'
import { createLead } from '@/lib/db'
import type { LeadVertical } from '@/types'

// POST /api/leads/scrape
export async function POST(req: NextRequest) {
  try {
    const { userId, vertical, keywords } = await req.json()

    if (!userId || !vertical || !keywords?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const leads = await runLeadScraper(userId, vertical as LeadVertical, keywords)

    const created = await Promise.all(leads.map(lead => createLead(lead)))

    return NextResponse.json({ success: true, count: created.length, leadIds: created })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Scrape error' },
      { status: 500 }
    )
  }
}
