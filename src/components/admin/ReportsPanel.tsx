'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flag, Loader2, Check, Trash2, RefreshCw, Eye, ChevronDown, ChevronLeft, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReportRow {
  id: string
  questionId: string
  subjectId: string
  subjectName: string
  grade: number
  prompt: string
  reason: string
  status: 'open' | 'resolved'
  createdAt: string | null
}

interface Group {
  key: string
  subjectName: string
  grade: number
  reports: ReportRow[]
  open: number
}

/** פאנל ניהול: מאגר השאלות שסומנו ע"י משתמשים — מקובץ לפי מקצוע וכיתה/שנה. */
export function ReportsPanel() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

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
    if (res.ok) { toast.success(status === 'resolved' ? 'סומן כטופל' : 'הוחזר לפתוח'); void load() }
    else toast.error('העדכון נכשל')
  }

  const remove = async (id: string) => {
    if (!window.confirm('למחוק את הדיווח?')) return
    const res = await fetch(`/api/admin/reports?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' })
    if (res.ok) { toast.success('נמחק'); setReports((p) => p.filter((r) => r.id !== id)) }
    else toast.error('המחיקה נכשלה')
  }

  // קיבוץ לפי מקצוע + כיתה/שנה
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    for (const r of reports) {
      const key = `${r.subjectName}__${r.grade}`
      if (!map.has(key)) map.set(key, { key, subjectName: r.subjectName, grade: r.grade, reports: [], open: 0 })
      const g = map.get(key)!
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
              <h3 className="font-bold font-display">שאלות שדווחו</h3>
              <p className="text-xs text-muted-foreground">
                {showResolved ? `${reports.length} דיווחים` : `${totalOpen} פתוחים`} · {groups.length} מקצועות
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowResolved((v) => !v)} className="gap-1.5">
              <Eye className="w-4 h-4" />{showResolved ? 'רק פתוחים' : 'הצג גם שטופלו'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => load()} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />רענן
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">אין דיווחים {showResolved ? '' : 'פתוחים'} 🎉</p>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => {
              const isOpen = expanded.has(g.key)
              const Chevron = isOpen ? ChevronDown : ChevronLeft
              return (
                <div key={g.key} className="rounded-2xl border border-border overflow-hidden">
                  {/* כותרת קבוצה — מקצוע + כיתה/שנה */}
                  <button
                    onClick={() => toggle(g.key)}
                    className="w-full flex items-center gap-3 p-3 bg-muted/40 hover:bg-muted/70 transition-colors text-right"
                  >
                    <Chevron className="w-4 h-4 text-muted-foreground shrink-0" />
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <span className="flex-1 font-medium">{g.subjectName}</span>
                    {g.grade > 0 && <span className="text-xs text-muted-foreground">שנה/כיתה {g.grade}</span>}
                    {g.open > 0
                      ? <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive">{g.open} פתוחים</span>
                      : <span className="text-xs px-2 py-0.5 rounded-lg bg-success/10 text-success">טופל</span>}
                  </button>

                  {/* תוכן הקבוצה */}
                  {isOpen && (
                    <div className="p-2 space-y-2">
                      {g.reports.map((r) => (
                        <div key={r.id} className={`rounded-xl border p-3 ${r.status === 'resolved' ? 'border-border opacity-60' : 'border-destructive/30'}`}>
                          <p className="text-sm font-medium mb-1" dir="auto">{r.prompt || r.questionId}</p>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-2">
                            {r.reason && <span className="px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive">{r.reason}</span>}
                            {r.createdAt && <span>{new Date(r.createdAt).toLocaleDateString('he-IL')}</span>}
                            <span className="font-mono" dir="ltr">{r.questionId}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {r.status === 'open' ? (
                              <Button variant="outline" size="sm" onClick={() => resolve(r.id, 'resolved')} className="h-7 gap-1 text-xs">
                                <Check className="w-3.5 h-3.5" />סמן כטופל
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
    </Card>
  )
}
