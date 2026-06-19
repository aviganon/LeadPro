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
  Users, BookOpen, Gamepad2, FileQuestion, Loader2, Plus, Search, ShieldCheck, ChevronLeft,
} from 'lucide-react'
import {
  getSubjects, getInstitutions, getDepartments, getDepartmentCourses,
  getGames, getQuestions, getMaterials,
} from '@/lib/db'
import { LEVELS } from '@/lib/constants'
import type { Level, Subject, Institution, Department } from '@/types'

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

async function postStructure(kind: string, data: Record<string, unknown>) {
  const res = await fetch('/api/admin/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ kind, data }),
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error ?? 'נכשל')
  return d
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
      if (res.ok) { toast.success(`נוסף/עודכן תוכן (${d.created ?? 0} פריטים)`); void load() }
      else toast.error(d.error ?? 'זריעת התוכן נכשלה')
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
          זרע/עדכן תוכן בסיס
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

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">מבנה ותוכן</TabsTrigger>
          <TabsTrigger value="users">משתמשים</TabsTrigger>
        </TabsList>

        {/* ===== CONTENT / STRUCTURE ===== */}
        <TabsContent value="content" className="pt-4">
          <ContentManager />
        </TabsContent>

        {/* ===== USERS ===== */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="חיפוש לפי שם או אימייל" value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
            </div>
            <CreateUserDialog onCreated={load} />
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />טוען…</div>
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
                      <SelectContent>{Object.entries(PLAN_LABELS).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={u.role} onValueChange={(v) => patchUser(u.id, { role: v as AdminUserRow['role'] })}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="user">משתמש</SelectItem><SelectItem value="admin">מנהל</SelectItem></SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Switch checked={u.isActive} onCheckedChange={(c) => patchUser(u.id, { isActive: c })} />
                      <span className="text-sm text-muted-foreground">{u.isActive ? 'פעיל' : 'מושבת'}</span>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground">לא נמצאו משתמשים</div>}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =================== CONTENT MANAGER ===================

const LEVEL_LABELS: Record<Level, string> = {
  elementary: 'בית ספר יסודי',
  middle_high: 'חטיבה ותיכון',
  student: 'סטודנטים',
}

function ContentManager() {
  const [level, setLevel] = useState<Level>('elementary')
  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(LEVEL_LABELS) as Level[]).map((l) => (
          <Button key={l} variant={level === l ? 'default' : 'outline'} size="sm" onClick={() => setLevel(l)} className="rounded-2xl">
            {LEVEL_LABELS[l]}
          </Button>
        ))}
      </div>

      {level === 'student' ? <StudentStructure /> : <SchoolContent key={level} level={level} />}
    </div>
  )
}

// ----- elementary / middle: subject + grade browser -----

function SchoolContent({ level }: { level: Level }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const grades = LEVELS.find((l) => l.id === level)?.grades ?? []
  const [grade, setGrade] = useState<number>(grades[0] ?? 1)

  useEffect(() => {
    let active = true
    getSubjects(level).then((s) => { if (active) { setSubjects(s); setLoading(false) } }).catch(() => { if (active) { setSubjects([]); setLoading(false) } })
    return () => { active = false }
  }, [level])

  const inGrade = subjects.filter((s) => grade >= s.gradeFrom && grade <= s.gradeTo)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">כיתה:</span>
        {grades.map((g) => (
          <Button key={g} variant={grade === g ? 'secondary' : 'ghost'} size="sm" onClick={() => setGrade(g)} className="w-10 rounded-xl">{g}</Button>
        ))}
      </div>
      {loading ? (
        <div className="py-10 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : inGrade.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">אין מקצועות לכיתה זו. השתמש בכפתור &quot;זרע/עדכן תוכן בסיס&quot;.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {inGrade.map((s) => <SubjectContentCard key={s.id} subject={s} grade={grade} />)}
        </div>
      )}
    </div>
  )
}

function SubjectContentCard({ subject, grade }: { subject: Subject; grade: number }) {
  const [counts, setCounts] = useState<{ g: number; q: number; m: number } | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([getGames(subject.id, grade), getQuestions(subject.id, grade), getMaterials(subject.id, grade)])
      .then(([g, q, m]) => { if (active) setCounts({ g: g.length, q: q.length, m: m.length }) })
      .catch(() => { if (active) setCounts({ g: 0, q: 0, m: 0 }) })
    return () => { active = false }
  }, [subject.id, grade])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in oklch, ${subject.color} 18%, transparent)`, color: subject.color }}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="font-bold">{subject.nameHe}</div>
        </div>
        <div className="flex gap-2 text-sm">
          <Badge icon={Gamepad2} n={counts?.g} label="משחקים" />
          <Badge icon={FileQuestion} n={counts?.q} label="שאלות" />
          <Badge icon={BookOpen} n={counts?.m} label="חומרים" />
        </div>
      </CardContent>
    </Card>
  )
}

function Badge({ icon: Icon, n, label }: { icon: React.ElementType; n?: number; label: string }) {
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="font-semibold">{n ?? '…'}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

// ----- student: institution -> department -> course -----

function StudentStructure() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [inst, setInst] = useState<Institution | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [dep, setDep] = useState<Department | null>(null)
  const [courses, setCourses] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const loadInstitutions = useCallback(() => {
    getInstitutions().then((d) => { setInstitutions(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])
  useEffect(() => { loadInstitutions() }, [loadInstitutions])

  const loadDepartments = useCallback((id: string) => {
    getDepartments(id).then(setDepartments).catch(() => setDepartments([]))
  }, [])
  const loadCourses = useCallback((id: string) => {
    getDepartmentCourses(id).then(setCourses).catch(() => setCourses([]))
  }, [])

  // Breadcrumb back
  if (dep && inst) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setDep(null)} className="gap-1"><ChevronLeft className="w-4 h-4 rotate-180" />{inst.name}</Button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold font-display text-lg">קורסים — {dep.name}</h3>
          <AddCourseDialog institutionId={inst.id} departmentId={dep.id} onAdded={() => loadCourses(dep.id)} />
        </div>
        {courses.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">עוד אין קורסים. הוסף קורס ←</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </div>
    )
  }

  if (inst) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setInst(null)} className="gap-1"><ChevronLeft className="w-4 h-4 rotate-180" />כל המוסדות</Button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold font-display text-lg">מסלולים — {inst.name}</h3>
          <AddDepartmentDialog institutionId={inst.id} onAdded={() => loadDepartments(inst.id)} />
        </div>
        {departments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">עוד אין מסלולים. הוסף מסלול ←</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {departments.map((d) => (
              <button key={d.id} onClick={() => { setDep(d); loadCourses(d.id) }} className="text-right">
                <Card className="hover:border-primary/40 transition-colors"><CardContent className="p-4 font-medium">{d.name}</CardContent></Card>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold font-display text-lg">מוסדות לימוד</h3>
        <AddInstitutionDialog onAdded={loadInstitutions} />
      </div>
      {loading ? (
        <div className="py-10 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : institutions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">עוד אין מוסדות. הוסף מוסד, או לחץ &quot;זרע/עדכן תוכן בסיס&quot;.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {institutions.map((i) => (
            <button key={i.id} onClick={() => { setInst(i); loadDepartments(i.id) }} className="text-right">
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{i.type === 'university' ? 'אוניברסיטה' : 'מכללה'}</div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CourseCard({ course }: { course: Subject }) {
  const yearLabel = course.gradeFrom === course.gradeTo ? `שנה ${course.gradeFrom}` : `שנים ${course.gradeFrom}-${course.gradeTo}`
  return (
    <Card>
      <CardContent className="p-4">
        <div className="font-bold mb-1">{course.nameHe}</div>
        <div className="text-xs text-muted-foreground">{yearLabel} · {course.slug}</div>
      </CardContent>
    </Card>
  )
}

// ----- dialogs -----

function AddInstitutionDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('college')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try { await postStructure('institution', { name, type }); toast.success('המוסד נוסף'); setOpen(false); setName(''); onAdded() }
    catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 ml-2" />מוסד חדש</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>מוסד חדש</DialogTitle><DialogDescription>מכללה או אוניברסיטה</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>שם המוסד</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="מכללת שנקר הנדסאים" /></div>
          <div className="space-y-2">
            <Label>סוג</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="college">מכללה</SelectItem><SelectItem value="university">אוניברסיטה</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy || !name}>{busy && <Loader2 className="w-4 h-4 animate-spin ml-2" />}צור</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddDepartmentDialog({ institutionId, onAdded }: { institutionId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try { await postStructure('department', { institutionId, name }); toast.success('המסלול נוסף'); setOpen(false); setName(''); onAdded() }
    catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 ml-2" />מסלול חדש</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>מסלול חדש</DialogTitle><DialogDescription>למשל: הנדסאי בניין</DialogDescription></DialogHeader>
        <div className="space-y-2"><Label>שם המסלול</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="הנדסאי בניין" /></div>
        <DialogFooter><Button onClick={submit} disabled={busy || !name}>{busy && <Loader2 className="w-4 h-4 animate-spin ml-2" />}צור</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddCourseDialog({ institutionId, departmentId, onAdded }: { institutionId: string; departmentId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [nameHe, setNameHe] = useState('')
  const [slug, setSlug] = useState('')
  const [year, setYear] = useState('1')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try {
      await postStructure('subject', {
        nameHe, nameEn: nameHe, slug: slug || nameHe, level: 'student',
        institutionId, departmentId, gradeFrom: Number(year), gradeTo: Number(year),
        icon: 'BookOpen', color: '#7C3AED',
      })
      toast.success('הקורס נוסף'); setOpen(false); setNameHe(''); setSlug(''); onAdded()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 ml-2" />קורס חדש</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>קורס חדש</DialogTitle><DialogDescription>הקורס יופיע לסטודנטים במסלול ובשנה שתבחר</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>שם הקורס</Label><Input value={nameHe} onChange={(e) => setNameHe(e.target.value)} placeholder="סטטיקה" /></div>
          <div className="space-y-2"><Label>כתובת באנגלית (slug)</Label><Input dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="shenkar-binyan-statics" /></div>
          <div className="space-y-2">
            <Label>שנה</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[1, 2, 3, 4].map((y) => <SelectItem key={y} value={String(y)}>שנה {y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy || !nameHe}>{busy && <Loader2 className="w-4 h-4 animate-spin ml-2" />}צור</Button></DialogFooter>
      </DialogContent>
    </Dialog>
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ name, email, password, plan, role }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) { toast.success('המשתמש נוצר'); setOpen(false); setName(''); setEmail(''); setPassword(''); onCreated() }
      else toast.error(d.error ?? 'יצירת המשתמש נכשלה')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />משתמש חדש</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>יצירת משתמש</DialogTitle><DialogDescription>צור חשבון משתמש חדש ידנית</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>שם</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>אימייל</Label><Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label>סיסמה</Label><Input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>תוכנית</Label>
              <Select value={plan} onValueChange={setPlan}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PLAN_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>תפקיד</Label>
              <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="user">משתמש</SelectItem><SelectItem value="admin">מנהל</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy || !email || password.length < 6 || !name}>{busy && <Loader2 className="w-4 h-4 animate-spin ml-2" />}צור</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
