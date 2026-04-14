/** Shared billing plan config (kept out of `route.ts` — Route files may only export HTTP handlers). */

export const PLAN_PRICES: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
}

export const PLAN_LIMITS = {
  free: { postsPerDay: 3, leadsPerMonth: 20, groups: 5 },
  basic: { postsPerDay: 10, leadsPerMonth: 100, groups: 15 },
  pro: { postsPerDay: 30, leadsPerMonth: 500, groups: 50 },
  enterprise: { postsPerDay: 100, leadsPerMonth: 9999, groups: 200 },
} as const
