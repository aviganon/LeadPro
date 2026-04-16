// Rate limiting for API routes.
// When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses Upstash (serverless-safe).
// Otherwise falls back to an in-memory Map (single-instance only — dev / single Node).

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  windowMs: number
  max: number
}

const LIMITS: Record<string, RateLimitConfig> = {
  publish: { windowMs: 60 * 60 * 1000, max: 50 },
  scrape: { windowMs: 60 * 60 * 1000, max: 10 },
  'ai-generate': { windowMs: 60 * 60 * 1000, max: 100 },
  auth: { windowMs: 15 * 60 * 1000, max: 10 },
}

/** Sliding-window presets for Upstash (must align with LIMITS). */
const UPSTASH_SLIDING: Record<string, [number, string]> = {
  publish: [50, '1 h'],
  scrape: [10, '1 h'],
  'ai-generate': [100, '1 h'],
  auth: [10, '15 m'],
}

const distributedLimiters = new Map<string, Ratelimit>()

function getDistributedLimiter(action: string): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  if (!distributedLimiters.has(action)) {
    const redis = new Redis({ url, token })
    const [max, window] = UPSTASH_SLIDING[action] ?? [30, '1 m']
    distributedLimiters.set(
      action,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
        prefix: `apexleads:rl:${action}`,
      })
    )
  }
  return distributedLimiters.get(action) ?? null
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

/**
 * Distributed rate limit when Upstash env is configured; otherwise in-memory `rateLimit`.
 */
export async function rateLimitCheck(userId: string, action: string): Promise<RateLimitResult> {
  const distributed = getDistributedLimiter(action)
  if (distributed) {
    try {
      const result = await distributed.limit(userId)
      return {
        ok: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      }
    } catch (e) {
      console.error('rateLimitCheck Upstash error, falling back:', e)
    }
  }
  return rateLimit(userId, action)
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: 'Too many requests', resetAt: result.resetAt },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
        'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))),
      },
    }
  )
}
