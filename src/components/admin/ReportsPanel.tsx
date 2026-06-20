'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flag, Loader2, Check, Trash2, RefreshCw, Eye, ChevronDown, ChevronLeft, Tag, Pencil, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface ReportRow {
  id: string
  questionId: string
  subjectId: string
  subjectName: string
  grade: number
  prompt: string
  reason: string
  topic: string
  needsReview: boolean
  status: 'open' | 'resolved'
  createdAt: string | null
  options: string[]
  answer: string
  explanation: string
  difficulty: number
}

interface Group { key: string; topic: string; reports: ReportRow[]; open: number }

/** פאנל ניהול: שאלות בעייתיות (דווחו ע"י משתמשים או "לבדיקה") — מקובץ לפי נושא, עם עריכה. */
export function ReportsPanel() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<ReportRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports${showResolved ? '?all=1' : ''}`, { credentials: 'same-origin' })
      if (!res.ok) throw new Error('failed')
      const d = await res.json()
      setReports(d.reports ?? [])
    } catch {
      toast.error('טעינת הדיווחים נכשלה')
    } finally {
      setLoading(false)
    }
  }, [showResolved])

  useEffect(() => { void load() }, [load])

  const resolve = async (id: string, status: 'open' | 'resolved') => {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) { toast.success(status === 'resolved' ? 'אושר — השאלה חזרה למאגר' : 'הוחזר לפתוח'); void load() }
    else toast.error('העדכון נכשל')
  }

  const remove = async (id: string) => {
    if (!window.confirm('למחוק את הדיווח?')) return
    const res = await fetch(`/api/admin/reports?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' })
    if (res.ok) { toast.success('נמחק'); setReports((p) => p.filter((r) => r.id !== id)) }
    else toast.error('המחיקה נכשלה')
  }

  // קיבוץ לפי נושא
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    for (const r of reports) {
      const topic = r.topic || 'ללא נושא'
      if (!map.has(topic)) map.set(topic, { key: topic, topic, reports: [], open: 0 })
      const g = map.get(topic)!
      g.reports.push(r)
      if (r.status === 'open') g.open++
    }
    return [...map.values()].sort((a, b) => b.open - a.open || b.reports.length - a.reports.length)
  }, [reports])

  const totalOpen = reports.filter((r) => r.status === 'open').length
  const toggle = (key: string) => setExpanded((s) => {
    const n = new Set(s)
    if (n.has(key)) n.delete(key); else n.add(key)
    return n
  })

  return (
    <Card className="border-destructive/30">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display">שאלות לטיפול</h3>
              <p className="text-xs text-muted-foreground">
                {showResolved ? `${reports.length} סה"כ` : `${totalOpen} פתוחות`} · {groups.length} נושאים
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowResolved((v) => !v)} className="gap-1.5">
              <Eye className="w-4 h-4" />{showResolved ? 'רק פתוחות' : 'הצג גם שטופלו'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => load()} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />רענן
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">אין שאלות לטיפול {showResolved ? '' : 'פתוחות'} 🎉</p>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => {
              const isOpen = expanded.has(g.key)
              const Chevron = isOpen ? ChevronDown : ChevronLeft
              return (
                <div key={g.key} className="rounded-2xl border border-border overflow-hidden">
                  {/* כותרת קבוצה — נושא */}
                  <button
                    onClick={() => toggle(g.key)}
                    className="w-full flex items-center gap-3 p-3 bg-muted/40 hover:bg-muted/70 transition-colors text-right"
                  >
                    <Chevron className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Tag className="w-4 h-4 text-primary shrink-0" />
                    <span className="flex-1 font-medium">{g.topic}</span>
                    {g.open > 0
                      ? <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive">{g.open} פתוחות</span>
                      : <span className="text-xs px-2 py-0.5 rounded-lg bg-success/10 text-success">טופל</span>}
                  </button>

                  {isOpen && (
                    <div className="p-2 space-y-2">
                      {g.reports.map((r) => (
                        <div key={r.id} className={`rounded-xl border p-3 ${r.status === 'resolved' ? 'border-border opacity-60' : r.needsReview ? 'border-fun/40' : 'border-destructive/30'}`}>
                          <div className="flex items-start gap-2 mb-1">
                            {r.needsReview && <AlertTriangle className="w-4 h-4 text-fun shrink-0 mt-0.5" />}
                            <p className="text-sm font-medium" dir="auto">{r.prompt || r.questionId}</p>
                          </div>
                          {r.answer && <p className="text-xs text-success mb-1" dir="auto">תשובה נוכחית: {r.answer}</p>}
                          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-2">
                            {r.reason && <span className="px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive">{r.reason}</span>}
                            {r.createdAt && <span>{new Date(r.createdAt).toLocaleDateString('he-IL')}</span>}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => setEditing(r)} className="h-7 gap-1 text-xs">
                              <Pencil className="w-3.5 h-3.5" />ערוך
                            </Button>
                            {r.status === 'open' ? (
                              <Button variant="outline" size="sm" onClick={() => resolve(r.id, 'resolved')} className="h-7 gap-1 text-xs text-success hover:text-success">
                                <Check className="w-3.5 h-3.5" />אשר והחזר למאגר
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => resolve(r.id, 'open')} className="h-7 text-xs">החזר לפתוח</Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => remove(r.id)} className="h-7 text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {editing && <EditQuestionDialog report={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load() }} />}
    </Card>
  )
}

// ===== עריכת שאלה =====
function EditQuestionDialog({ report, onClose, onSaved }: { report: ReportRow; onClose: () => void; onSaved: () => void }) {
  const [prompt, setPrompt] = useState(report.prompt)
  const [options, setOptions] = useState<string[]>(report.options.length ? [...report.options] : ['', '', '', ''])
  const [answer, setAnswer] = useState(report.answer)
  const [explanation, setExplanation] = useState(report.explanation)
  const [topic, setTopic] = useState(report.topic)
  const [difficulty, setDifficulty] = useState(report.difficulty || 2)
  const [busy, setBusy] = useState(false)

  const setOpt = (i: number, v: string) => setOptions((o) => o.map((x, j) => (j === i ? v : x)))

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ id: report.id, action: 'edit', question: { prompt, options, answer, explanation, difficulty, topic } }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) { toast.success('השאלה עודכנה'); onSaved() }
      else toast.error(d.error ?? 'העדכון נכשל')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4" />עריכת שאלה</DialogTitle>
          <DialogDescription>בחרו את התשובה הנכונה על ידי לחיצה על העיגול שלצד האפשרות</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>ניסוח השאלה</Label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} dir="auto"
              className="w-full p-3 rounded-2xl border-2 border-border bg-card text-sm focus:border-primary outline-none resize-none" />
          </div>

          <div className="space-y-2">
            <Label>אפשרויות (סמנו את הנכונה)</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button type="button" onClick={() => setAnswer(opt)}
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${answer === opt && opt ? 'border-success bg-success text-white' : 'border-border'}`}
                  title="סמן כתשובה נכונה">
                  {answer === opt && opt && <Check className="w-3 h-3" />}
                </button>
                <Input value={opt} onChange={(e) => { const v = e.target.value; setOpt(i, v); if (answer === opt) setAnswer(v) }} dir="auto" placeholder={`אפשרות ${i + 1}`} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>נושא</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} dir="auto" placeholder="למשל: פיגומים" /></div>
            <div className="space-y-1.5">
              <Label>רמת קושי</Label>
              <div className="flex gap-1">
                {[1, 2, 3].map((d) => (
                  <Button key={d} type="button" variant={difficulty === d ? 'default' : 'outline'} size="sm" onClick={() => setDifficulty(d)} className="flex-1 rounded-xl">
                    {d === 1 ? 'קל' : d === 2 ? 'בינוני' : 'קשה'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>הסבר (לא חובה)</Label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} dir="auto"
              className="w-full p-3 rounded-2xl border-2 border-border bg-card text-sm focus:border-primary outline-none resize-none" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>ביטול</Button>
          <Button onClick={save} disabled={busy} className="rounded-2xl">
            {busy ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />}שמירה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
