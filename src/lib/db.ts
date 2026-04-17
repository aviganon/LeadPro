import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, Timestamp,
  onSnapshot, addDoc, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type { User, Lead, Post, PostTemplate, FacebookGroup, UserStats, ScheduleConfig } from '@/types'

// ========== COLLECTIONS ==========
const USERS = 'users'
const LEADS = 'leads'
const POSTS = 'posts'
const TEMPLATES = 'templates'
const FB_TOKENS = 'fb_tokens'
const FB_GROUPS = 'fb_groups'
const USER_STATS = 'user_stats'
const SCHEDULE_CONFIGS = 'schedule_configs'

// ========== USERS ==========

export async function getUser(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, USERS, userId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as User
}

/**
 * יוצר מסמך משתמש רק אם אינו קיים — לא דורס role/plan (למשל admin) בכניסה חוזרת או הרשמה.
 */
export async function createUser(userId: string, data: Omit<User, 'id'>): Promise<void> {
  const ref = doc(db, USERS, userId)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, USERS, userId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(query(collection(db, USERS), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as User))
}

// ========== LEADS ==========

export async function createLead(data: Omit<Lead, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, LEADS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getLeads(userId: string, limitN = 50): Promise<Lead[]> {
  const snap = await getDocs(
    query(collection(db, LEADS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitN)
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead))
}

export async function updateLead(leadId: string, data: Partial<Lead>): Promise<void> {
  await updateDoc(doc(db, LEADS, leadId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export function subscribeToLeads(userId: string, callback: (leads: Lead[]) => void) {
  return onSnapshot(
    query(collection(db, LEADS), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(100)),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)))
  )
}

// ========== POSTS ==========

export async function createPost(data: Omit<Post, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, POSTS), {
    ...data,
    retryCount: 0,
    facebookPostIds: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getPosts(userId: string, limitN = 30): Promise<Post[]> {
  const snap = await getDocs(
    query(collection(db, POSTS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitN)
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Post))
}

export async function getScheduledPosts(): Promise<Post[]> {
  const now = Timestamp.now()
  const snap = await getDocs(
    query(collection(db, POSTS),
      where('status', '==', 'scheduled'),
      where('scheduledAt', '<=', now)
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Post))
}

export async function updatePost(postId: string, data: Partial<Post>): Promise<void> {
  await updateDoc(doc(db, POSTS, postId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// ========== TEMPLATES ==========

export async function getTemplates(userId: string): Promise<PostTemplate[]> {
  const snap = await getDocs(
    query(collection(db, TEMPLATES),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PostTemplate))
}

export async function createTemplate(data: Omit<PostTemplate, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, TEMPLATES), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

// ========== FACEBOOK GROUPS ==========

export async function saveFacebookGroups(userId: string, groups: FacebookGroup[]): Promise<void> {
  await setDoc(doc(db, FB_GROUPS, userId), {
    userId,
    groups,
    lastSynced: serverTimestamp(),
  })
}

export async function getFacebookGroups(userId: string): Promise<FacebookGroup[]> {
  const snap = await getDoc(doc(db, FB_GROUPS, userId))
  if (!snap.exists()) return []
  return snap.data().groups ?? []
}

export async function updateGroupSelection(userId: string, groupId: string, selected: boolean): Promise<void> {
  const groups = await getFacebookGroups(userId)
  const updated = groups.map(g => g.id === groupId ? { ...g, isSelected: selected } : g)
  await saveFacebookGroups(userId, updated)
}

// ========== USER STATS ==========

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const snap = await getDoc(doc(db, USER_STATS, userId))
  if (!snap.exists()) return null
  return snap.data() as UserStats
}

export async function incrementUserStat(userId: string, field: keyof UserStats, amount = 1): Promise<void> {
  const ref = doc(db, USER_STATS, userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { userId, [field]: amount, updatedAt: serverTimestamp() })
  } else {
    const current = (snap.data()[field] as number) ?? 0
    await updateDoc(ref, { [field]: current + amount, updatedAt: serverTimestamp() })
  }
}

// ========== SCHEDULE CONFIG ==========

export async function getScheduleConfig(userId: string): Promise<ScheduleConfig | null> {
  const snap = await getDoc(doc(db, SCHEDULE_CONFIGS, userId))
  if (!snap.exists()) return null
  return snap.data() as ScheduleConfig
}

export async function saveScheduleConfig(userId: string, config: Omit<ScheduleConfig, 'userId' | 'updatedAt'>): Promise<void> {
  await setDoc(doc(db, SCHEDULE_CONFIGS, userId), {
    ...config,
    userId,
    updatedAt: serverTimestamp(),
  })
}
