'use client'

import { useCallback, useEffect, useState } from 'react'
import { Flag, Loader2, Check, Trash2, RefreshCw, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReportRow {
  id: string
  questionId: string
  subjectId: string
  grade: number
  prompt: string
  reason: string
  status: 'open' | 'resolved'
  createdAt: string | null
}

/** פאנל ניהול: מאגר השאלות שסומנו ע"י משתמשים, לטיפול. */
export function ReportsPanel() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)

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

  const openCount = reports.filter((r) => r.status === 'open').length

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
              <p className="text-xs text-muted-foreground">{showResolved ? 'כל הדיווחים' : `${openCount} דיווחים פתוחים`}</p>
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
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">אין דיווחים {showResolved ? '' : 'פתוחים'} 🎉</p>
        ) : (
          <div className="space-y-2.5">
            {reports.map((r) => (
              <div key={r.id} className={`rounded-2xl border p-3 ${r.status === 'resolved' ? 'border-border opacity-60' : 'border-destructive/30'}`}>
                <p className="text-sm font-medium mb-1" dir="auto">{r.prompt || r.questionId}</p>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-2">
                  {r.reason && <span className="px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive">{r.reason}</span>}
                  <span dir="ltr">{r.subjectId}</span>
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
      </CardContent>
    </Card>
  )
}
