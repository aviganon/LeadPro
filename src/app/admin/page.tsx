'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  Target, Users, TrendingUp, ShieldCheck, Activity,
  Search, CheckCircle, XCircle, AlertTriangle,
  MoreHorizontal, ArrowLeft, Building2, Car, Briefcase,
  Zap, Globe, Megaphone, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type AdminTab = 'users' | 'stats' | 'system' | 'logs'

interface AdminUserRow {
  id: string
  name: string
  email: string
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  vertical: 'real_estate' | 'car' | 'general'
  isActive: boolean
  facebookConnected: boolean
  leadsCount: number
  postsCount: number
  createdAt: string | null
}

interface AdminAggregate {
  totalLeads: number
  totalPosts: number
  leadsToday: number
  postsToday: number
  conversionRate: number
}

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'Free', color: 'text-muted-foreground', bg: 'bg-muted' },
  basic: { label: 'Basic', color: 'text-primary', bg: 'bg-primary/10' },
  pro: { label: 'Pro', color: 'text-success', bg: 'bg-success/10' },
  enterprise: { label: 'Enterprise', color: 'text-accent', bg: 'bg-accent/10' },
}

const VERTICAL_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  real_estate: { label: 'נדל"ן', icon: Building2 },
  car: { label: 'רכב', icon: Car },
  general: { label: 'עסקים', icon: Briefcase },
}

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'users', label: 'משתמשים', icon: Users },
  { id: 'stats', label: 'סטטיסטיקות', icon: TrendingUp },
  { id: 'system', label: 'מערכת', icon: ShieldCheck },
  { id: 'logs', label: 'לוגים', icon: Activity },
]

function AdminHeader({ activeTab, setActiveTab }: { activeTab: AdminTab; setActiveTab: (tab: AdminTab) => void }) {
  return (
    <div className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">LeadPro</span>
              <span className="px-2 py-0.5 rounded bg-warning/20 text-warning text-xs font-medium">Admin</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-sidebar-accent text-sidebar-foreground font-medium' 
                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <Button variant="ghost" size="sm" className="text-sidebar-foreground/70" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 ml-2" />
              חזרה לדשבורד
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function UsersTab({
  users,
  onToggleActive,
}: {
  users: AdminUserRow[]
  onToggleActive: (id: string) => Promise<void>
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    connected: users.filter(u => u.facebookConnected).length,
    proPlan: users.filter(u => ['pro', 'enterprise'].includes(u.plan)).length,
  }

  const filteredUsers = users.filter(u => 
    u.name.includes(searchTerm) || u.email.includes(searchTerm)
  )

  async function handleToggle(id: string) {
    setPending(id)
    try {
      await onToggleActive(id)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'סה"כ משתמשים', value: stats.total, icon: Users, color: 'bg-primary/10 text-primary' },
          { label: 'פעילים', value: stats.active, icon: CheckCircle, color: 'bg-success/10 text-success' },
          { label: 'חוברו לפייסבוק', value: stats.connected, icon: Globe, color: 'bg-accent/10 text-accent' },
          { label: 'Pro+', value: stats.proPlan, icon: Zap, color: 'bg-warning/10 text-warning' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md hover-lift">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חפש משתמש..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Users table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-right p-4 font-medium text-muted-foreground">משתמש</th>
                <th className="text-right p-4 font-medium text-muted-foreground">תוכנית</th>
                <th className="text-right p-4 font-medium text-muted-foreground">תחום</th>
                <th className="text-right p-4 font-medium text-muted-foreground">לידים</th>
                <th className="text-right p-4 font-medium text-muted-foreground">פרסומים</th>
                <th className="text-right p-4 font-medium text-muted-foreground">פייסבוק</th>
                <th className="text-right p-4 font-medium text-muted-foreground">סטטוס</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const planConfig = PLAN_CONFIG[user.plan] ?? PLAN_CONFIG.free
                const verticalConfig =
                  VERTICAL_CONFIG[user.vertical] ?? VERTICAL_CONFIG.general
                return (
                  <tr 
                    key={user.id} 
                    className={`border-b hover:bg-muted/30 transition-colors ${!user.isActive ? 'opacity-50' : ''}`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${planConfig.bg} ${planConfig.color}`}>
                        {planConfig.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <verticalConfig.icon className="w-4 h-4" />
                        {verticalConfig.label}
                      </div>
                    </td>
                    <td className="p-4 font-medium">{user.leadsCount}</td>
                    <td className="p-4 font-medium">{user.postsCount}</td>
                    <td className="p-4">
                      {user.facebookConnected 
                        ? <CheckCircle className="w-5 h-5 text-success" />
                        : <XCircle className="w-5 h-5 text-muted-foreground" />
                      }
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggle(user.id)}
                        disabled={pending === user.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          user.isActive 
                            ? 'bg-success/10 text-success hover:bg-success/20' 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {pending === user.id ? '...' : user.isActive ? 'פעיל' : 'מושבת'}
                      </button>
                    </td>
                    <td className="p-4">
                      <button className="p-2 rounded-lg hover:bg-muted">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function StatsTab({ users, aggregate }: { users: AdminUserRow[]; aggregate: AdminAggregate }) {
  const stats = [
    { label: 'סה״כ לידים (Firestore)', value: aggregate.totalLeads.toLocaleString('he-IL'), icon: Users },
    { label: 'סה״כ פרסומים', value: aggregate.totalPosts.toLocaleString('he-IL'), icon: Megaphone },
    {
      label: 'שיעור המרה (לידים מומרים)',
      value: `${aggregate.conversionRate}%`,
      icon: TrendingUp,
    },
    { label: 'לידים היום', value: aggregate.leadsToday.toLocaleString('he-IL'), icon: Zap },
    { label: 'פרסומים היום', value: aggregate.postsToday.toLocaleString('he-IL'), icon: BarChart3 },
  ]

  const topUsers = [...users]
    .sort((a, b) => b.leadsCount - a.leadsCount)
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="border-0 shadow-md hover-lift" style={{ animationDelay: `${index * 0.05}s` }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top users */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>משתמשים מובילים</CardTitle>
          <CardDescription>לפי כמות לידים</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topUsers.map((user, index) => (
              <div key={user.id} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-warning/20 text-warning' :
                  index === 1 ? 'bg-muted text-muted-foreground' :
                  index === 2 ? 'bg-accent/20 text-accent' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold">{user.leadsCount}</p>
                  <p className="text-xs text-muted-foreground">לידים</p>
                </div>
                <div className="text-left">
                  <p className="font-bold">{user.postsCount}</p>
                  <p className="text-xs text-muted-foreground">פרסומים</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SystemTab() {
  return (
    <div className="max-w-2xl animate-slide-up space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>תשתית וניטור</CardTitle>
          <CardDescription>
            אין כאן סטטוס &quot;חי&quot; מזויף. ניטור Firebase, Cloud Run, Stripe ו-Meta מתבצה ב-Google Cloud Console,
            ב-Firebase ובלוח הבקרה של כל שירות.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            להגדרות פרויקט, אינדקסים ו-Secrets: Firebase Console ו-GCP. הדשבורד כאן מציג רק נתונים שנשלפים מ-Firestore
            (משתמשים, ספירות לידים/פרסומים).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function LogsTab() {
  return (
    <div className="max-w-2xl animate-slide-up">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>לוגים מרכזיים</CardTitle>
          <CardDescription>
            לא מוצגים כאן רשומות דמה. לוגי שרת ו-Functions נמצאים ב-Google Cloud Logging; אירועי אבטחה — ב-Firebase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground text-sm gap-2">
          <AlertTriangle className="w-10 h-10 opacity-40" />
          <p>אין feed לוגים מוטמע באפליקציה. בעתיד אפשר לחבר Audit באמצעות Firestore או ייצוא מ-Cloud Logging.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([])
  const [aggregate, setAggregate] = useState<AdminAggregate | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  async function loadOverview() {
    setOverviewLoading(true)
    setOverviewError(null)
    try {
      const res = await fetch('/api/admin/overview')
      if (!res.ok) {
        setOverviewError('לא ניתן לטעון נתונים')
        return
      }
      const data = await res.json()
      setAdminUsers(data.users ?? [])
      setAggregate(data.aggregate ?? null)
    } catch {
      setOverviewError('שגיאת רשת')
    } finally {
      setOverviewLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth?redirect=/admin')
      return
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return
    void loadOverview()
  }, [authLoading, user])

  const toggleUserActive = async (id: string) => {
    const row = adminUsers.find((u) => u.id === id)
    if (!row) return
    const next = !row.isActive
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: next }),
    })
    if (res.ok) {
      setAdminUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: next } : u)))
    }
  }

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        טוען...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="container mx-auto px-6 py-8">
        {overviewError && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {overviewError}
            <Button type="button" variant="link" className="mr-2 p-0 h-auto" onClick={() => void loadOverview()}>
              נסה שוב
            </Button>
          </div>
        )}

        {overviewLoading ? (
          <div className="text-center text-muted-foreground py-16">טוען נתונים מ-Firestore...</div>
        ) : (
          <>
            {activeTab === 'users' && (
              <UsersTab users={adminUsers} onToggleActive={toggleUserActive} />
            )}
            {activeTab === 'stats' && aggregate && (
              <StatsTab users={adminUsers} aggregate={aggregate} />
            )}
            {activeTab === 'stats' && !aggregate && (
              <p className="text-muted-foreground">אין נתוני אגרגציה</p>
            )}
            {activeTab === 'system' && <SystemTab />}
            {activeTab === 'logs' && <LogsTab />}
          </>
        )}
      </main>
    </div>
  )
}
