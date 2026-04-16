'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { subscribeToLeads, getPosts, updateLead, updatePost } from '@/lib/db'
import type { Lead, Post, LeadStatus, PostStatus, FacebookGroup } from '@/types'

// ========== LEADS HOOK ==========

export function useLeads(userId: string | null) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      void Promise.resolve().then(() => setLoading(false))
      return
    }

    const unsub = subscribeToLeads(userId, (incoming) => {
      setLeads(incoming)
      setLoading(false)
    })

    return unsub
  }, [userId])

  const updateStatus = useCallback(async (leadId: string, status: LeadStatus) => {
    let previous: LeadStatus | null = null
    setLeads((prev) => {
      const lead = prev.find((l) => l.id === leadId)
      previous = lead?.status ?? null
      return prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    })
    try {
      await updateLead(leadId, { status })
    } catch (e) {
      console.error('updateLead', e)
      if (previous !== null) {
        const revert = previous
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: revert } : l)))
      }
    }
  }, [])

  const stats = {
    total: leads.length,
    byStatus: {
      new: leads.filter((l) => l.status === 'new').length,
      contacted: leads.filter((l) => l.status === 'contacted').length,
      qualified: leads.filter((l) => l.status === 'qualified').length,
      converted: leads.filter((l) => l.status === 'converted').length,
      lost: leads.filter((l) => l.status === 'lost').length,
    },
    avgScore: leads.length
      ? Math.round(leads.reduce((s, l) => s + l.qualityScore, 0) / leads.length)
      : 0,
    bySource: leads.reduce(
      (acc, l) => {
        acc[l.source] = (acc[l.source] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
  }

  return { leads, loading, updateStatus, stats }
}

// ========== POSTS HOOK ==========

export function usePosts(userId: string | null) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getPosts(userId, 50)
      setPosts(data)
    } catch (e) {
      console.error('getPosts', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setPosts([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const data = await getPosts(userId, 50)
        if (!cancelled) setPosts(data)
      } catch (e) {
        console.error('getPosts', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const cancelPost = useCallback(async (postId: string) => {
    try {
      await updatePost(postId, { status: 'paused' })
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: 'paused' as PostStatus } : p))
      )
    } catch (e) {
      console.error('updatePost', e)
    }
  }, [])

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    failed: posts.filter((p) => p.status === 'failed').length,
    totalGroups: posts.reduce((s, p) => s + p.groupIds.length, 0),
  }

  return { posts, loading, fetchPosts, cancelPost, stats }
}

// ========== SCRAPER HOOK ==========

export function useScraper(userId: string | null, vertical: string) {
  const [running, setRunning] = useState(false)
  const [lastCount, setLastCount] = useState<number | null>(null)
  const busy = useRef(false)

  const run = useCallback(
    async (keywords: string[]) => {
      if (!userId || busy.current) return
      busy.current = true
      setRunning(true)
      try {
        const res = await fetch('/api/leads/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId, vertical, keywords }),
        })
        const data = await res.json()
        setLastCount(data.count ?? 0)
      } finally {
        busy.current = false
        setRunning(false)
      }
    },
    [userId, vertical]
  )

  return { run, running, lastCount }
}

// ========== FACEBOOK GROUPS HOOK ==========

function normalizeFacebookGroups(raw: unknown): FacebookGroup[] {
  const arr = Array.isArray(raw) ? raw : []
  return arr.map((g) => {
    const o = g as Partial<FacebookGroup> & { id: string; name: string }
    return {
      id: o.id,
      name: o.name,
      memberCount: o.memberCount,
      privacy: o.privacy ?? 'CLOSED',
      isSelected: o.isSelected ?? false,
    }
  })
}

export function useFacebookGroups(userId: string | null) {
  const [groups, setGroups] = useState<FacebookGroup[]>([])
  const [syncing, setSyncing] = useState(false)

  const syncGroups = useCallback(
    async (options?: { forceRefresh?: boolean; silent?: boolean }) => {
      if (!userId) return
      const forceRefresh = options?.forceRefresh ?? true
      const silent = options?.silent ?? false
      if (!silent) setSyncing(true)
      try {
        const q = new URLSearchParams({ userId })
        if (forceRefresh) q.set('forceRefresh', '1')
        const res = await fetch(`/api/facebook/groups?${q.toString()}`, {
          credentials: 'include',
        })
        const data = await res.json()
        setGroups(normalizeFacebookGroups(data.groups))
      } catch (e) {
        console.error('syncGroups', e)
      } finally {
        if (!silent) setSyncing(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    if (!userId) {
      setGroups([])
      return
    }
    void syncGroups({ forceRefresh: false, silent: true })
  }, [userId, syncGroups])

  const toggleGroup = useCallback(async (groupId: string, selected: boolean) => {
    let prevSnapshot: FacebookGroup[] = []
    setGroups((prev) => {
      prevSnapshot = prev
      return prev.map((g) => (g.id === groupId ? { ...g, isSelected: selected } : g))
    })
    try {
      const res = await fetch('/api/facebook/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, groupId, selected }),
      })
      if (!res.ok) setGroups(prevSnapshot)
    } catch (e) {
      console.error('toggleGroup', e)
      setGroups(prevSnapshot)
    }
  }, [userId])

  return { groups, syncing, syncGroups, toggleGroup }
}
