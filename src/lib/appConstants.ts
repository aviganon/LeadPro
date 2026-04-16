/** Rate-limit action keys — keep in sync with `rateLimit.ts` LIMITS. */
export const RATE_LIMIT_ACTIONS = {
  PUBLISH: 'publish',
  SCRAPE: 'scrape',
  AI_GENERATE: 'ai-generate',
  AUTH: 'auth',
} as const

export type RateLimitAction = (typeof RATE_LIMIT_ACTIONS)[keyof typeof RATE_LIMIT_ACTIONS]

/** Debounce delay for lead search (ms). */
export const LEADS_SEARCH_DEBOUNCE_MS = 320

/** Max leads returned in CSV export. */
export const LEADS_EXPORT_MAX = 2000
