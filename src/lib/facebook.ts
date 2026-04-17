// Facebook Graph API v19 integration
// Handles OAuth, group fetching, and post publishing

const FB_API_VERSION = 'v19.0'
const FB_BASE = `https://graph.facebook.com/${FB_API_VERSION}`

/** App ID from env (trimmed, בלי מרכאות). בדפדפן — רק NEXT_PUBLIC_* נטען בצד לקוח אחרי build. */
export function getFacebookAppId(): string {
  let raw = (process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? '').trim()
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim()
  }
  return raw
}

/**
 * App ID מ-Settings → Basic ב-Meta for Developers — בדרך כלל 15–17 ספרות (מספר בלבד).
 * לא להדביק כאן App Secret (מחרוזת ארוכה עם אותיות), ולא מזהה אפליקציה של אינסטגרם/מוצר אחר.
 */
export function isValidFacebookAppId(id: string): boolean {
  if (!/^\d{13,18}$/.test(id)) return false
  // סדרות כמו 000… או 111… — כמעט תמיד טעות
  if (/^(\d)\1{12,}$/.test(id)) return false
  return true
}

// ========== OAUTH ==========

export function getFacebookAuthUrl(redirectUri: string, userId: string): string {
  const params = new URLSearchParams({
    client_id: getFacebookAppId(),
    redirect_uri: redirectUri,
    scope: [
      'publish_to_groups',
      'groups_access_member_info',
      'email',
      'public_profile',
    ].join(','),
    state: userId,          // passed back after auth, used to link to our user
    response_type: 'code',
  })
  return `https://www.facebook.com/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    client_id: getFacebookAppId(),
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  })
  const res = await fetch(`${FB_BASE}/oauth/access_token?${params.toString()}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { accessToken: data.access_token, expiresIn: data.expires_in }
}

export async function getLongLivedToken(shortToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: getFacebookAppId(),
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    fb_exchange_token: shortToken,
  })
  const res = await fetch(`${FB_BASE}/oauth/access_token?${params.toString()}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { accessToken: data.access_token, expiresIn: data.expires_in }
}

// ========== USER INFO ==========

export async function getFacebookUserInfo(accessToken: string): Promise<{ id: string; name: string; email?: string }> {
  const res = await fetch(`${FB_BASE}/me?fields=id,name,email&access_token=${accessToken}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// ========== GROUPS ==========

export interface FBGroup {
  id: string
  name: string
  member_count?: number
  privacy: string
}

export async function getUserGroups(accessToken: string): Promise<FBGroup[]> {
  const groups: FBGroup[] = []
  let url = `${FB_BASE}/me/groups?fields=id,name,member_count,privacy&limit=100&access_token=${accessToken}`

  // paginate through all groups
  while (url) {
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    groups.push(...(data.data ?? []))
    url = data.paging?.next ?? null
  }

  return groups
}

// ========== PUBLISHING ==========

export interface PublishResult {
  groupId: string
  success: boolean
  fbPostId?: string
  error?: string
}

export async function publishToGroup(
  accessToken: string,
  groupId: string,
  message: string,
  linkUrl?: string
): Promise<PublishResult> {
  try {
    const body: Record<string, string> = {
      message,
      access_token: accessToken,
    }
    if (linkUrl) body.link = linkUrl

    const res = await fetch(`${FB_BASE}/${groupId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (data.error) {
      return { groupId, success: false, error: data.error.message }
    }
    return { groupId, success: true, fbPostId: data.id }
  } catch (err: unknown) {
    return { groupId, success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function publishToMultipleGroups(
  accessToken: string,
  groupIds: string[],
  message: string,
  delayMs = 3000     // delay between each post to avoid spam detection
): Promise<PublishResult[]> {
  const results: PublishResult[] = []

  for (const groupId of groupIds) {
    const result = await publishToGroup(accessToken, groupId, message)
    results.push(result)
    // random delay between posts: delayMs ± 50%
    const jitter = delayMs * (0.5 + Math.random())
    await new Promise(r => setTimeout(r, jitter))
  }

  return results
}

// ========== POST ANALYTICS ==========

export async function getPostInsights(
  accessToken: string,
  fbPostId: string
): Promise<{ reactions: number; comments: number; shares: number }> {
  try {
    const res = await fetch(
      `${FB_BASE}/${fbPostId}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${accessToken}`
    )
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return {
      reactions: data.reactions?.summary?.total_count ?? 0,
      comments: data.comments?.summary?.total_count ?? 0,
      shares: data.shares?.count ?? 0,
    }
  } catch {
    return { reactions: 0, comments: 0, shares: 0 }
  }
}

// ========== TOKEN VALIDATION ==========

export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${FB_BASE}/me?access_token=${accessToken}`)
    const data = await res.json()
    return !data.error
  } catch {
    return false
  }
}
