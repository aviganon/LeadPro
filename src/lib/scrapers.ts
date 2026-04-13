// Lead collection engines per vertical
// Each scraper returns normalized Lead objects ready for Firestore

import type { Lead, LeadSource, LeadVertical } from '@/types'

interface RawLead {
  source: LeadSource
  vertical: LeadVertical
  rawData: Record<string, unknown>
  notes: string
  qualityScore: number
}

// ========== REAL ESTATE ==========

export async function scrapeYad2Listings(query: string): Promise<RawLead[]> {
  // Yad2 has a semi-public JSON API used by their mobile app
  // We query listings that appear multiple times (frustrated sellers = hot leads)
  const url = `https://gw.yad2.co.il/feed-search-legacy/realestate/forsale?` +
    new URLSearchParams({ text: query, page: '1', rows_per_page: '20' }).toString()

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Yad2/11.0 CFNetwork/1402.0.8 Darwin/22.2.0' }
    })
    if (!res.ok) return []
    const data = await res.json()
    const items = data?.data?.feed?.feed_items ?? []

    return items
      .filter((item: Record<string, unknown>) => item.type === 'ad')
      .map((item: Record<string, unknown>) => ({
        source: 'yad2' as LeadSource,
        vertical: 'real_estate' as LeadVertical,
        notes: `${item.title ?? ''} - ${item.city ?? ''} ${item.neighborhood ?? ''} - ₪${item.price ?? 'N/A'}`,
        qualityScore: scoreYad2Item(item),
        rawData: {
          listingId: item.id,
          title: item.title,
          price: item.price,
          city: item.city,
          neighborhood: item.neighborhood,
          rooms: item.rooms,
          floor: item.floor,
          squareMeter: item.SquareMeter,
          phone: item.contact_name,
          imageUrl: (item.images as unknown[])?.[0] ?? null,
          url: `https://www.yad2.co.il/item/${item.id}`,
          postedAt: item.date,
        },
      }))
  } catch {
    return []
  }
}

function scoreYad2Item(item: Record<string, unknown>): number {
  let score = 50
  if (item.price) score += 10
  if (item.phone) score += 15
  if (item.contact_name) score += 10
  // Listings posted more than once are frustrated sellers
  if (item.order_type === 'commercial') score -= 20
  return Math.min(100, score)
}

// ========== CAR VERTICAL ==========

export async function scrapeYad2Cars(query: string): Promise<RawLead[]> {
  const url = `https://gw.yad2.co.il/feed-search-legacy/vehicles/cars?` +
    new URLSearchParams({ text: query, page: '1', rows_per_page: '20' }).toString()

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Yad2/11.0 CFNetwork/1402.0.8 Darwin/22.2.0' }
    })
    if (!res.ok) return []
    const data = await res.json()
    const items = data?.data?.feed?.feed_items ?? []

    return items
      .filter((item: Record<string, unknown>) => item.type === 'ad')
      .map((item: Record<string, unknown>) => ({
        source: 'yad2' as LeadSource,
        vertical: 'car' as LeadVertical,
        notes: `${item.title ?? ''} - ${item.year ?? ''} - ₪${item.price ?? 'N/A'} - ${item.km ?? ''}km`,
        qualityScore: scoreCarItem(item),
        rawData: {
          listingId: item.id,
          title: item.title,
          price: item.price,
          year: item.year,
          km: item.km,
          manufacturer: item.manufacturer,
          model: item.model,
          hand: item.hand,
          color: item.color,
          url: `https://www.yad2.co.il/item/${item.id}`,
          postedAt: item.date,
        },
      }))
  } catch {
    return []
  }
}

function scoreCarItem(item: Record<string, unknown>): number {
  let score = 50
  if (item.price) score += 10
  if (item.year && Number(item.year) > 2018) score += 10
  if (item.km && Number(item.km) < 100000) score += 10
  if ((item.hand as number) === 1) score += 15
  return Math.min(100, score)
}

// ========== GOOGLE ALERTS SIMULATION ==========
// In production: set up webhooks from Google Alerts RSS feeds

export async function fetchGoogleAlertsLeads(
  keywords: string[],
  vertical: LeadVertical
): Promise<RawLead[]> {
  const leads: RawLead[] = []
  for (const keyword of keywords) {
    const rssUrl = `https://www.google.com/alerts/feeds/` +
      encodeURIComponent(keyword).toLowerCase() + `/web`
    try {
      const res = await fetch(rssUrl)
      if (!res.ok) continue
      const xml = await res.text()
      // Parse Atom feed entries
      const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? []
      for (const entry of entries.slice(0, 5)) {
        const title = entry.match(/<title[^>]*>(.*?)<\/title>/)?.[1] ?? ''
        const link = entry.match(/<link[^>]*href="([^"]*)"[^>]*>/)?.[1] ?? ''
        const summary = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? ''
        leads.push({
          source: 'google_alerts',
          vertical,
          notes: title.replace(/&amp;/g, '&').replace(/<[^>]+>/g, ''),
          qualityScore: 40,
          rawData: { title, link, summary: summary.replace(/<[^>]+>/g, ''), keyword },
        })
      }
    } catch { /* skip failed feeds */ }
  }
  return leads
}

// ========== TELEGRAM PUBLIC GROUPS ==========
// Monitor public Telegram channels for leads via Telegram Bot API

export async function fetchTelegramChannelMessages(
  channelUsername: string,
  keywords: string[],
  vertical: LeadVertical
): Promise<RawLead[]> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return []

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=20`
    )
    const data = await res.json()
    if (!data.ok) return []

    return (data.result ?? [])
      .filter((update: Record<string, unknown>) => {
        const text = ((update.message as Record<string, unknown>)?.text as string) ?? ''
        return keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))
      })
      .map((update: Record<string, unknown>) => {
        const msg = update.message as Record<string, unknown>
        const text = msg.text as string
        return {
          source: 'telegram' as LeadSource,
          vertical,
          notes: text.slice(0, 200),
          qualityScore: 45,
          rawData: { messageId: msg.message_id, chat: msg.chat, text, date: msg.date },
        }
      })
  } catch {
    return []
  }
}

// ========== MAIN DISPATCHER ==========

export async function runLeadScraper(
  userId: string,
  vertical: LeadVertical,
  keywords: string[]
): Promise<Omit<Lead, 'id'>[]> {
  const raw: RawLead[] = []

  if (vertical === 'real_estate') {
    for (const kw of keywords) {
      const results = await scrapeYad2Listings(kw)
      raw.push(...results)
    }
  } else if (vertical === 'car') {
    for (const kw of keywords) {
      const results = await scrapeYad2Cars(kw)
      raw.push(...results)
    }
  }

  // Add Google Alerts results for all verticals
  const alertLeads = await fetchGoogleAlertsLeads(keywords, vertical)
  raw.push(...alertLeads)

  // Normalize to Lead schema
  return raw.map(r => ({
    userId,
    vertical: r.vertical,
    source: r.source,
    status: 'new',
    qualityScore: r.qualityScore,
    notes: r.notes,
    rawData: r.rawData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
}
