'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, Film, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SolStep {
  title: string
  math?: string
  on: string[]        // מזהי חלקים בדיאגרמה שמודגשים בשלב זה
}

export interface GuidedSol {
  id: string
  title: string
  question: string
  steps: SolStep[]
  /** דיאגרמה — מקבלת אילו חלקים פעילים בשלב הנוכחי */
  Diagram: (props: { active: Set<string> }) => React.ReactElement
}

/** נגן "פתרון מודרך" — הסבר מונפש שלב-אחר-שלב לתרגיל חישובי. */
export function GuidedSolution({ sol, onBack }: { sol: GuidedSol; onBack?: () => void }) {
  const [step, setStep] = useState(0)
  const active = useMemo(() => new Set(sol.steps[step]?.on ?? []), [sol.steps, step])
  const last = step === sol.steps.length - 1
  const s = sol.steps[step]

  return (
    <div className="max-w-2xl mx-auto">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 gap-1">
          <ArrowRight className="w-4 h-4" />חזרה לרשימה
        </Button>
      )}

      <div className="flex items-start gap-2 mb-4">
        <div className="w-9 h-9 rounded-2xl bg-fun/10 text-fun flex items-center justify-center shrink-0">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold font-display text-lg leading-tight">{sol.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5" dir="rtl">{sol.question}</p>
        </div>
      </div>

      {/* דיאגרמה */}
      <div className="rounded-3xl bg-muted/50 border border-border p-3 mb-4">
        <sol.Diagram active={active} />
      </div>

      {/* מחוון התקדמות */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground shrink-0">{step + 1} / {sol.steps.length}</span>
        <div className="flex gap-1.5 flex-1">
          {sol.steps.map((_, k) => (
            <div key={k} className="h-1 flex-1 rounded-full transition-colors" style={{ background: k <= step ? 'var(--primary)' : 'var(--border)' }} />
          ))}
        </div>
      </div>

      {/* טקסט השלב + החישוב */}
      <div className="gradient-card rounded-3xl border border-border p-5 mb-4 min-h-[6.5rem]">
        <p className="font-medium mb-2" dir="rtl">{s.title}</p>
        {s.math && <p className="text-xl md:text-2xl font-mono text-primary" dir="ltr">{s.math}</p>}
      </div>

      {/* ניווט */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep((i) => Math.max(0, i - 1))} disabled={step === 0} className="gap-1">
          <ChevronRight className="w-4 h-4" />הקודם
        </Button>
        <Button onClick={() => setStep((i) => (last ? 0 : i + 1))} className="rounded-2xl gap-1">
          {last ? <><RotateCcw className="w-4 h-4" />שוב</> : <>הבא<ChevronLeft className="w-4 h-4" /></>}
        </Button>
      </div>
    </div>
  )
}
