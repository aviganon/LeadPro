import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { publishToMultipleGroups } from './facebookPublish'
import { decryptToken } from './tokenCrypto'

admin.initializeApp()
const db = admin.firestore()

async function resolveFacebookAccessToken(data: admin.firestore.DocumentData): Promise<string> {
  let accessToken = data.accessToken as string
  if (data.tokenEncrypted === true) {
    accessToken = await decryptToken(accessToken)
  }
  return accessToken
}

// ========== SCHEDULED POST PROCESSOR ==========

export const processScheduledPosts = functions
  .region('europe-west1')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now()

    const snapshot = await db
      .collection('posts')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now)
      .limit(20)
      .get()

    if (snapshot.empty) return null

    const batch = db.batch()
    const promises: Promise<void>[] = []

    for (const postDoc of snapshot.docs) {
      const post = postDoc.data()

      batch.update(postDoc.ref, { status: 'queued', updatedAt: now })

      promises.push(publishPost(postDoc.id, post))
    }

    await batch.commit()
    await Promise.allSettled(promises)
    return null
  })

async function publishPost(postId: string, post: admin.firestore.DocumentData) {
  const { userId, body, groupIds } = post

  const tokenDoc = await db.doc(`fb_tokens/${userId}`).get()
  if (!tokenDoc.exists) {
    await db.doc(`posts/${postId}`).update({
      status: 'failed',
      failedReason: 'No Facebook token',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return
  }

  const tokenData = tokenDoc.data()!
  let accessToken: string
  try {
    accessToken = await resolveFacebookAccessToken(tokenData)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Token decrypt failed'
    await db.doc(`posts/${postId}`).update({
      status: 'failed',
      failedReason: msg,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return
  }

  const { tokenExpiry } = tokenData

  if (tokenExpiry && tokenExpiry.toDate() < new Date()) {
    await db.doc(`posts/${postId}`).update({
      status: 'failed',
      failedReason: 'Facebook token expired',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    await notifyTokenExpired(userId)
    return
  }

  const configDoc = await db.doc(`schedule_configs/${userId}`).get()
  const config = configDoc.exists ? configDoc.data()! : { minDelayMinutes: 2, maxDelayMinutes: 8 }
  const delayMs =
    (config.minDelayMinutes + Math.random() * (config.maxDelayMinutes - config.minDelayMinutes)) *
    60 *
    1000

  try {
    const results = await publishToMultipleGroups(accessToken, groupIds, body, delayMs / groupIds.length)

    const published: Record<string, string> = {}
    const failures: string[] = []

    for (const r of results) {
      if (r.success && r.fbPostId) {
        published[r.groupId] = r.fbPostId
      } else {
        failures.push(`${r.groupId}: ${r.error}`)
      }
    }

    const allFailed = Object.keys(published).length === 0

    await db.doc(`posts/${postId}`).update({
      status: allFailed ? 'failed' : 'published',
      facebookPostIds: published,
      publishedAt: allFailed ? null : admin.firestore.FieldValue.serverTimestamp(),
      failedReason: allFailed ? failures.join('; ') : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (!allFailed) {
      const statsRef = db.doc(`user_stats/${userId}`)
      await statsRef.set(
        {
          totalPosts: admin.firestore.FieldValue.increment(1),
          postsThisMonth: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    await db.collection('audit_log').add({
      userId,
      action: 'post_published',
      postId,
      groupCount: Object.keys(published).length,
      failCount: failures.length,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await db.doc(`posts/${postId}`).update({
      status: 'failed',
      failedReason: msg,
      retryCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  }
}

// ========== TOKEN EXPIRY CHECKER ==========

export const checkTokenExpiry = functions
  .region('europe-west1')
  .pubsub.schedule('every day 09:00')
  .onRun(async () => {
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const snapshot = await db
      .collection('fb_tokens')
      .where('tokenExpiry', '<=', admin.firestore.Timestamp.fromDate(sevenDays))
      .get()

    for (const doc of snapshot.docs) {
      await notifyTokenExpired(doc.data().userId)
    }
    return null
  })

// ========== LEAD SCRAPER CRON ==========

export const runLeadScrapers = functions
  .region('europe-west1')
  .pubsub.schedule('every 6 hours')
  .onRun(async () => {
    const usersSnap = await db.collection('users').where('isActive', '==', true).get()

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data()
      await db.collection('scraper_tasks').add({
        userId: userDoc.id,
        vertical: user.vertical,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
    return null
  })

// ========== HELPERS ==========

async function notifyTokenExpired(userId: string) {
  const userDoc = await db.doc(`users/${userId}`).get()
  if (!userDoc.exists) return
  await db.collection('notifications').add({
    userId,
    type: 'token_expiry',
    message: 'חשבון הפייסבוק שלך עומד לפוג — התחבר מחדש',
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}
