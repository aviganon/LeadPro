'use client'

import { useState } from 'react'
import { Flag, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getDeviceId } from '@/lib/device'

const REASONS = ['התשובה שגויה', 'ניסוח לא ברור', 'שגיאת כתיב', 'תשובה כפולה', 'לא רלוונטי']

/** כפתור ידידותי לדיווח על שאלה בעייתית — אנונימי, מסמן את השאלה לטיפול בניהול. */
export function ReportQuestionButton({
  questionId, subjectId, grade, prompt, className,
}: {
  questionId: string
  subjectId: string
  grade: number
  prompt: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/report-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, subjectId, grade, prompt, reason, deviceId: getDeviceId() }),
      })
      if (res.ok) {
        setDone(true); setOpen(false)
        toast.success('תודה! השאלה סומנה ותיבדק', { description: 'הדיווח עזר לנו לשפר את המאגר' })
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? 'הדיווח נכשל — נסו שוב')
      }
    } catch {
      toast.error('שגיאת רשת — נסו שוב')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-success ${className ?? ''}`}>
        <Check className="w-3.5 h-3.5" /> דווח, תודה
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors ${className ?? ''}`}
        title="דיווח על השאלה"
      >
        <Flag className="w-3.5 h-3.5" /> דיווח על השאלה
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Flag className="w-4 h-4 text-destructive" />דיווח על השאלה</DialogTitle>
            <DialogDescription>מה הבעיה בשאלה? (לא חובה לבחור — אפשר פשוט לשלוח)</DialogDescription>
          </DialogHeader>

          <p className="text-sm bg-muted/60 rounded-2xl p-3 line-clamp-3" dir="auto">{prompt}</p>

          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <Button
                key={r}
                type="button"
                variant={reason === r ? 'default' : 'outline'}
                size="sm"
                className="rounded-2xl"
                onClick={() => setReason((cur) => (cur === r ? '' : r))}
              >
                {r}
              </Button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="פירוט נוסף (לא חובה)…"
            rows={2}
            dir="auto"
            maxLength={300}
            className="w-full p-3 rounded-2xl border-2 border-border bg-card text-sm focus:border-primary outline-none resize-none"
          />

          <DialogFooter>
            <Button onClick={submit} disabled={busy} className="rounded-2xl">
              {busy ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Flag className="w-4 h-4 ml-2" />}
              שליחת דיווח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
