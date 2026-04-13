'use client'

import { useEffect, useState, useCallback } from 'react'
import { subscribeToLeads, getPosts, getLeads, updateLead, updatePost } from '@/lib/db'
import type { Lead, Post, LeadStatus, PostStatus } from '@/types'

// ========== LEADS HOOK ==========

export function useLeads(userId: string | null) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    const unsub = subscribeToLeads(userId, (incoming) => {
      setLeads(incoming)
      setLoading(false)
    })

    return unsub
  }, [userId])

  const updateStatus = useCallback(async (leadId: string, status: LeadStatus) => {
    await updateLead(leadId, { status })
  }, [])

  const stats = {
    total: leads.length,
    byStatus: {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      converted: leads.filter(l => l.status === 'converted').length,
      lost: leads.filter(l => l.status === 'lost').length,
    },
    avgScore: leads.length
      ? Math.round(leads.reduce((s, l) => s + l.qualityScore, 0) / leads.length)
      : 0,
    bySource: leads.reduce((acc, l) => {
      acc[l.source] = (acc[l.source] ?? 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  return { leads, loading, error, updateStatus, stats }
}

// ========== POSTS HOOK ==========

export function usePosts(userId: string | null) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const data = await getPosts(userId, 50)
    setPosts(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const cancelPost = useCallback(async (postId: string) => {
    await updatePost(postId, { status: 'paused' })
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'paused' as PostStatus } : p))
  }, [])

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    failed: posts.filter(p => p.status === 'failed').length,
    totalGroups: posts.reduce((s, p) => s + p.groupIds.length, 0),
  }

  return { posts, loading, fetchPosts, cancelPost, stats }
}

// ========== SCRAPER HOOK ==========

export function useScraper(userId: string | null, vertical: string) {
  const [running, setRunning] = useState(false)
  const [lastCount, setLastCount] = useState<number | null>(null)

  const run = useCallback(async (keywords: string[]) => {
    if (!userId || running) return
    setRunning(true)
    try {
      const res = await fetch('/api/leads/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, vertical, keywords }),
      })
      const data = await res.json()
      setLastCount(data.count ?? 0)
    } finally {
      setRunning(false)
    }
  }, [userId, vertical, running])

  return { run, running, lastCount }
}

// ========== FACEBOOK GROUPS HOOK ==========

export function useFacebookGroups(userId: string | null) {
  const [groups, setGroups] = useState<{ id: string; name: string; memberCount?: number; isSelected: boolean }[]>([])
  const [syncing, setSyncing] = useState(false)

  const syncGroups = useCallback(async () => {
    if (!userId) return
    setSyncing(true)
    try {
      const res = await fetch(`/api/facebook/groups?userId=${userId}`)
      const data = await res.json()
      setGroups(data.groups ?? [])
    } finally {
      setSyncing(false)
    }
  }, [userId])

  const toggleGroup = useCallback(async (groupId: string, selected: boolean) => {
    await fetch('/api/facebook/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, groupId, selected }),
    })
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isSelected: selected } : g))
  }, [userId])

  return { groups, syncing, syncGroups, toggleGroup }
}
