'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Clock, Trophy, RotateCcw, Check, X, ArrowLeft, ArrowRight, Loader2, Flag, Timer, ListChecks, Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReportQuestionButton } from '@/components/ReportQuestionButton'
import { burstConfetti } from '@/lib/confetti'
import { submitScore } from '@/lib/leaderboard'
import { getSavedName, saveName } from '@/lib/device'
import type { Question } from '@/types'

const PASS_GRADE = 60

interface Preset { id: string; label: string; emoji: string; count: number | 'all'; minutes: number; desc: string }
const PRESETS: Preset[] = [
  { id: 'quick', label: 'מהיר', emoji: '⚡', count: 10, minutes: 10, desc: '10 שאלות · 10 דקות' },
  { id: 'standard', label: 'משרד החינוך', emoji: '🎯', count: 25, minutes: 30, desc: '25 שאלות · 30 דקות' },
  { id: 'full', label: 'מלא', emoji: '📚', count: 'all', minutes: 0, desc: 'כל השאלות · ללא הגבלת זמן' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isCorrect(q: Question, given: string | undefined): boolean {
  if (given == null) return false
  return given.trim().toLowerCase() === String(q.answer).trim().toLowerCase()
}

function fmtTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

type Phase = 'config' | 'running' | 'done'

export function Exam({
  questions, leaderboardScope, onComplete,
}: {
  questions: Question[]
  leaderboardScope?: string
  onComplete?: (grade: number) => void
}) {
  const available = questions.length

  const [phase, setPhase] = useState<Phase>('config')
  const [customCount, setCustomCount] = useState(Math.min(25, available || 25))
  const [customMin, setCustomMin] = useState(30)

  // running state
  const [deck, setDeck] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [idx, setIdx] = useState(0)
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // done state
  const [grade, setGrade] = useState(0)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration read of saved name (avoids SSR mismatch)
  useEffect(() => { setName(getSavedName()) }, [])

  const start = useCallback((count: number | 'all', minutes: number) => {
    const n = count === 'all' ? available : Math.min(count, available)
    const d = shuffle(questions).slice(0, Math.max(1, n))
    const t = Date.now()
    setDeck(d)
    setAnswers({})
    setIdx(0)
    setEndsAt(minutes > 0 ? t + minutes * 60_000 : null)
    setNow(t)
    setSaved(false)
    setPhase('running')
  }, [questions, available])

  // חישוב ציון וסיום המבחן
  const finish = useCallback(() => {
    const correct = deck.reduce((acc, q, i) => acc + (isCorrect(q, answers[i]) ? 1 : 0), 0)
    const g = deck.length ? Math.round((correct / deck.length) * 100) : 0
    setGrade(g)
    setPhase('done')
    if (g >= PASS_GRADE) burstConfetti(80)
    onComplete?.(g)
  }, [deck, answers, onComplete])

  // ref מעודכן כדי שטיימר ההשהיה יקרא תמיד לגרסה האחרונה (בלי לבנות מחדש את ה-interval בכל תשובה)
  const finishRef = useRef(finish)
  useEffect(() => { finishRef.current = finish }, [finish])

  // countdown
  useEffect(() => {
    if (phase !== 'running' || !endsAt) return
    const id = window.setInterval(() => {
      const t = Date.now()
      if (t >= endsAt) finishRef.current()
      else setNow(t)
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase, endsAt])

  const correctCount = useMemo(
    () => deck.reduce((acc, q, i) => acc + (isCorrect(q, answers[i]) ? 1 : 0), 0),
    [deck, answers],
  )

  const sendScore = async () => {
    if (!leaderboardScope || !name.trim()) return
    setSaving(true)
    saveName(name.trim())
    const r = await submitScore(leaderboardScope, name.trim(), grade)
    setSaving(false)
    if (r.ok) setSaved(true)
  }

  // ===== CONFIG =====
  if (phase === 'config') {
    if (available === 0) {
      return <div className="py-12 text-center text-muted-foreground">עוד אין שאלות מבחן למקצוע זה — בקרוב!</div>
    }
    return (
      <div className="max-w-2xl mx-auto">
        <div className="gradient-card rounded-3xl border border-border p-6 mb-6 text-center">
          <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-display mb-1">מבחן</h3>
          <p className="text-sm text-muted-foreground">
            ציון עובר <b className="text-foreground">{PASS_GRADE}</b> · {available} שאלות במאגר · התוצאה נכנסת לטבלת המנצחים
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          {PRESETS.map((p) => {
            const n = p.count === 'all' ? available : Math.min(p.count, available)
            return (
              <button
                key={p.id}
                onClick={() => start(p.count, p.minutes)}
                className="gradient-card rounded-3xl p-5 border border-border hover-lift text-center"
              >
                <div className="text-3xl mb-2">{p.emoji}</div>
                <div className="font-bold font-display">{p.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{n} שאלות</div>
                <div className="text-xs text-muted-foreground">{p.minutes > 0 ? `${p.minutes} דקות` : 'ללא זמן'}</div>
              </button>
            )
          })}
        </div>

        <div className="rounded-3xl border border-border p-5">
          <div className="font-medium mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4 text-primary" />מבחן מותאם אישית</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <label className="space-y-1.5">
              <span className="text-sm text-muted-foreground">מספר שאלות (1–{available})</span>
              <Input
                type="number" min={1} max={available} value={customCount}
                onChange={(e) => setCustomCount(Math.max(1, Math.min(available, Number(e.target.value) || 1)))}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm text-muted-foreground">דקות (0 = ללא זמן)</span>
              <Input
                type="number" min={0} max={180} value={customMin}
                onChange={(e) => setCustomMin(Math.max(0, Math.min(180, Number(e.target.value) || 0)))}
              />
            </label>
          </div>
          <Button onClick={() => start(customCount, customMin)} className="w-full rounded-2xl" size="lg">
            <Timer className="w-4 h-4 ml-2" />התחל מבחן
          </Button>
        </div>
      </div>
    )
  }

  // ===== DONE =====
  if (phase === 'done') {
    const passed = grade >= PASS_GRADE
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-3xl border p-8 text-center mb-6 ${passed ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5'}`}>
          <div className="text-6xl mb-3">{passed ? '🎉' : '💪'}</div>
          <div className="text-5xl font-bold font-display mb-1" style={{ color: passed ? 'var(--success)' : 'var(--destructive)' }}>{grade}</div>
          <div className={`font-bold mb-2 ${passed ? 'text-success' : 'text-destructive'}`}>{passed ? 'עברת!' : `לא עברת (נדרש ${PASS_GRADE})`}</div>
          <p className="text-muted-foreground">{correctCount}/{deck.length} תשובות נכונות</p>
        </div>

        {leaderboardScope && (
          saved ? (
            <div className="mb-6 p-4 rounded-2xl bg-success/10 text-success font-medium flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" /> הציון נשמר בטבלת המנצחים! 🎉
            </div>
          ) : (
            <div className="mb-6 gradient-card rounded-2xl border border-border p-4">
              <div className="font-medium mb-2 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-fun" />שמרו את הציון בטבלת המנצחים</div>
              <div className="flex gap-2">
                <Input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="השם שלך" maxLength={20} dir="auto"
                  onKeyDown={(e) => { if (e.key === 'Enter') sendScore() }}
                />
                <Button onClick={sendScore} disabled={saving || !name.trim()} className="rounded-2xl shrink-0">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמור'}
                </Button>
              </div>
            </div>
          )
        )}

        {/* סקירת תשובות */}
        <div className="space-y-3 mb-6">
          <div className="font-bold font-display flex items-center gap-2"><ListChecks className="w-4 h-4 text-primary" />סקירת התשובות</div>
          {deck.map((q, i) => {
            const ok = isCorrect(q, answers[i])
            return (
              <div key={q.id} className={`rounded-2xl border p-4 ${ok ? 'border-success/30' : 'border-destructive/30'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className={`shrink-0 mt-0.5 ${ok ? 'text-success' : 'text-destructive'}`}>{ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}</span>
                  <p className="font-medium text-sm" dir="auto">{i + 1}. {q.prompt}</p>
                </div>
                {!ok && (
                  <div className="text-sm space-y-0.5 pr-6">
                    <div className="text-destructive">התשובה שלך: {answers[i] ?? '— (לא נענתה)'}</div>
                    <div className="text-success">התשובה הנכונה: {q.answer}</div>
                  </div>
                )}
                {q.explanation && <p className="text-xs text-muted-foreground mt-1.5 pr-6" dir="auto">{q.explanation}</p>}
                <div className="flex justify-end mt-2">
                  <ReportQuestionButton questionId={q.id} subjectId={q.subjectId} grade={q.grade} prompt={q.prompt} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-center">
          <Button onClick={() => setPhase('config')} variant="outline" className="rounded-2xl">
            <RotateCcw className="w-4 h-4 ml-2" />מבחן נוסף
          </Button>
        </div>
      </div>
    )
  }

  // ===== RUNNING =====
  const q = deck[idx]
  const options = q.type === 'truefalse' ? ['נכון', 'לא נכון'] : q.options ?? []
  const answeredCount = Object.keys(answers).length
  const remaining = endsAt ? endsAt - now : 0
  const lowTime = endsAt && remaining < 60_000

  const choose = (val: string) => setAnswers((a) => ({ ...a, [idx]: val }))
  const go = (d: number) => setIdx((i) => Math.max(0, Math.min(deck.length - 1, i + d)))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground flex items-center gap-1.5">
          <ListChecks className="w-4 h-4" />נענו {answeredCount}/{deck.length}
        </div>
        {endsAt && (
          <div className={`flex items-center gap-1.5 font-bold font-display ${lowTime ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
            <Clock className="w-4 h-4" />{fmtTime(remaining)}
          </div>
        )}
      </div>

      {/* progress dots */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {deck.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-6 h-6 rounded-lg text-xs font-medium transition-colors ${
              i === idx ? 'bg-primary text-primary-foreground'
              : answers[i] != null ? 'bg-primary/20 text-primary'
              : 'bg-muted text-muted-foreground'
            }`}
            aria-label={`שאלה ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="text-sm text-muted-foreground mb-2">שאלה {idx + 1} מתוך {deck.length}</div>
      <div className="gradient-card rounded-3xl p-6 border border-border mb-3">
        <p className="text-lg md:text-xl font-semibold font-display" dir="auto">{q.prompt}</p>
      </div>
      <div className="flex justify-end mb-4">
        <ReportQuestionButton questionId={q.id} subjectId={q.subjectId} grade={q.grade} prompt={q.prompt} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        {options.map((opt, i) => {
          const sel = answers[idx] === opt
          return (
            <button
              key={i}
              onClick={() => choose(opt)}
              className={`p-4 rounded-2xl border-2 font-medium transition-all text-right ${sel ? 'bg-primary/15 border-primary text-primary' : 'bg-card border-border hover:border-primary/40'}`}
              dir="auto"
            >
              {opt}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => go(-1)} disabled={idx === 0} className="gap-1">
          <ArrowRight className="w-4 h-4" />הקודמת
        </Button>
        {idx + 1 < deck.length ? (
          <Button onClick={() => go(1)} className="rounded-2xl gap-1">
            הבאה<ArrowLeft className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => { if (window.confirm(`לסיים את המבחן? נענו ${answeredCount} מתוך ${deck.length} שאלות.`)) finish() }}
            className="rounded-2xl gap-1"
          >
            <Flag className="w-4 h-4" />סיים והגש
          </Button>
        )}
      </div>

      {idx + 1 < deck.length && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => { if (window.confirm(`לסיים את המבחן עכשיו? נענו ${answeredCount} מתוך ${deck.length} שאלות.`)) finish() }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            סיים והגש עכשיו
          </button>
        </div>
      )}
    </div>
  )
}
