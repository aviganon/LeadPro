'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Building2, Briefcase, Car, ExternalLink, Loader2, Plus, Shield } from 'lucide-react'

type AdminRow = {
  id: string
  name: string
  email: string
  plan: string
  vertical: string
  role: 'admin' | 'user'
  isActive: boolean
}

const PLANS: { value: string; label: string }[] = [
  { value: 'free', label: 'חינם' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

const VERTICALS: { value: string; label: string }[] = [
  { value: 'real_estate', label: 'נדל״ן' },
  { value: 'car', label: 'רכב' },
  { value: 'general', label: 'עסקים' },
]

export function AdminSettingsPanel() {
  const { user, refreshUser } = useAuth()
  const [rows, setRows] = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/overview')
      if (!res.ok) {
        setError('לא ניתן לטעון משתמשים')
        return
      }
      const data = await res.json()
      const list = (data.users ?? []) as AdminRow[]
      setRows(list)
    } catch {
      setError('שגיאת רשת')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') void load()
  }, [user?.role, load])

  async function patchUser(id: string, patch: Partial<Pick<AdminRow, 'name' | 'vertical' | 'plan' | 'role' | 'isActive'>>) {
    setSavingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof j.error === 'string' ? j.error : 'עדכון נכשל')
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      if (user?.id === id && (patch.role !== undefined || patch.plan !== undefined || patch.vertical !== undefined)) {
        await refreshUser()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה')
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
      await load()
    } catch (e) {
      setCreateErr(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setCreateLoading(false)
    }
  }

  if (user?.role !== 'admin') return null

  return (
    <Card className="border-0 shadow-md border-primary/20">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <CardTitle>ניהול משתמשים</CardTitle>
            <CardDescription>
              תפקיד, תחום (נדל״ן / רכב / עסקים), תוכנית וסטטוס — רק למנהלים
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              מסך ניהול מלא
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
            </Link>
          </Button>
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
                        {VERTICALS.map((v) => (
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
                        {PLANS.map((p) => (
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
                    onValueChange={(role) => setForm((f) => ({ ...f, role: role as 'admin' | 'user' }))}
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
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
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
                {rows.map((row) => {
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
                          onValueChange={(vertical) => void patchUser(row.id, { vertical })}
                        >
                          <SelectTrigger className="w-[130px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VERTICALS.map((v) => (
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
                          onValueChange={(plan) => void patchUser(row.id, { plan })}
                        >
                          <SelectTrigger className="w-[120px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLANS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 align-top">
                        <Select
                          value={row.role}
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
            {rows.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-6 text-sm">אין משתמשים</p>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <Car className="w-3.5 h-3.5 shrink-0" />
          <Briefcase className="w-3.5 h-3.5 shrink-0" />
          <span>תחום (נדל״ן / רכב / עסקים) משפיע על תבניות, סריקה וטקסטים בדשבורד.</span>
        </p>
      </CardContent>
    </Card>
  )
}
