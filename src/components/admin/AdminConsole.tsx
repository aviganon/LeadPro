'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Building2,
  Car,
  CheckCircle,
  Globe,
  Loader2,
  Megaphone,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'

type AdminTab = 'quick' | 'users' | 'stats' | 'system' | 'logs'

export interface AdminUserRow {
  id: string
  name: string
  email: string
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  vertical: 'real_estate' | 'car' | 'general'
  role?: 'admin' | 'user'
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

const VERTICAL_CONFIG_ADMIN: Record<string, { label: string; icon: React.ElementType }> = {
  real_estate: { label: 'נדל״ן', icon: Building2 },
  car: { label: 'רכב', icon: Car },
  general: { label: 'עסקים', icon: Briefcase },
}

const PLANS_QUICK: { value: string; label: string }[] = [
  { value: 'free', label: 'חינם' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

const VERTICALS_QUICK: { value: string; label: string }[] = [
  { value: 'real_estate', label: 'נדל״ן' },
  { value: 'car', label: 'רכב' },
  { value: 'general', label: 'עסקים' },
]

function AdminUsersOverviewTab({
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
    active: users.filter((u) => u.isActive).length,
    connected: users.filter((u) => u.facebookConnected).length,
    proPlan: users.filter((u) => ['pro', 'enterprise'].includes(u.plan)).length,
  }

  const filteredUsers = users.filter(
    (u) => u.name.includes(searchTerm) || u.email.includes(searchTerm)
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'סה״כ משתמשים', value: stats.total, icon: Users, color: 'bg-primary/10 text-primary' },
          { label: 'פעילים', value: stats.active, icon: CheckCircle, color: 'bg-success/10 text-success' },
          { label: 'חוברו לפייסבוק', value: stats.connected, icon: Globe, color: 'bg-accent/10 text-accent' },
          { label: 'Pro+', value: stats.proPlan, icon: Zap, color: 'bg-warning/10 text-warning' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md hover-lift">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
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

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חפש משתמש..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-right p-4 font-medium text-muted-foreground">משתמש</th>
                <th className="text-right p-4 font-medium text-muted-foreground">תוכנית</th>
                <th className="text-right p-4 font-medium text-muted-foreground">תחום</th>
                <th className="text-right p-4 font-medium text-muted-foreground">תפקיד</th>
                <th className="text-right p-4 font-medium text-muted-foreground">לידים</th>
                <th className="text-right p-4 font-medium text-muted-foreground">פרסומים</th>
                <th className="text-right p-4 font-medium text-muted-foreground">פייסבוק</th>
                <th className="text-right p-4 font-medium text-muted-foreground">סטטוס</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, index) => {
                const planConfig = PLAN_CONFIG[u.plan] ?? PLAN_CONFIG.free
                const verticalConfig =
                  VERTICAL_CONFIG_ADMIN[u.vertical] ?? VERTICAL_CONFIG_ADMIN.general
                return (
                  <tr
                    key={u.id}
                    className={cn(
                      'border-b hover:bg-muted/30 transition-colors',
                      !u.isActive && 'opacity-50'
                    )}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-white font-bold">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          planConfig.bg,
                          planConfig.color
                        )}
                      >
                        {planConfig.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <verticalConfig.icon className="w-4 h-4" />
                        {verticalConfig.label}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          u.role === 'admin' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {u.role === 'admin' ? 'מנהל' : 'משתמש'}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{u.leadsCount}</td>
                    <td className="p-4 font-medium">{u.postsCount}</td>
                    <td className="p-4">
                      {u.facebookConnected ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => void handleToggle(u.id)}
                        disabled={pending === u.id}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-all',
                          u.isActive
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {pending === u.id ? '...' : u.isActive ? 'פעיל' : 'מושבת'}
                      </button>
                    </td>
                    <td className="p-4">
                      <button type="button" className="p-2 rounded-lg hover:bg-muted" aria-hidden>
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

function AdminStatsTab({ users, aggregate }: { users: AdminUserRow[]; aggregate: AdminAggregate }) {
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

  const topUsers = [...users].sort((a, b) => b.leadsCount - a.leadsCount).slice(0, 5)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.label}
            className="border-0 shadow-md hover-lift"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
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

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>משתמשים מובילים</CardTitle>
          <CardDescription>לפי כמות לידים</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topUsers.map((u, index) => (
              <div key={u.id} className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                    index === 0
                      ? 'bg-warning/20 text-warning'
                      : index === 1
                        ? 'bg-muted text-muted-foreground'
                        : index === 2
                          ? 'bg-accent/20 text-accent'
                          : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold">{u.leadsCount}</p>
                  <p className="text-xs text-muted-foreground">לידים</p>
                </div>
                <div className="text-left">
                  <p className="font-bold">{u.postsCount}</p>
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

function AdminSystemTab() {
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
            להגדרות פרויקט, אינדקסים ו-Secrets: Firebase Console ו-GCP. הדשבורד כאן מציג רק נתונים שנשלפים
            מ-Firestore (משתמשים, ספירות לידים/פרסומים).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminLogsTab() {
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

export function AdminConsole() {
  const { user, refreshUser } = useAuth()
  const [adminTab, setAdminTab] = useState<AdminTab>('quick')
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([])
  const [aggregate, setAggregate] = useState<AdminAggregate | null>(null)
  const [loading, setLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createErr, setCreateErr] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    vertical: 'real_estate',
    plan: 'free',
    role: 'user' as 'admin' | 'user',
  })

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setOverviewError(null)
    try {
      const res = await fetch('/api/admin/overview')
      if (!res.ok) {
        setOverviewError('לא ניתן לטעון נתונים')
        return
      }
      const data = await res.json()
      setAdminUsers((data.users ?? []) as AdminUserRow[])
      setAggregate(data.aggregate ?? null)
    } catch {
      setOverviewError('שגיאת רשת')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') void loadOverview()
  }, [user?.role, loadOverview])

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

  async function patchUser(
    id: string,
    patch: Partial<Pick<AdminUserRow, 'name' | 'vertical' | 'plan' | 'role' | 'isActive'>>
  ) {
    setSavingId(id)
    setOverviewError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof j.error === 'string' ? j.error : 'עדכון נכשל')
      setAdminUsers((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      if (user?.id === id && (patch.role !== undefined || patch.plan !== undefined || patch.vertical !== undefined)) {
        await refreshUser()
      }
    } catch (e) {
      setOverviewError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setSavingId(null)
    }
  }

  async function createUser() {
    setCreateLoading(true)
    setCreateErr(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof j.error === 'string' ? j.error : 'יצירה נכשלה')
      setCreateOpen(false)
      setForm({
        email: '',
        password: '',
        name: '',
        vertical: 'real_estate',
        plan: 'free',
        role: 'user',
      })
      await loadOverview()
    } catch (e) {
      setCreateErr(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setCreateLoading(false)
    }
  }

  if (user?.role !== 'admin') return null

  return (
    <Card className="border-0 shadow-md border-primary/20">
      <CardHeader className="space-y-4">
        <div className="flex items-start gap-2">
          <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <CardTitle>לוח בקרת מנהל</CardTitle>
            <CardDescription>
              כל ניהול המערכת כאן: עריכת משתמשים, רשימה, סטטיסטיקות, מערכת ולוגים
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as AdminTab)} className="w-full">
          <TabsList className="flex h-auto min-h-9 w-full flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="quick" className="gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              עריכה מהירה
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-4 h-4" />
              רשימה וסטטוס
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5">
              <TrendingUp className="w-4 h-4" />
              סטטיסטיקות
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-1.5">
              <Target className="w-4 h-4" />
              מערכת
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <Activity className="w-4 h-4" />
              לוגים
            </TabsTrigger>
          </TabsList>

          {overviewError && (
            <p className="text-sm text-destructive pt-2">
              {overviewError}
              <Button
                type="button"
                variant="link"
                className="mr-2 p-0 h-auto"
                onClick={() => void loadOverview()}
              >
                נסה שוב
              </Button>
            </p>
          )}

          <TabsContent value="quick" className="mt-4 space-y-4">
            <div className="flex flex-wrap justify-end gap-2">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" type="button">
                    <Plus className="w-4 h-4 ml-1" />
                    משתמש חדש
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>יצירת משתמש</DialogTitle>
                    <DialogDescription>
                      נוצר חשבון Firebase + רשומה ב-Firestore. המשתמש יוכל להתחבר עם האימייל והסיסמה.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="space-y-1">
                      <Label>אימייל</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>סיסמה (6+ תווים)</Label>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>שם מלא</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>תחום במערכת</Label>
                        <Select
                          value={form.vertical}
                          onValueChange={(vertical) => setForm((f) => ({ ...f, vertical }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VERTICALS_QUICK.map((v) => (
                              <SelectItem key={v.value} value={v.value}>
                                {v.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>תוכנית</Label>
                        <Select value={form.plan} onValueChange={(plan) => setForm((f) => ({ ...f, plan }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLANS_QUICK.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>תפקיד</Label>
                      <Select
                        value={form.role}
                        onValueChange={(role) =>
                          setForm((f) => ({ ...f, role: role as 'admin' | 'user' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">משתמש</SelectItem>
                          <SelectItem value="admin">מנהל</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {createErr && <p className="text-sm text-destructive">{createErr}</p>}
                  </div>
                  <DialogFooter className="gap-2 sm:justify-start">
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                      ביטול
                    </Button>
                    <Button type="button" onClick={() => void createUser()} disabled={createLoading}>
                      {createLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                      צור
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">טוען...</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-right p-3 font-medium">משתמש</th>
                      <th className="text-right p-3 font-medium">תחום</th>
                      <th className="text-right p-3 font-medium">תוכנית</th>
                      <th className="text-right p-3 font-medium">תפקיד</th>
                      <th className="text-right p-3 font-medium">פעיל</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((row) => {
                      const isSelf = row.id === user.id
                      const busy = savingId === row.id
                      return (
                        <tr key={row.id} className={cn('border-b', !row.isActive && 'opacity-60')}>
                          <td className="p-3 align-top min-w-[200px]">
                            <Input
                              key={`${row.id}-${row.name}`}
                              defaultValue={row.name}
                              disabled={busy}
                              className="mb-1 h-8"
                              onBlur={(e) => {
                                const name = e.target.value.trim()
                                if (name && name !== row.name) void patchUser(row.id, { name })
                              }}
                            />
                            <span className="text-xs text-muted-foreground break-all">{row.email}</span>
                          </td>
                          <td className="p-3 align-top">
                            <Select
                              value={row.vertical}
                              disabled={busy}
                              onValueChange={(vertical) =>
                                void patchUser(row.id, {
                                  vertical: vertical as AdminUserRow['vertical'],
                                })
                              }
                            >
                              <SelectTrigger className="w-[130px] h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {VERTICALS_QUICK.map((v) => (
                                  <SelectItem key={v.value} value={v.value}>
                                    {v.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 align-top">
                            <Select
                              value={row.plan}
                              disabled={busy}
                              onValueChange={(plan) =>
                                void patchUser(row.id, { plan: plan as AdminUserRow['plan'] })
                              }
                            >
                              <SelectTrigger className="w-[120px] h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PLANS_QUICK.map((p) => (
                                  <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 align-top">
                            <Select
                              value={row.role ?? 'user'}
                              disabled={busy || isSelf}
                              onValueChange={(role) =>
                                void patchUser(row.id, { role: role as 'admin' | 'user' })
                              }
                            >
                              <SelectTrigger className="w-[110px] h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">משתמש</SelectItem>
                                <SelectItem value="admin">מנהל</SelectItem>
                              </SelectContent>
                            </Select>
                            {isSelf && (
                              <span className="text-[10px] text-muted-foreground block mt-1">החשבון שלך</span>
                            )}
                          </td>
                          <td className="p-3 align-top">
                            <Switch
                              checked={row.isActive}
                              disabled={busy || isSelf}
                              onCheckedChange={(checked) => void patchUser(row.id, { isActive: checked })}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {adminUsers.length === 0 && !loading && (
                  <p className="text-center text-muted-foreground py-6 text-sm">אין משתמשים</p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <Car className="w-3.5 h-3.5 shrink-0" />
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span>תחום משפיע על תבניות, סריקה וטקסטים בדשבורד.</span>
            </p>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground py-8">טוען...</p>
            ) : (
              <AdminUsersOverviewTab users={adminUsers} onToggleActive={toggleUserActive} />
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground py-8">טוען...</p>
            ) : aggregate ? (
              <AdminStatsTab users={adminUsers} aggregate={aggregate} />
            ) : (
              <p className="text-muted-foreground">אין נתוני אגרגציה</p>
            )}
          </TabsContent>

          <TabsContent value="system" className="mt-4">
            <AdminSystemTab />
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <AdminLogsTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
