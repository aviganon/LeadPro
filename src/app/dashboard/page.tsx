'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLeads, usePosts, useScraper, useFacebookGroups } from '@/hooks/useLeads'
import { renderTemplate, DEFAULT_TEMPLATES, VERTICAL_CONFIG } from '@/lib/templates'
import type { LeadStatus, PostStatus } from '@/types'
import {
  Target, LayoutDashboard, Users, Megaphone, Settings, Bell, LogOut,
  Plus, RefreshCw, Calendar, X, CheckCircle, AlertTriangle, Clock,
  Sparkles, Send, ChevronDown, Search,
  MoreHorizontal, Zap, Globe, TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AdminSettingsPanel } from '@/components/AdminSettingsPanel'

function FBIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}

type Tab = 'overview' | 'leads' | 'posts' | 'groups' | 'compose' | 'settings'

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  qualified: 'מסונן',
  converted: 'המרה',
  lost: 'לא רלוונטי',
}

const LEAD_STATUS_STYLE: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'חדש', color: 'text-primary', bg: 'bg-primary/10' },
  contacted: { label: 'נוצר קשר', color: 'text-warning', bg: 'bg-warning/10' },
  qualified: { label: 'מסונן', color: 'text-accent', bg: 'bg-accent/10' },
  converted: { label: 'המרה', color: 'text-success', bg: 'bg-success/10' },
  lost: { label: 'לא רלוונטי', color: 'text-muted-foreground', bg: 'bg-muted' },
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'סקירה', icon: LayoutDashboard },
  { id: 'leads', label: 'לידים', icon: Users },
  { id: 'posts', label: 'פרסומים', icon: Megaphone },
  { id: 'groups', label: 'קבוצות', icon: Globe },
  { id: 'compose', label: 'פרסום חדש', icon: Send },
  { id: 'settings', label: 'הגדרות', icon: Settings },
]

const tabTitles: Record<Tab, string> = {
  overview: 'סקירה כללית',
  leads: 'ניהול לידים',
  posts: 'פרסומים',
  groups: 'קבוצות פייסבוק',
  compose: 'פרסום חדש',
  settings: 'הגדרות',
}

function Sidebar({
  activeTab,
  setActiveTab,
  fbConnected,
  onConnectFacebook,
  onLogout,
  userName,
  userEmail,
  verticalLabel,
  newLeadsCount,
}: {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  fbConnected: boolean
  onConnectFacebook: () => void
  onLogout: () => void
  userName: string
  userEmail: string
  verticalLabel: string
  newLeadsCount: number
}) {
  const initial = (userName || userEmail || '?')[0]

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed right-0 top-0 z-50 border-l border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg">LeadPro</div>
            <div className="text-xs text-sidebar-foreground/60">{verticalLabel}</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-right',
              activeTab === item.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.id === 'leads' && newLeadsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                {newLeadsCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {fbConnected ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success/10 text-success">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">מחובר לפייסבוק</span>
          </div>
        ) : (
          <Button
            type="button"
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
            onClick={onConnectFacebook}
          >
            <FBIcon size={18} className="ml-2" />
            חבר פייסבוק
          </Button>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-white font-bold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{userName || 'משתמש'}</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-lg hover:bg-sidebar-accent/50 shrink-0"
            aria-label="התנתקות"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function TopBar({ title, userInitial }: { title: string; userInitial: string }) {
  return (
    <div className="h-16 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <button type="button" className="p-2 rounded-lg hover:bg-muted relative" aria-label="התראות">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" aria-hidden />
        </button>
        <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm">
          {userInitial}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  trend?: number
  color: string
}) {
  return (
    <Card className="hover-lift border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
            {trend !== undefined && (
              <div
                className={cn(
                  'mt-3 flex items-center gap-1 text-sm',
                  trend >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                <TrendingUp className={cn('w-4 h-4', trend < 0 && 'rotate-180')} />
                {Math.abs(trend)}% מהשבוע שעבר
              </div>
            )}
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', color)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, logOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [notice, setNotice] = useState('')

  const { leads, loading: leadsLoading, stats: leadStats, updateStatus } = useLeads(user?.id ?? null)
  const { posts, loading: postsLoading, stats: postStats, cancelPost, fetchPosts } = usePosts(user?.id ?? null)
  const { run: runScraper, running: scraperRunning, lastCount } = useScraper(
    user?.id ?? null,
    user?.vertical ?? 'general'
  )
  const { groups, syncing, syncGroups, toggleGroup } = useFacebookGroups(user?.id ?? null)

  const [postBody, setPostBody] = useState('')
  const [selGroups, setSelGroups] = useState<string[]>([])
  const [schedAt, setSchedAt] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [pubResult, setPubResult] = useState<{ published: number; failed: number } | null>(null)
  const [aiGen, setAiGen] = useState(false)

  const vertCfg = VERTICAL_CONFIG[user?.vertical ?? 'general']
  const selectedGroups = groups.filter((g) => g.isSelected)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth')
    const p = new URLSearchParams(window.location.search)
    if (p.get('fb_connected') === '1') setNotice('✅ פייסבוק חובר בהצלחה!')
    if (p.get('fb_error')) setNotice('❌ שגיאה בחיבור פייסבוק')
    if (p.get('upgrade') === 'success') setNotice('🎉 שדרוג הצליח!')
    window.history.replaceState({}, '', '/dashboard')
  }, [authLoading, user, router])

  function connectFacebook() {
    if (!user) return
    const ru = encodeURIComponent(`${window.location.origin}/api/facebook/callback`)
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? ''
    window.location.href = `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${ru}&scope=publish_to_groups,groups_access_member_info,email,public_profile&state=${user.id}&response_type=code`
  }

  async function handlePublish() {
    if (!user || !postBody.trim()) return
    setPublishing(true)
    setPubResult(null)
    try {
      const res = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          body: postBody,
          groupIds: selGroups,
          scheduledAt: schedAt || undefined,
        }),
      })
      const data = await res.json()
      setPubResult({ published: data.published ?? 0, failed: data.failed ?? 0 })
      if (data.success) {
        setPostBody('')
        setSchedAt('')
      }
      fetchPosts()
    } finally {
      setPublishing(false)
    }
  }

  async function handleAiGenerate() {
    if (!user) return
    setAiGen(true)
    try {
      const cfg = VERTICAL_CONFIG[user.vertical ?? 'general']
      const res = await fetch('/api/ai/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `כתוב פוסט קצר ומזמין בעברית (עד 120 מילים) לפרסום בקבוצת פייסבוק בתחום ${cfg?.label ?? 'כללי'}. כלול קריאה לפעולה ואמוג'י. ללא כותרת.`,
        }),
      })
      const data = await res.json()
      if (data.text) setPostBody(data.text)
    } finally {
      setAiGen(false)
    }
  }

  function applyTemplate(i: number) {
    const t = DEFAULT_TEMPLATES[i]
    if (!t || !user) return
    setPostBody(
      renderTemplate(t.bodyTemplate, {
        agentName: user.name ?? '',
        phone: '',
        city: '',
        area: '',
        carModel: '',
        dealerName: user.name ?? '',
      })
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        טוען...
      </div>
    )
  }

  if (!user) return null

  const userInitial = (user.name ?? user.email ?? '?')[0]

  const postStatusUi = (status: PostStatus) => {
    const map: Record<PostStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
      published: { label: 'פורסם', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle },
      scheduled: { label: 'מתוזמן', color: 'text-primary', bg: 'bg-primary/10', icon: Clock },
      queued: { label: 'בתור', color: 'text-primary', bg: 'bg-primary/10', icon: Clock },
      failed: { label: 'נכשל', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
      draft: { label: 'טיוטה', color: 'text-muted-foreground', bg: 'bg-muted', icon: MoreHorizontal },
      paused: { label: 'מושהה', color: 'text-muted-foreground', bg: 'bg-muted', icon: AlertTriangle },
    }
    return map[status]
  }

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <Sidebar
        activeTab={tab}
        setActiveTab={setTab}
        fbConnected={!!user.facebookConnected}
        onConnectFacebook={connectFacebook}
        onLogout={() => void logOut()}
        userName={user.name ?? ''}
        userEmail={user.email ?? ''}
        verticalLabel={vertCfg ? `${vertCfg.emoji} ${vertCfg.label}` : 'כללי'}
        newLeadsCount={leadStats.byStatus.new}
      />

      <div className="pe-64 min-h-screen">
        <TopBar title={tabTitles[tab]} userInitial={userInitial} />

        {notice && (
          <div className="px-6 py-3 bg-primary/10 text-primary text-sm flex justify-between items-center border-b border-border">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} className="p-1 rounded hover:bg-primary/20" aria-label="סגור">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="p-6">
          {tab === 'overview' && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="לידים"
                  value={leadStats.total}
                  subtitle={`${leadStats.byStatus.new} חדשים`}
                  icon={Users}
                  color="bg-primary/10 text-primary"
                />
                <StatCard
                  title="ציון ממוצע"
                  value={leadStats.avgScore || '—'}
                  subtitle="איכות לידים"
                  icon={Zap}
                  color="bg-warning/10 text-warning"
                />
                <StatCard
                  title="פרסומים"
                  value={postStats.total}
                  subtitle={`${postStats.published} פורסמו`}
                  icon={Megaphone}
                  color="bg-accent/10 text-accent"
                />
                <StatCard
                  title="קבוצות פעילות"
                  value={selectedGroups.length}
                  subtitle={`מתוך ${groups.length}`}
                  icon={Globe}
                  color="bg-success/10 text-success"
                />
              </div>

              <Card className="border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">לידים אחרונים</CardTitle>
                    <CardDescription>לידים שהתקבלו היום</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setTab('leads')}>
                    כל הלידים
                    <ChevronDown className="w-4 h-4 mr-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <p className="text-muted-foreground text-sm">טוען...</p>
                  ) : leads.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">אין לידים עדיין</p>
                  ) : (
                    <div className="space-y-3">
                      {leads.slice(0, 5).map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm',
                              lead.qualityScore >= 90
                                ? 'bg-success/10 text-success'
                                : lead.qualityScore >= 80
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-warning/10 text-warning'
                            )}
                          >
                            {lead.qualityScore}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{lead.notes.slice(0, 80)}</p>
                            <p className="text-sm text-muted-foreground">{lead.source}</p>
                          </div>
                          <span
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-medium',
                              LEAD_STATUS_STYLE[lead.status].bg,
                              LEAD_STATUS_STYLE[lead.status].color
                            )}
                          >
                            {LEAD_STATUS_STYLE[lead.status].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className="border-0 shadow-md hover-lift cursor-pointer group"
                  onClick={() => runScraper(vertCfg?.keywords ?? [])}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <RefreshCw className={cn('w-6 h-6', scraperRunning && 'animate-spin')} />
                    </div>
                    <div>
                      <h3 className="font-semibold">אסוף לידים</h3>
                      <p className="text-sm text-muted-foreground">
                        {scraperRunning ? 'אוסף...' : 'סרוק מקורות חדשים'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className="border-0 shadow-md hover-lift cursor-pointer group"
                  onClick={() => {
                    setTab('compose')
                    void handleAiGenerate()
                  }}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">צור תוכן AI</h3>
                      <p className="text-sm text-muted-foreground">פוסט חדש עם AI</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md hover-lift cursor-pointer group" onClick={() => setTab('compose')}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Send className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">פרסם עכשיו</h3>
                      <p className="text-sm text-muted-foreground">שלח לקבוצות</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {lastCount !== null && (
                <p className="text-sm text-success text-center">נוספו {lastCount} לידים</p>
              )}
            </div>
          )}

          {tab === 'leads' && (
            <LeadsPanel
              leads={leads}
              leadsLoading={leadsLoading}
              leadStats={leadStats}
              scraperRunning={scraperRunning}
              lastCount={lastCount}
              updateStatus={updateStatus}
              onRunScraper={() => runScraper(vertCfg?.keywords ?? [])}
            />
          )}

          {tab === 'posts' && (
            <PostsPanel
              posts={posts}
              postsLoading={postsLoading}
              postStats={postStats}
              cancelPost={cancelPost}
              postStatusUi={postStatusUi}
              onNewPost={() => setTab('compose')}
            />
          )}

          {tab === 'groups' && (
            <GroupsPanel
              groups={groups}
              selectedCount={selectedGroups.length}
              syncing={syncing}
              fbConnected={!!user.facebookConnected}
              onSync={syncGroups}
              onToggle={toggleGroup}
            />
          )}

          {tab === 'compose' && (
            <ComposePanel
              postBody={postBody}
              setPostBody={setPostBody}
              selGroups={selGroups}
              setSelGroups={setSelGroups}
              groups={groups}
              user={user}
              publishing={publishing}
              aiGen={aiGen}
              schedAt={schedAt}
              setSchedAt={setSchedAt}
              pubResult={pubResult}
              applyTemplate={applyTemplate}
              onAi={handleAiGenerate}
              onPublish={handlePublish}
            />
          )}

          {tab === 'settings' && (
            <div className="max-w-2xl space-y-6 animate-slide-up">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>פרופיל</CardTitle>
                  <CardDescription>פרטי החשבון מ-Firestore</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">שם</label>
                      <Input readOnly value={user.name ?? ''} className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">אימייל</label>
                      <Input readOnly value={user.email ?? ''} className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">תפקיד</label>
                      <Input
                        readOnly
                        value={user.role === 'admin' ? 'מנהל' : 'משתמש'}
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    לשינוי פרטים יש להוסיף זרימת עריכה (עדיין לא מחוברת).
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>תוכנית</CardTitle>
                  <CardDescription>שדרוג ב-Stripe</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border-2 border-primary/30">
                    <div>
                      <div className="font-semibold text-lg">{user.plan ?? 'free'}</div>
                      <div className="text-sm text-muted-foreground">מגבלות לפי תוכנית</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/pricing">שדרג תוכנית</Link>
                  </Button>
                </CardContent>
              </Card>
              {user.role === 'admin' && <AdminSettingsPanel />}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function LeadsPanel({
  leads,
  leadsLoading,
  leadStats,
  scraperRunning,
  lastCount,
  updateStatus,
  onRunScraper,
}: {
  leads: import('@/types').Lead[]
  leadsLoading: boolean
  leadStats: ReturnType<typeof useLeads>['stats']
  scraperRunning: boolean
  lastCount: number | null
  updateStatus: (id: string, s: LeadStatus) => void
  onRunScraper: () => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')

  const filtered = leads.filter((lead) => {
    const okSearch = lead.notes.toLowerCase().includes(searchTerm.toLowerCase())
    const okStatus = statusFilter === 'all' || lead.status === statusFilter
    return okSearch && okStatus
  })

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ניהול לידים</h2>
          <p className="text-muted-foreground text-sm">
            {leadStats.total} לידים · {leadStats.byStatus.new} חדשים · {leadStats.byStatus.converted} המרות
          </p>
        </div>
        <Button type="button" className="btn-shimmer" disabled={scraperRunning} onClick={onRunScraper}>
          <RefreshCw className={cn('w-4 h-4 ml-2', scraperRunning && 'animate-spin')} />
          {scraperRunning ? 'אוסף...' : 'אסוף לידים'}
        </Button>
      </div>
      {lastCount !== null && (
        <p className="text-sm text-success">✅ {lastCount} לידים חדשים נוספו</p>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חפש לידים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            )}
          >
            הכל
          </button>
          {(Object.keys(LEAD_STATUS_STYLE) as LeadStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                statusFilter === st ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              )}
            >
              {LEAD_STATUS_STYLE[st].label}
            </button>
          ))}
        </div>
      </div>

      {leadsLoading ? (
        <p className="text-center text-muted-foreground py-12">טוען...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">אין תוצאות</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead, index) => (
            <Card key={lead.id} className="border-0 shadow-sm hover-lift" style={{ animationDelay: `${index * 0.03}s` }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg',
                      lead.qualityScore >= 90
                        ? 'bg-success/10 text-success'
                        : lead.qualityScore >= 80
                          ? 'bg-primary/10 text-primary'
                          : lead.qualityScore >= 60
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {lead.qualityScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-lg leading-snug">{lead.notes}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted">{lead.source}</span>
                      <span>{lead.vertical}</span>
                    </div>
                  </div>
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium border border-border bg-background cursor-pointer',
                      LEAD_STATUS_STYLE[lead.status].bg,
                      LEAD_STATUS_STYLE[lead.status].color
                    )}
                  >
                    {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((v) => (
                      <option key={v} value={v}>
                        {STATUS_LABEL[v]}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function PostsPanel({
  posts,
  postsLoading,
  postStats,
  cancelPost,
  postStatusUi,
  onNewPost,
}: {
  posts: import('@/types').Post[]
  postsLoading: boolean
  postStats: ReturnType<typeof usePosts>['stats']
  cancelPost: (id: string) => void
  postStatusUi: (s: PostStatus) => { label: string; color: string; bg: string; icon: React.ElementType }
  onNewPost: () => void
}) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="px-4 py-2 rounded-lg bg-success/10 text-success font-medium">{postStats.published} פורסמו</div>
        <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">{postStats.scheduled} מתוזמנים</div>
        {postStats.failed > 0 && (
          <div className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive font-medium">{postStats.failed} נכשלו</div>
        )}
        <Button type="button" className="ms-auto btn-shimmer" onClick={onNewPost}>
          <Plus className="w-4 h-4 ml-2" />
          פרסום חדש
        </Button>
      </div>

      {postsLoading ? (
        <p className="text-center text-muted-foreground py-12">טוען...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">אין פרסומים עדיין</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => {
            const cfg = postStatusUi(post.status)
            const Icon = cfg.icon
            return (
              <Card key={post.id} className="border-0 shadow-sm hover-lift" style={{ animationDelay: `${index * 0.05}s` }}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg, cfg.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg leading-relaxed line-clamp-3">{post.body}</p>
                      <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground flex-wrap">
                        <span>{post.groupIds.length} קבוצות</span>
                        {post.scheduledAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.scheduledAt).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('px-3 py-1 rounded-full text-xs font-medium', cfg.bg, cfg.color)}>{cfg.label}</span>
                      {(post.status === 'scheduled' || post.status === 'queued') && (
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-muted"
                          onClick={() => cancelPost(post.id)}
                          aria-label="בטל"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GroupsPanel({
  groups,
  selectedCount,
  syncing,
  fbConnected,
  onSync,
  onToggle,
}: {
  groups: import('@/types').FacebookGroup[]
  selectedCount: number
  syncing: boolean
  fbConnected: boolean
  onSync: () => void
  onToggle: (id: string, v: boolean) => void
}) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold">קבוצות פייסבוק</h2>
          <p className="text-muted-foreground text-sm">
            {selectedCount} נבחרו מתוך {groups.length}
          </p>
        </div>
        <Button type="button" variant="outline" disabled={syncing || !fbConnected} onClick={onSync}>
          <RefreshCw className={cn('w-4 h-4 ml-2', syncing && 'animate-spin')} />
          {syncing ? 'מסנכרן...' : 'סנכרן'}
        </Button>
      </div>
      {!fbConnected && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 text-warning px-4 py-3 text-sm">
          חבר פייסבוק מהסרגל כדי לסנכרן קבוצות
        </div>
      )}
      <div className="grid gap-4">
        {groups.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">לחץ &quot;סנכרן&quot; כדי לטעון קבוצות</p>
        ) : (
          groups.map((group, index) => (
            <Card
              key={group.id}
              role="button"
              tabIndex={0}
              onClick={() => onToggle(group.id, !group.isSelected)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggle(group.id, !group.isSelected)
                }
              }}
              className={cn(
                'border-2 transition-all cursor-pointer hover-lift',
                group.isSelected ? 'border-primary bg-primary/5' : 'border-transparent'
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      group.isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {group.isSelected ? <CheckCircle className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.memberCount != null ? group.memberCount.toLocaleString() : '—'} חברים
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function ComposePanel({
  postBody,
  setPostBody,
  selGroups,
  setSelGroups,
  groups,
  user,
  publishing,
  aiGen,
  schedAt,
  setSchedAt,
  pubResult,
  applyTemplate,
  onAi,
  onPublish,
}: {
  postBody: string
  setPostBody: (s: string) => void
  selGroups: string[]
  setSelGroups: (ids: string[] | ((p: string[]) => string[])) => void
  groups: import('@/types').FacebookGroup[]
  user: import('@/types').User
  publishing: boolean
  aiGen: boolean
  schedAt: string
  setSchedAt: (s: string) => void
  pubResult: { published: number; failed: number } | null
  applyTemplate: (i: number) => void
  onAi: () => void
  onPublish: () => void
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>פרסום חדש</CardTitle>
          <CardDescription>תבניות, AI ופרסום לקבוצות שנבחרו</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TEMPLATES.map((t, templateIndex) => ({ t, templateIndex }))
              .filter(({ t }) => t.vertical === user.vertical || t.vertical === 'general')
              .slice(0, 4)
              .map(({ t, templateIndex }) => (
                <Button
                  key={t.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(templateIndex)}
                >
                  {t.name}
                </Button>
              ))}
            <Button type="button" variant="secondary" size="sm" onClick={onAi} disabled={aiGen}>
              {aiGen ? 'מייצר...' : '✨ AI'}
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed border-2 py-6 hover:border-primary hover:bg-primary/5"
            onClick={onAi}
            disabled={aiGen}
          >
            {aiGen ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                יוצר תוכן...
              </span>
            ) : (
              <>
                <Sparkles className="w-5 h-5 ml-2 text-primary" />
                צור תוכן עם AI
              </>
            )}
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium">תוכן הפוסט</label>
            <Textarea
              placeholder="כתוב את תוכן הפרסום..."
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              rows={7}
              className="resize-y min-h-[140px]"
            />
            <p className="text-xs text-muted-foreground text-left">{postBody.length} תווים</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">קבוצות ({selGroups.length} נבחרו)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {groups.slice(0, 40).map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() =>
                    setSelGroups((prev) =>
                      prev.includes(group.id) ? prev.filter((id) => id !== group.id) : [...prev, group.id]
                    )
                  }
                  className={cn(
                    'p-3 rounded-xl text-right transition-all border-2',
                    selGroups.includes(group.id)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted border-transparent hover:border-muted-foreground/30'
                  )}
                >
                  <p className="font-medium text-sm truncate">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.memberCount != null ? group.memberCount.toLocaleString() : '—'} חברים
                  </p>
                </button>
              ))}
            </div>
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground">סנכרן קבוצות בטאב &quot;קבוצות&quot;</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              תזמון (אופציונלי)
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                type="datetime-local"
                value={schedAt}
                onChange={(e) => setSchedAt(e.target.value)}
                className="max-w-xs"
              />
              {schedAt && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setSchedAt('')}>
                  נקה
                </Button>
              )}
            </div>
          </div>

          {pubResult && (
            <div
              className={cn(
                'rounded-lg px-4 py-3 text-sm',
                pubResult.failed === 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              )}
            >
              {pubResult.published > 0 && <>פורסם ב-{pubResult.published} קבוצות </>}
              {pubResult.failed > 0 && <>· נכשל ב-{pubResult.failed}</>}
            </div>
          )}

          <Button
            type="button"
            className="w-full btn-shimmer py-6 text-lg"
            size="lg"
            disabled={!postBody.trim() || selGroups.length === 0 || publishing}
            onClick={onPublish}
          >
            {publishing ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                מפרסם...
              </span>
            ) : (
              <>
                <Send className="w-5 h-5 ml-2" />
                {schedAt ? 'תזמן פרסום' : 'פרסם עכשיו'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
