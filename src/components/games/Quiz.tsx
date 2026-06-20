'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, X, RotateCcw, ArrowLeft, Trophy, Loader2 } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import { useGameSession } from '@/hooks/useGameSession'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scoreboard } from './Scoreboard'
import { ReportQuestionButton } from '@/components/ReportQuestionButton'
import { burstConfetti } from '@/lib/confetti'
import { submitScore } from '@/lib/leaderboard'
import { getSavedName, saveName } from '@/lib/device'
import type { Question } from '@/types'

/** מערבב מערך (Fisher–Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isCorrectAnswer(q: Question, given: string): boolean {
  return given.trim().toLowerCase() === String(q.answer).trim().toLowerCase()
}

export function Quiz({
  questions, leaderboardScope, onComplete,
}: {
  questions: Question[]
  leaderboardScope?: string
  onComplete?: (correct: number, total: number, score: number) => void
}) {
  const { t } = useLocale()
  const session = useGameSession()
  const deck = useMemo(() => shuffle(questions), [questions])

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)

  // טבלת מנצחים
  const [name, setName] = useState(getSavedName())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const sendScore = async () => {
    if (!leaderboardScope || !name.trim()) return
    setSaving(true)
    saveName(name.trim())
    const r = await submitScore(leaderboardScope, name.trim(), session.score)
    setSaving(false)
    if (r.ok) setSaved(true)
  }

  // התקדמות אוטומטית לשאלה הבאה לאחר תשובה נכונה
  const advanceTimer = useRef<number | null>(null)
  const clearTimer = () => { if (advanceTimer.current) { window.clearTimeout(advanceTimer.current); advanceTimer.current = null } }
  useEffect(() => clearTimer, [])

  if (deck.length === 0) return null

  const q = deck[idx]
  const options = q.type === 'truefalse' ? ['נכון', 'לא נכון'] : q.options ?? []

  const submit = (value: string) => {
    if (revealed) return
    const ok = isCorrectAnswer(q, value)
    setSelected(value)
    setRevealed(true)
    session.record(ok)
    if (ok) { clearTimer(); advanceTimer.current = window.setTimeout(() => next(), 900) }
  }

  const next = () => {
    clearTimer()
    if (idx + 1 >= deck.length) {
      setDone(true)
      burstConfetti(60)
      onComplete?.(session.correct, deck.length, session.score)
      return
    }
    setIdx(idx + 1)
    setSelected(null)
    setTyped('')
    setRevealed(false)
  }

  const restart = () => {
    clearTimer()
    setIdx(0); setSelected(null); setTyped(''); setRevealed(false); setDone(false); setSaved(false)
    session.reset()
  }

  if (done) {
    return (
      <div className="text-center py-8 animate-pop max-w-md mx-auto">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-2xl font-bold font-display mb-2">{t('game.youGot')} {session.score} {t('game.points')}!</h3>
        <p className="text-muted-foreground mb-6">{session.correct}/{deck.length} ✓</p>

        {leaderboardScope && (
          saved ? (
            <div className="mb-6 p-4 rounded-2xl bg-success/10 text-success font-medium flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" /> {t('lb.joined')}
            </div>
          ) : (
            <div className="mb-6 gradient-card rounded-2xl border border-border p-4 text-right">
              <div className="font-medium mb-2 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-fun" />{t('lb.join')}</div>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('lb.namePlaceholder')}
                  maxLength={20}
                  dir="auto"
                  onKeyDown={(e) => { if (e.key === 'Enter') sendScore() }}
                />
                <Button onClick={sendScore} disabled={saving || !name.trim()} className="rounded-2xl shrink-0">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('lb.submit')}
                </Button>
              </div>
            </div>
          )
        )}

        <Button onClick={restart} variant={leaderboardScope && !saved ? 'outline' : 'default'} className="rounded-2xl">
          <RotateCcw className="w-4 h-4 ml-2" />{t('game.again')}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Scoreboard session={session} />

      <div className="mb-2 text-sm text-muted-foreground text-center">{idx + 1} / {deck.length}</div>
      <div className="gradient-card rounded-3xl p-8 border border-border mb-3">
        <p className="text-xl md:text-2xl font-semibold text-center font-display" dir="auto">{q.prompt}</p>
      </div>
      <div className="flex justify-end mb-4">
        <ReportQuestionButton key={q.id} questionId={q.id} subjectId={q.subjectId} grade={q.grade} prompt={q.prompt} />
      </div>

      {options.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((opt, i) => {
            const isAns = isCorrectAnswer(q, opt)
            const isSel = selected === opt
            let cls = 'bg-card border-border hover:border-primary/40'
            if (revealed && isAns) cls = 'bg-success/15 border-success text-success'
            else if (revealed && isSel && !isAns) cls = 'bg-destructive/15 border-destructive text-destructive animate-shake'
            return (
              <button
                key={i}
                onClick={() => submit(opt)}
                disabled={revealed}
                className={`p-4 rounded-2xl border-2 font-medium transition-all flex items-center justify-between ${cls}`}
                dir="auto"
              >
                <span>{opt}</span>
                {revealed && isAns && <Check className="w-5 h-5" />}
                {revealed && isSel && !isAns && <X className="w-5 h-5" />}
              </button>
            )
          })}
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (typed.trim()) submit(typed) }}
          className="flex gap-2"
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={revealed}
            dir="auto"
            className="flex-1 p-4 rounded-2xl border-2 border-border bg-card text-lg text-center focus:border-primary outline-none"
            placeholder="…"
          />
          <Button type="submit" disabled={revealed || !typed.trim()} className="rounded-2xl h-auto px-6">{t('game.check')}</Button>
        </form>
      )}

      {revealed && (
        <div className="mt-6 animate-slide-up">
          <div className={`text-center font-bold text-lg font-display ${isCorrectAnswer(q, selected ?? typed) ? 'text-success' : 'text-destructive'}`}>
            {isCorrectAnswer(q, selected ?? typed) ? t('game.correct') : `${t('game.wrong')} — ${q.answer}`}
          </div>
          {q.explanation && <p className="text-center text-muted-foreground mt-2" dir="auto">{q.explanation}</p>}
          {/* תשובה נכונה → התקדמות אוטומטית; תשובה שגויה → כפתור ידני (כדי ללמוד מהתשובה) */}
          {!isCorrectAnswer(q, selected ?? typed) && (
            <div className="flex justify-center mt-5">
              <Button onClick={next} size="lg" className="rounded-2xl">
                {idx + 1 >= deck.length ? t('game.finish') : t('game.next')}
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
