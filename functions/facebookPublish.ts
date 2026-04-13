const FB_API_VERSION = 'v19.0'
const FB_BASE = `https://graph.facebook.com/${FB_API_VERSION}`

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
  delayMs = 3000
): Promise<PublishResult[]> {
  const results: PublishResult[] = []

  for (const groupId of groupIds) {
    const result = await publishToGroup(accessToken, groupId, message)
    results.push(result)
    const jitter = delayMs * (0.5 + Math.random())
    await new Promise(r => setTimeout(r, jitter))
  }

  return results
}
