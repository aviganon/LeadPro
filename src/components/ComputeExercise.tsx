'use client'

import { useState } from 'react'
import { Check, X, Film, Calculator, ArrowRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GuidedSolution, type GuidedSol } from '@/components/GuidedSolution'
import { burstConfetti } from '@/lib/confetti'

/** תרגיל חישובי — מזינים תשובה מספרית, נבדקת אוטומטית, עם פתרון מודרך כעזרה. */
export function ComputeExercise({ sol, onBack }: { sol: GuidedSol; onBack?: () => void }) {
  const [val, setVal] = useState('')
  const [result, setResult] = useState<null | boolean>(null)
  const [showSol, setShowSol] = useState(false)

  const tol = sol.tolerance ?? Math.max(0.01, Math.abs(sol.answer) * 0.02)

  const check = () => {
    const n = parseFloat(val.replace(',', '.').trim())
    if (Number.isNaN(n)) { setResult(null); return }
    const ok = Math.abs(n - sol.answer) <= tol
    setResult(ok)
    if (ok) burstConfetti(50)
  }

  const reset = () => { setVal(''); setResult(null) }

  return (
    <div className="max-w-2xl mx-auto">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 gap-1">
          <ArrowRight className="w-4 h-4" />חזרה לרשימה
        </Button>
      )}

      <div className="flex items-start gap-2 mb-4">
        <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold font-display text-lg leading-tight">{sol.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5" dir="rtl">{sol.question}</p>
        </div>
      </div>

      {/* קלט תשובה */}
      <div className="gradient-card rounded-3xl border border-border p-5 mb-4">
        <label className="text-sm text-muted-foreground mb-2 block">התשובה שלך:</label>
        <div className="flex gap-2 items-center">
          <Input
            type="text" inputMode="decimal" value={val}
            onChange={(e) => { setVal(e.target.value); setResult(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') check() }}
            placeholder="הקלד מספר…" dir="ltr" className="text-lg text-center"
          />
          {sol.unit && <span className="text-muted-foreground font-medium shrink-0">{sol.unit}</span>}
          <Button onClick={check} disabled={!val.trim()} className="rounded-2xl shrink-0">בדוק</Button>
        </div>

        {result === true && (
          <div className="mt-4 p-3 rounded-2xl bg-success/10 text-success flex items-center gap-2 font-medium animate-pop">
            <Check className="w-5 h-5" /> כל הכבוד! התשובה נכונה ({sol.answer} {sol.unit})
          </div>
        )}
        {result === false && (
          <div className="mt-4 p-3 rounded-2xl bg-destructive/10 text-destructive animate-shake">
            <div className="flex items-center gap-2 font-medium"><X className="w-5 h-5" />לא מדויק — נסה שוב, או צפה בפתרון המודרך 👇</div>
            <Button variant="ghost" size="sm" onClick={reset} className="mt-1 h-7 gap-1 text-xs text-destructive hover:text-destructive">
              <RotateCcw className="w-3.5 h-3.5" />נסה שוב
            </Button>
          </div>
        )}
      </div>

      {/* פתרון מודרך — עזרה */}
      <Button
        variant={showSol ? 'secondary' : 'outline'}
        onClick={() => setShowSol((v) => !v)}
        className="w-full rounded-2xl gap-2 mb-4"
      >
        <Film className="w-4 h-4 text-fun" />{showSol ? 'הסתר פתרון מודרך' : 'הצג פתרון מודרך 🎬'}
      </Button>

      {showSol && (
        <div className="animate-slide-up">
          <GuidedSolution sol={sol} />
        </div>
      )}
    </div>
  )
}
