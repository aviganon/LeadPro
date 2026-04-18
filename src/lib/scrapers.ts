// Lead collection engines per vertical
// Each scraper returns normalized Lead objects ready for Firestore

import type { Lead, LeadSource, LeadVertical } from '@/types'
import { VERTICAL_CONFIG } from '@/lib/templates'

function defaultKeywordsForVertical(vertical: LeadVertical): string[] {
  const cfg = VERTICAL_CONFIG[vertical] ?? VERTICAL_CONFIG.general
  const kws = cfg?.keywords ?? []
  if (kws.length > 0) return kws
  return ['דירה למכירה', 'מכירת רכב']
}

function dedupeRawLeads(raw: RawLead[]): RawLead[] {
  const seen = new Set<string>()
  return raw.filter((r) => {
    const listingId = r.rawData?.listingId
    const url = r.rawData?.url ?? r.rawData?.link
    const key = `${r.source}:${String(listingId ?? '')}:${String(url ?? '')}:${r.notes.slice(0, 120)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

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

// ========== MADLAN (נדל״ן) — תשתית; להשלים כשיש API/שותפות יציבים ==========

export async function scrapeMadlanListings(_query: string): Promise<RawLead[]> {
  return []
}

/** Autoscout / פורטל רכב בינלאומי — תשתית; להשלים כשיש API חוקי */
export async function scrapeAutoscoutListings(_query: string): Promise<RawLead[]> {
  return []
}

// ========== REDDIT r/Israel ==========

const REDDIT_UA = 'ApexLeads/1.0 (lead tool; contact via site)'

export async function fetchRedditIsraelSearch(
  keywords: string[],
  vertical: LeadVertical
): Promise<RawLead[]> {
  const leads: RawLead[] = []
  for (const kw of keywords.slice(0, 8)) {
    const q = kw.trim()
    if (!q) continue
    const url =
      `https://www.reddit.com/r/Israel/search.json?` +
      new URLSearchParams({
        q,
        restrict_sr: '1',
        sort: 'new',
        limit: '8',
      }).toString()
    try {
      const res = await fetch(url, { headers: { 'User-Agent': REDDIT_UA } })
      if (!res.ok) continue
      const json = (await res.json()) as {
        data?: { children?: Array<{ data: Record<string, unknown> }> }
      }
      const children = json?.data?.children ?? []
      for (const c of children) {
        const d = c.data ?? {}
        const title = String(d.title ?? '')
        const permalink = typeof d.permalink === 'string' ? `https://www.reddit.com${d.permalink}` : ''
        const selftext = String(d.selftext ?? '').slice(0, 300)
        if (!title) continue
        leads.push({
          source: 'reddit' as LeadSource,
          vertical,
          notes: `${title}${selftext ? ` — ${selftext}` : ''}`.slice(0, 280),
          qualityScore: 38,
          rawData: {
            permalink,
            subreddit: d.subreddit,
            author: d.author,
            created: d.created_utc,
            keyword: q,
          },
        })
      }
    } catch {
      /* Reddit rate-limit או שגיאת רשת */
    }
  }
  return leads
}

// ========== RSS / Atom (Google Alerts, חדשות, בלוגים) ==========
// הזנות מוגדרות ב-LEAD_RSS_FEED_URLS (מופרדות בפסיקים). קישור RSS של Google Alerts מופיע אחרי יצירת התראה.

function decodeXmlText(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number.parseInt(n, 10)))
}

function extractInnerTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  return block.match(re)?.[1]?.trim() ?? ''
}

function parseFeedXml(xml: string): { title: string; link: string; summary: string }[] {
  const out: { title: string; link: string; summary: string }[] = []

  const atomBlocks = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/gi) ?? []
  for (const block of atomBlocks) {
    const titleRaw = extractInnerTag(block, 'title')
    const linkMatch =
      block.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i) ??
      block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)
    const link = linkMatch?.[1]?.trim() ?? ''
    const summaryRaw =
      extractInnerTag(block, 'summary') ||
      extractInnerTag(block, 'content') ||
      extractInnerTag(block, 'subtitle')
    const title = decodeXmlText(titleRaw)
    const summary = decodeXmlText(summaryRaw)
    if (title && link) out.push({ title, link, summary })
  }
  if (out.length > 0) return out

  const rssBlocks = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) ?? []
  for (const block of rssBlocks) {
    const titleRaw = extractInnerTag(block, 'title')
    let link = extractInnerTag(block, 'link')
    if (!link) {
      link = block.match(/<guid[^>]*isPermaLink=["']true["'][^>]*>([^<]+)<\/guid>/i)?.[1]?.trim() ?? ''
    }
    const summaryRaw =
      extractInnerTag(block, 'description') ||
      extractInnerTag(block, 'content:encoded') ||
      extractInnerTag(block, 'summary')
    const title = decodeXmlText(titleRaw)
    const summary = decodeXmlText(summaryRaw)
    if (title && link) out.push({ title, link: decodeXmlText(link), summary })
  }
  return out
}

function rssFeedUrlsFromEnv(): string[] {
  const raw = process.env.LEAD_RSS_FEED_URLS ?? ''
  return raw
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://')))
}

function entryMatchesKeywords(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true
  const lower = text.toLowerCase()
  return keywords.some((kw) => kw.length > 0 && lower.includes(kw.toLowerCase()))
}

export async function fetchRssFeedLeads(
  keywords: string[],
  vertical: LeadVertical
): Promise<RawLead[]> {
  const urls = rssFeedUrlsFromEnv()
  if (urls.length === 0) return []

  const strict = process.env.LEAD_RSS_STRICT_KEYWORDS === '1'
  const leads: RawLead[] = []
  const maxPerFeed = 12

  for (const feedUrl of urls) {
    try {
      const res = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'ApexLeads/1.0 RSS',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const entries = parseFeedXml(xml).slice(0, maxPerFeed)

      for (const { title, link, summary } of entries) {
        const blob = `${title} ${summary}`
        if (strict && !entryMatchesKeywords(blob, keywords)) continue
        leads.push({
          source: 'rss' as LeadSource,
          vertical,
          notes: title.slice(0, 280),
          qualityScore: 42,
          rawData: { title, link, summary: summary.slice(0, 500), feedUrl },
        })
      }
    } catch {
      /* feed failed */
    }
  }

  return leads
}

// ========== טלגרם — הודעות לבוט (getUpdates) ==========

export async function fetchTelegramBotLeads(
  keywords: string[],
  vertical: LeadVertical
): Promise<RawLead[]> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return []

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=30`)
    const data = (await res.json()) as { ok?: boolean; result?: Record<string, unknown>[] }
    if (!data.ok || !Array.isArray(data.result)) return []

    return (data.result ?? [])
      .filter((update: Record<string, unknown>) => {
        const text = ((update.message as Record<string, unknown>)?.text as string) ?? ''
        if (!text.trim()) return false
        if (keywords.length === 0) return true
        return keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))
      })
      .map((update: Record<string, unknown>) => {
        const msg = update.message as Record<string, unknown>
        const text = (msg.text as string) ?? ''
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
  const effectiveKeywords =
    keywords.length > 0 ? keywords : defaultKeywordsForVertical(vertical)

  const raw: RawLead[] = []

  if (vertical === 'real_estate') {
    for (const kw of effectiveKeywords) {
      raw.push(...(await scrapeYad2Listings(kw)))
      raw.push(...(await scrapeMadlanListings(kw)))
    }
    raw.push(...(await fetchRedditIsraelSearch(effectiveKeywords, vertical)))
  } else if (vertical === 'car') {
    for (const kw of effectiveKeywords) {
      raw.push(...(await scrapeYad2Cars(kw)))
      raw.push(...(await scrapeAutoscoutListings(kw)))
    }
  } else if (vertical === 'recruitment') {
    raw.push(...(await fetchRedditIsraelSearch(effectiveKeywords, vertical)))
  } else if (vertical === 'general') {
    // מעורב: נדל"ן + רכב לפי אותן מילות חיפוש (לידים מגוונים)
    for (const kw of effectiveKeywords) {
      raw.push(...(await scrapeYad2Listings(kw)))
      raw.push(...(await scrapeYad2Cars(kw)))
    }
    raw.push(...(await fetchRedditIsraelSearch(effectiveKeywords, vertical)))
  } else {
    // ורטיקלים נוספים (solar_energy, insurance, mortgage, legal, accounting, renovation וכד׳)
    // אין scraper ייעודי — חיפוש Reddit לפי מילות מפתח של הורטיקל
    raw.push(...(await fetchRedditIsraelSearch(effectiveKeywords, vertical)))
  }

  const rssLeads = await fetchRssFeedLeads(effectiveKeywords, vertical)
  raw.push(...rssLeads)

  const telegramLeads = await fetchTelegramBotLeads(effectiveKeywords, vertical)
  raw.push(...telegramLeads)

  const deduped = dedupeRawLeads(raw)

  // Normalize to Lead schema
  return deduped.map(r => ({
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
