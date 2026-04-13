// Simple in-memory rate limiter for API routes
// For production, replace backing store with Redis/Upstash

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  windowMs: number    // time window in ms
  max: number         // max requests per window
}

const LIMITS: Record<string, RateLimitConfig> = {
  'publish':       { windowMs: 60 * 60 * 1000,  max: 50  },   // 50 posts / hour
  'scrape':        { windowMs: 60 * 60 * 1000,  max: 10  },   // 10 scrapes / hour
  'ai-generate':   { windowMs: 60 * 60 * 1000,  max: 100 },   // 100 AI calls / hour
  'auth':          { windowMs: 15 * 60 * 1000,  max: 10  },   // 10 auth attempts / 15 min
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(userId: string, action: string): RateLimitResult {
  const cfg = LIMITS[action] ?? { windowMs: 60_000, max: 30 }
  const key = `${userId}:${action}`
  const now = Date.now()

  let entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + cfg.windowMs }
  }

  entry.count++
  store.set(key, entry)

  // Cleanup old entries every 1000 checks
  if (store.size > 1000) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt < now) store.delete(k)
    }
  }

  return {
    ok: entry.count <= cfg.max,
    remaining: Math.max(0, cfg.max - entry.count),
    resetAt: entry.resetAt,
  }
}

// Helper for Next.js API routes
export function rateLimitResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({ error: 'Too many requests', resetAt: result.resetAt }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
    }
  )
}
