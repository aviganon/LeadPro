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
  Users, BookOpen, Gamepad2, FileQuestion, Loader2, Plus, Search, ShieldCheck, ChevronLeft, Trash2,
  RefreshCw, Wrench, UserCircle2,
} from 'lucide-react'
import {
  getSubjects, getInstitutions, getDepartments, getDepartmentCourses,
  getGames, getQuestions, getMaterials,
} from '@/lib/db'
import { OnlinePanel } from '@/components/admin/OnlinePanel'
import { LEVELS } from '@/lib/constants'
import { SHENKAR_BINYAN_COURSES } from '@/lib/shenkarCourses'
import { CONTENT_PACKS } from '@/lib/contentPacks'
import { Sparkles } from 'lucide-react'
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
  registeredUsers: number
  activeRegistered: number
  anonPlayers: number
  totalSubjects: number
  totalQuestions: number
  totalGames: number
  totalMaterials: number
  aiCalls: number
  aiCostUsd: number
  aiInputTokens: number
  aiOutputTokens: number
}

// תמחור Claude Haiku 4.5 — דולר ל-1M טוקנים
const PRICE_IN = 1.0
const PRICE_OUT = 5.0
const USD_TO_ILS = 3.7  // הערכה לתצוגה בלבד
const fmtUsd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`

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

async function deleteStructure(kind: string, id: string) {
  const res = await fetch(`/api/admin/structure?kind=${kind}&id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error ?? 'מחיקה נכשלה')
  return d
}

/** כפתור מחיקה קטן עם אישור */
function DeleteBtn({ onConfirm, label }: { onConfirm: () => Promise<void>; label: string }) {
  const [busy, setBusy] = useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive shrink-0"
      disabled={busy}
      onClick={async (e) => {
        e.stopPropagation()
        if (!window.confirm(`למחוק ${label}?`)) return
        setBusy(true)
        try { await onConfirm() } catch (err) { toast.error((err as Error).message) } finally { setBusy(false) }
      }}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </Button>
  )
}

export function AdminConsole() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [aggregate, setAggregate] = useState<AdminAggregate | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [advanced, setAdvanced] = useState(false)

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
      if (res.ok) { toast.success(`סונכרן תוכן בסיס — ${d.created ?? 0} פריטים (ללא כפילויות)`); void load() }
      else toast.error(d.error ?? 'זריעת התוכן נכשלה')
    } finally {
      setSeeding(false)
    }
  }

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: 'משתמשים רשומים', value: aggregate?.registeredUsers ?? 0, sub: `${aggregate?.activeRegistered ?? 0} פעילים`, icon: UserCircle2 },
    { label: 'שחקנים אנונימיים', value: aggregate?.anonPlayers ?? 0, sub: 'ללא הרשמה', icon: Users },
    { label: 'מקצועות', value: aggregate?.totalSubjects ?? 0, icon: BookOpen },
    { label: 'שאלות', value: aggregate?.totalQuestions ?? 0, icon: FileQuestion },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold font-display">ניהול</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => load()} disabled={loading} variant="ghost" size="sm" className="gap-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />רענן
          </Button>
          <Button onClick={() => setAdvanced((v) => !v)} variant={advanced ? 'secondary' : 'ghost'} size="sm" className="gap-1.5">
            <Wrench className="w-4 h-4" />כלים מתקדמים
          </Button>
          {advanced && (
            <Button onClick={seedContent} disabled={seeding} variant="outline" size="sm">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
              זרע/עדכן תוכן בסיס
            </Button>
          )}
        </div>
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
                {s.sub && <div className="text-xs text-muted-foreground/70">{s.sub}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <OnlinePanel />

      <AiCostPanel aggregate={aggregate} />

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">מבנה ותוכן</TabsTrigger>
          <TabsTrigger value="users">משתמשים</TabsTrigger>
        </TabsList>

        {/* ===== CONTENT / STRUCTURE ===== */}
        <TabsContent value="content" className="pt-4">
          <ContentManager advanced={advanced} />
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

// =================== AI COST PANEL ===================

function AiCostPanel({ aggregate }: { aggregate: AdminAggregate | null }) {
  const calls = aggregate?.aiCalls ?? 0
  const cost = aggregate?.aiCostUsd ?? 0
  const avg = calls > 0 ? cost / calls : 0

  // הערכת עלות לקריאה בודדת (לפי שימוש טיפוסי), לפני שיש נתונים אמיתיים
  const estHelp = (300 / 1e6) * PRICE_IN + (500 / 1e6) * PRICE_OUT      // ~$0.0028
  const estQuestions = (250 / 1e6) * PRICE_IN + (1200 / 1e6) * PRICE_OUT // ~$0.0063

  const agorot = (usd: number) => `~${Math.round(usd * USD_TO_ILS * 100)} אג׳`

  return (
    <Card className="border-fun/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-fun/10 text-fun flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold font-display">עלויות AI (Claude Haiku 4.5)</h3>
            <p className="text-xs text-muted-foreground">תמחור: ${PRICE_IN}/1M טוקני קלט · ${PRICE_OUT}/1M טוקני פלט</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="עלות כוללת עד כה" value={fmtUsd(cost)} sub={`≈ ${(cost * USD_TO_ILS).toFixed(2)} ₪`} />
          <Metric label="מספר קריאות" value={calls.toLocaleString('he-IL')} />
          <Metric label="עלות ממוצעת לקריאה" value={calls ? fmtUsd(avg) : '—'} sub={calls ? agorot(avg) : 'אין נתונים עדיין'} />
          <Metric label="טוקנים (קלט/פלט)" value={`${(aggregate?.aiInputTokens ?? 0).toLocaleString('he-IL')} / ${(aggregate?.aiOutputTokens ?? 0).toLocaleString('he-IL')}`} small />
        </div>

        <div className="rounded-2xl bg-muted/60 p-4 text-sm space-y-1.5">
          <div className="font-medium mb-1">כמה כל קריאה עולה (הערכה):</div>
          <div className="flex justify-between"><span>🧑‍🏫 מורה פרטי (הסבר)</span><span className="font-semibold">{fmtUsd(estHelp)} ({agorot(estHelp)})</span></div>
          <div className="flex justify-between"><span>✨ יצירת 5 שאלות</span><span className="font-semibold">{fmtUsd(estQuestions)} ({agorot(estQuestions)})</span></div>
          <p className="text-xs text-muted-foreground pt-2">
            כלומר ~300–600 קריאות בדולר אחד. גם 1,000 סטודנטים שעושים 10 קריאות כל אחד ≈ {fmtUsd((estHelp + estQuestions) / 2 * 10000)} בלבד.
            בנוסף יש הגבלת קצב לפי IP, והתוכן המוכן (שאלות/משחקים) לא צורך AI כלל.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value, sub, small }: { label: string; value: string; sub?: string; small?: boolean }) {
  return (
    <div className="rounded-2xl bg-background border border-border p-3">
      <div className={`font-bold ${small ? 'text-sm' : 'text-xl'}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/80 mt-0.5">{sub}</div>}
    </div>
  )
}

// =================== CONTENT MANAGER ===================

const LEVEL_LABELS: Record<Level, string> = {
  elementary: 'בית ספר יסודי',
  middle_high: 'חטיבה ותיכון',
  student: 'סטודנטים',
}

function ContentManager({ advanced }: { advanced: boolean }) {
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

      {level === 'student' ? <StudentStructure advanced={advanced} /> : <SchoolContent key={level} level={level} />}
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

function StudentStructure({ advanced }: { advanced: boolean }) {
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
          <div className="flex items-center gap-2">
            {advanced && <ImportShenkarButton institutionId={inst.id} departmentId={dep.id} onDone={() => loadCourses(dep.id)} />}
            <AddCourseDialog institutionId={inst.id} departmentId={dep.id} onAdded={() => loadCourses(dep.id)} />
          </div>
        </div>
        {courses.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">עוד אין קורסים. הוסף קורס ←</div>
        ) : (
          <div className="space-y-6">
            {groupCourses(courses).map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-sm">{group.title}</h4>
                  <span className="text-xs text-muted-foreground">({group.courses.length})</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.courses.map((c) => (
                    <CourseCard key={c.id} course={c} advanced={advanced} onDelete={async () => { await deleteStructure('subject', c.id); loadCourses(dep.id) }} />
                  ))}
                </div>
              </div>
            ))}
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
              <Card key={d.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-2">
                  <button onClick={() => { setDep(d); loadCourses(d.id) }} className="flex-1 text-right font-medium">{d.name}</button>
                  <DeleteBtn label={`את המסלול "${d.name}"`} onConfirm={async () => { await deleteStructure('department', d.id); loadDepartments(inst.id) }} />
                </CardContent>
              </Card>
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
            <Card key={i.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-2">
                <button onClick={() => { setInst(i); loadDepartments(i.id) }} className="flex-1 text-right">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{i.type === 'university' ? 'אוניברסיטה' : 'מכללה'}</div>
                </button>
                <DeleteBtn label={`את המוסד "${i.name}"`} onConfirm={async () => { await deleteStructure('institution', i.id); loadInstitutions() }} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

const SEM_LABEL: Record<string, string> = { a: "סמסטר א'", b: "סמסטר ב'", both: 'שנתי' }
const SEM_ORDER: Record<string, number> = { a: 0, both: 1, b: 2 }

interface CourseGroup { key: string; title: string; courses: Subject[] }

/** מקבץ קורסים לפי שנה ואז סמסטר (א' → שנתי → ב') */
function groupCourses(courses: Subject[]): CourseGroup[] {
  const map = new Map<string, CourseGroup>()
  for (const c of courses) {
    const sem = c.semester ?? 'both'
    const key = `${c.gradeFrom}-${sem}`
    if (!map.has(key)) {
      map.set(key, { key, title: `שנה ${c.gradeFrom} — ${SEM_LABEL[sem] ?? ''}`, courses: [] })
    }
    map.get(key)!.courses.push(c)
  }
  return [...map.values()].sort((a, b) => {
    const [ya, sa] = a.key.split('-'); const [yb, sb] = b.key.split('-')
    return Number(ya) - Number(yb) || (SEM_ORDER[sa] ?? 9) - (SEM_ORDER[sb] ?? 9)
  })
}

function CourseCard({ course, onDelete, advanced }: { course: Subject; onDelete: () => Promise<void>; advanced: boolean }) {
  const pack = course.courseNumber ? CONTENT_PACKS[course.courseNumber] : undefined
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-2">
        <div className="flex-1 font-medium">
          {course.courseNumber && <span className="text-muted-foreground text-sm ml-1.5">{course.courseNumber}</span>}
          {course.nameHe}
        </div>
        {pack && advanced && <ImportContentButton course={course} />}
        <DeleteBtn label={`את הקורס "${course.nameHe}"`} onConfirm={onDelete} />
      </CardContent>
    </Card>
  )
}

function ImportContentButton({ course }: { course: Subject }) {
  const [busy, setBusy] = useState(false)
  const pack = CONTENT_PACKS[course.courseNumber ?? '']
  const run = async () => {
    const n = (pack.questions?.length ?? 0) + (pack.materials?.length ?? 0)
    if (!window.confirm(`לייבא תוכן מוכן (${pack.questions?.length ?? 0} שאלות, 3 משחקים, ${pack.materials?.length ?? 0} חומרי עזר) לקורס "${course.nameHe}"?`)) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/import-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ subjectId: course.id, grade: course.gradeFrom, pack }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) toast.success(`יובא תוכן (${d.imported ?? n} פריטים)`)
      else toast.error(d.error ?? 'הייבוא נכשל')
    } finally { setBusy(false) }
  }
  return (
    <Button variant="secondary" size="sm" onClick={run} disabled={busy} className="shrink-0">
      {busy ? <Loader2 className="w-4 h-4 animate-spin ml-1.5" /> : <Sparkles className="w-4 h-4 ml-1.5" />}
      ייבא תוכן
    </Button>
  )
}

function ImportShenkarButton({ institutionId, departmentId, onDone }: { institutionId: string; departmentId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    if (!window.confirm(`לייבא ${SHENKAR_BINYAN_COURSES.length} קורסים של שנה א' (הנדסאי בניין) למסלול זה?`)) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/import-courses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ departmentId, institutionId, courses: SHENKAR_BINYAN_COURSES }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) { toast.success(`יובאו ${d.imported ?? 0} קורסים`); onDone() }
      else toast.error(d.error ?? 'הייבוא נכשל')
    } finally { setBusy(false) }
  }
  return (
    <Button variant="outline" size="sm" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
      ייבא קורסי שנה א&apos;
    </Button>
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
  const [semester, setSemester] = useState('both')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try {
      await postStructure('subject', {
        nameHe, nameEn: nameHe, slug: slug || nameHe, level: 'student',
        institutionId, departmentId, gradeFrom: Number(year), gradeTo: Number(year),
        semester, icon: 'BookOpen', color: '#7C3AED',
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>שנה</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4].map((y) => <SelectItem key={y} value={String(y)}>שנה {y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>סמסטר</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">סמסטר א&apos;</SelectItem>
                  <SelectItem value="b">סמסטר ב&apos;</SelectItem>
                  <SelectItem value="both">שנתי</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
