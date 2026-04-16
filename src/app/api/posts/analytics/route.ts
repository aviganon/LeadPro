import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getPostInsights } from '@/lib/facebook'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { getFacebookAccessTokenForUser } from '@/lib/fbAccessToken'
import { verifyApiAuth, requireMatchingUser } from '@/lib/apiAuth'

// POST /api/posts/analytics
// Fetches insights for all published posts of a user and updates Firestore
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyApiAuth(req)
    if (!auth.ok) return auth.response

    const { userId } = await req.json()
    const own = requireMatchingUser(auth.uid, typeof userId === 'string' ? userId : null)
    if (!own.ok) return own.response

    const tokenData = await getFacebookAccessTokenForUser(userId)
    if (!tokenData) return NextResponse.json({ error: 'Not connected' }, { status: 401 })
    const { accessToken } = tokenData

    const db = getAdminFirestore()
    const postsSnap = await db
      .collection('posts')
      .where('userId', '==', userId)
      .where('status', '==', 'published')
      .get()

    const results = []
    for (const postDoc of postsSnap.docs) {
      const post = postDoc.data()
      const fbPostIds = post.facebookPostIds as Record<string, string>

      let totalReactions = 0
      let totalComments = 0
      let totalShares = 0

      for (const [, fbPostId] of Object.entries(fbPostIds ?? {})) {
        const insights = await getPostInsights(accessToken, fbPostId)
        totalReactions += insights.reactions
        totalComments += insights.comments
        totalShares += insights.shares
      }

      await postDoc.ref.update({
        analytics: { reactions: totalReactions, comments: totalComments, shares: totalShares },
        analyticsUpdatedAt: FieldValue.serverTimestamp(),
      })

      results.push({ postId: postDoc.id, reactions: totalReactions, comments: totalComments, shares: totalShares })
    }

    return NextResponse.json({ success: true, updated: results.length, results })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
