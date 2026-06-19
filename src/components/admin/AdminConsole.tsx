'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Users, BookOpen, Gamepad2, FileQuestion, Loader2, Plus, Search, ShieldCheck,
} from 'lucide-react'

interface AdminUserRow {
  id: string
  name: string
  email: string
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  role: 'admin' | 'user'
  isActive: boolean
  createdAt: string | null
}

interface AdminAggregate {
  totalUsers: number
  totalSubjects: number
  totalQuestions: number
  totalGames: number
  totalMaterials: number
}

const PLAN_LABELS: Record<string, string> = {
  free: 'חינם', basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise',
}

export function AdminConsole() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [aggregate, setAggregate] = useState<AdminAggregate | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [seeding, setSeeding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/overview', { credentials: 'same-origin' })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setUsers(data.users ?? [])
      setAggregate(data.aggregate ?? null)
    } catch {
      toast.error('טעינת נתוני הניהול נכשלה')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const patchUser = async (id: string, patch: Partial<Pick<AdminUserRow, 'plan' | 'role' | 'isActive'>>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
      toast.success('עודכן')
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? 'העדכון נכשל')
    }
  }

  const seedContent = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST', credentials: 'same-origin' })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(`נוסף תוכן התחלתי (${d.created ?? 0} פריטים)`)
        void load()
      } else {
        toast.error(d.error ?? 'זריעת התוכן נכשלה')
      }
    } finally {
      setSeeding(false)
    }
  }

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: 'משתמשים', value: aggregate?.totalUsers ?? 0, icon: Users },
    { label: 'מקצועות', value: aggregate?.totalSubjects ?? 0, icon: BookOpen },
    { label: 'שאלות', value: aggregate?.totalQuestions ?? 0, icon: FileQuestion },
    { label: 'משחקים', value: aggregate?.totalGames ?? 0, icon: Gamepad2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold font-display">ניהול</h1>
        <Button onClick={seedContent} disabled={seeding} variant="outline">
          {seeding ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
          זרע תוכן התחלתי (יסודי)
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value.toLocaleString('he-IL')}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">משתמשים</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם או אימייל"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <CreateUserDialog onCreated={load} />
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              טוען…
            </div>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {filtered.map((u) => (
                  <div key={u.id} className="p-4 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <div className="font-medium flex items-center gap-2">
                        {u.name || '—'}
                        {u.role === 'admin' && <ShieldCheck className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="text-sm text-muted-foreground" dir="ltr">{u.email}</div>
                    </div>

                    <Select value={u.plan} onValueChange={(v) => patchUser(u.id, { plan: v as AdminUserRow['plan'] })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLAN_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={u.role} onValueChange={(v) => patchUser(u.id, { role: v as AdminUserRow['role'] })}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">משתמש</SelectItem>
                        <SelectItem value="admin">מנהל</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Switch checked={u.isActive} onCheckedChange={(c) => patchUser(u.id, { isActive: c })} />
                      <span className="text-sm text-muted-foreground">{u.isActive ? 'פעיל' : 'מושבת'}</span>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">לא נמצאו משתמשים</div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState('free')
  const [role, setRole] = useState('user')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, password, plan, role }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('המשתמש נוצר')
        setOpen(false)
        setName(''); setEmail(''); setPassword('')
        onCreated()
      } else {
        toast.error(d.error ?? 'יצירת המשתמש נכשלה')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 ml-2" />משתמש חדש</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>יצירת משתמש</DialogTitle>
          <DialogDescription>צור חשבון משתמש חדש ידנית</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>שם</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>אימייל</Label><Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label>סיסמה</Label><Input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>תוכנית</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>תפקיד</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">משתמש</SelectItem>
                  <SelectItem value="admin">מנהל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || !email || password.length < 6 || !name}>
            {busy && <Loader2 className="w-4 h-4 animate-spin ml-2" />}צור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
