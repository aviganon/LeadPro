'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Clock, Trophy, RotateCcw, Check, X, ArrowLeft, ArrowRight, Loader2, Flag, Timer, ListChecks, Award,
  Shuffle, FileText, Bookmark, BookmarkCheck, CheckCircle2, LogIn,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReportQuestionButton } from '@/components/ReportQuestionButton'
import { useAuth } from '@/context/AuthContext'
import { getExamResults, saveExamResult } from '@/lib/db'
import { burstConfetti } from '@/lib/confetti'
import { submitScore } from '@/lib/leaderboard'
import { getSavedName, saveName } from '@/lib/device'
import type { Question, ExamResult } from '@/types'

const PASS_GRADE = 60
const MIXED = 'mixed'

interface Preset { id: string; label: string; emoji: string; count: number | 'all'; minutes: number }
const QUICK: Preset = { id: 'quick', label: 'מהיר', emoji: '⚡', count: 10, minutes: 10 }
const FULL: Preset = { id: 'full', label: 'מלא', emoji: '📚', count: 'all', minutes: 0 }
const PRESETS_MAHAT: Preset[] = [QUICK, { id: 'mahat', label: 'מתכונת מה"ט', emoji: '🎯', count: 50, minutes: 180 }, FULL]
const PRESETS_STD: Preset[] = [QUICK, { id: 'std', label: 'רגיל', emoji: '🎯', count: 20, minutes: 0 }, FULL]

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
  questions, leaderboardScope, subjectId, grade, mahat = false, onComplete,
}: {
  questions: Question[]
  leaderboardScope?: string
  subjectId?: string
  grade?: number
  mahat?: boolean       // קורס מה"ט (בטיחות) → מתכונת 50/180; אחרת מבחן רגיל
  onComplete?: (grade: number) => void
}) {
  const { user } = useAuth()
  const available = questions.length
  const PRESETS = mahat ? PRESETS_MAHAT : PRESETS_STD

  // מבחנים אמיתיים שזוהו (לבחירת "מבחן ספציפי"); ריק = רק מאגר מעורבב
  const papers = useMemo(
    () => [...new Set(questions.map((q) => q.examPaper).filter((p): p is string => !!p))],
    [questions],
  )

  const [phase, setPhase] = useState<Phase>('config')
  const [mode, setMode] = useState<'mixed' | 'specific'>('mixed')
  const [customCount, setCustomCount] = useState(Math.min(mahat ? 50 : 20, available || (mahat ? 50 : 20)))
  const [customMin, setCustomMin] = useState(mahat ? 180 : 0)

  // running state
  const [deck, setDeck] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [idx, setIdx] = useState(0)
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [currentPaper, setCurrentPaper] = useState<string>(MIXED)
  const [reviewPrompt, setReviewPrompt] = useState(false)

  // done state
  const [grade_, setGrade] = useState(0)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // היסטוריית מבחנים של משתמש רשום
  const [history, setHistory] = useState<ExamResult[]>([])
  const doneByPaper = useMemo(() => {
    const m = new Map<string, ExamResult>()
    for (const r of history) m.set(r.paper, r)
    return m
  }, [history])

  const loadHistory = useCallback(() => {
    if (!user || !subjectId) { setHistory([]); return }
    getExamResults(user.id, subjectId, grade ?? 1).then(setHistory).catch(() => setHistory([]))
  }, [user, subjectId, grade])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch exam history on deps change
  useEffect(() => { loadHistory() }, [loadHistory])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration read of saved name (avoids SSR mismatch)
  useEffect(() => { setName(getSavedName()) }, [])

  const begin = useCallback((d: Question[], minutes: number, paper: string) => {
    const t = Date.now()
    setDeck(d)
    setAnswers({})
    setFlagged(new Set())
    setIdx(0)
    setEndsAt(minutes > 0 ? t + minutes * 60_000 : null)
    setNow(t)
    setSaved(false)
    setReviewPrompt(false)
    setCurrentPaper(paper)
    setPhase('running')
  }, [])

  // מבחן מעורבב — שאלות אקראיות מכל המאגר
  const start = useCallback((count: number | 'all', minutes: number) => {
    const n = count === 'all' ? available : Math.min(count, available)
    begin(shuffle(questions).slice(0, Math.max(1, n)), minutes, MIXED)
  }, [questions, available, begin])

  // מבחן ספציפי — כל שאלות מבחן מסוים, בסדר המקורי
  const startPaper = useCallback((paper: string, minutes: number) => {
    begin(questions.filter((q) => q.examPaper === paper), minutes, paper)
  }, [questions, begin])

  // חישוב ציון וסיום המבחן
  const finish = useCallback(() => {
    const correct = deck.reduce((acc, q, i) => acc + (isCorrect(q, answers[i]) ? 1 : 0), 0)
    const g = deck.length ? Math.round((correct / deck.length) * 100) : 0
    setGrade(g)
    setReviewPrompt(false)
    setPhase('done')
    if (g >= PASS_GRADE) burstConfetti(80)
    onComplete?.(g)
    // שמירת התוצאה למשתמש רשום
    if (user && subjectId) {
      saveExamResult(user.id, subjectId, grade ?? 1, currentPaper, g).then(loadHistory).catch(() => {})
    }
  }, [deck, answers, onComplete, user, subjectId, grade, currentPaper, loadHistory])

  // בקשת סיום — אם יש שאלות שסומנו לחזרה, נשאל קודם
  const requestFinish = useCallback(() => {
    if (flagged.size > 0) setReviewPrompt(true)
    else finish()
  }, [flagged, finish])

  // ref מעודכן כדי שטיימר ההשהיה יקרא תמיד לגרסה האחרונה
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
    const r = await submitScore(leaderboardScope, name.trim(), grade_)
    setSaving(false)
    if (r.ok) setSaved(true)
  }

  // ===== CONFIG =====
  if (phase === 'config') {
    if (available === 0) {
      return <div className="py-12 text-center text-muted-foreground">עוד אין שאלות מבחן למקצוע זה — בקרוב!</div>
    }
    const allPapersDone = papers.length > 0 && papers.every((p) => doneByPaper.has(p))
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

        {/* היסטוריה למשתמש רשום / עידוד התחברות */}
        {user ? (
          history.length > 0 && (
            <div className="rounded-2xl border border-border p-4 mb-6">
              <div className="font-medium mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" />המבחנים שעשית</div>
              <div className="flex flex-wrap gap-2">
                {history.map((r) => (
                  <span key={r.paper} className="text-xs px-2.5 py-1 rounded-xl bg-muted flex items-center gap-1.5">
                    {r.paper === MIXED ? 'מעורבב' : r.paper}
                    <b className={r.bestGrade >= PASS_GRADE ? 'text-success' : 'text-destructive'}>{r.bestGrade}</b>
                    {r.attempts > 1 && <span className="text-muted-foreground">×{r.attempts}</span>}
                  </span>
                ))}
              </div>
              {allPapersDone && <p className="text-xs text-success mt-2">🎉 עברת על כל המבחנים הקיימים! נוסיף עוד בקרוב.</p>}
            </div>
          )
        ) : (
          <Link href="/auth?mode=signup" className="block rounded-2xl border border-primary/30 bg-primary/5 p-3 mb-6 text-sm text-center hover:bg-primary/10 transition-colors">
            <LogIn className="w-4 h-4 inline ml-1.5" />התחברו כדי לשמור תוצאות ולעקוב אחרי המבחנים שעשיתם
          </Link>
        )}

        {/* בחירת מצב: שאלות מעורבבות מכל המבחנים, או מבחן ספציפי */}
        {papers.length > 0 && (
          <div className="flex gap-2 mb-6 p-1 rounded-2xl bg-muted">
            <button
              onClick={() => setMode('mixed')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${mode === 'mixed' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
            >
              <Shuffle className="w-4 h-4" />שאלות מעורבבות
            </button>
            <button
              onClick={() => setMode('specific')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${mode === 'specific' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
            >
              <FileText className="w-4 h-4" />מבחן ספציפי
            </button>
          </div>
        )}

        {/* מבחן ספציפי — בחירת מבחן עבר מלא */}
        {papers.length > 0 && mode === 'specific' ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">בחרו מבחן עבר — תיגשו לכל שאלותיו לפי הסדר המקורי, בזמן של 3 שעות:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {papers.map((paper) => {
                const n = questions.filter((q) => q.examPaper === paper).length
                const done = doneByPaper.get(paper)
                return (
                  <button
                    key={paper}
                    onClick={() => startPaper(paper, 180)}
                    className="gradient-card rounded-3xl p-5 border border-border hover-lift text-right flex items-center gap-3"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${done ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                      {done ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold font-display flex items-center gap-1.5">
                        {paper}
                        {user && !done && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-fun/15 text-fun">חדש</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {done ? `ציון אחרון ${done.bestGrade} · ${n} שאלות` : `${n} שאלות · 3 שעות`}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <>
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
                    type="number" min={0} max={240} value={customMin}
                    onChange={(e) => setCustomMin(Math.max(0, Math.min(240, Number(e.target.value) || 0)))}
                  />
                </label>
              </div>
              <Button onClick={() => start(customCount, customMin)} className="w-full rounded-2xl" size="lg">
                <Timer className="w-4 h-4 ml-2" />התחל מבחן
              </Button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ===== DONE =====
  if (phase === 'done') {
    const passed = grade_ >= PASS_GRADE
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-3xl border p-8 text-center mb-6 ${passed ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5'}`}>
          <div className="text-6xl mb-3">{passed ? '🎉' : '💪'}</div>
          <div className="text-5xl font-bold font-display mb-1" style={{ color: passed ? 'var(--success)' : 'var(--destructive)' }}>{grade_}</div>
          <div className={`font-bold mb-2 ${passed ? 'text-success' : 'text-destructive'}`}>{passed ? 'עברת!' : `לא עברת (נדרש ${PASS_GRADE})`}</div>
          <p className="text-muted-foreground">{correctCount}/{deck.length} תשובות נכונות</p>
          {user && <p className="text-xs text-success mt-2 flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />התוצאה נשמרה בחשבון שלך</p>}
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
              <div key={q.id} className={`rounded-2xl border p-4 ${ok ? 'border-success/30' : 'border-destructive/30'} ${flagged.has(i) ? 'ring-1 ring-fun' : ''}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className={`shrink-0 mt-0.5 ${ok ? 'text-success' : 'text-destructive'}`}>{ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}</span>
                  <p className="font-medium text-sm" dir="auto">{i + 1}. {q.prompt}</p>
                  {flagged.has(i) && <BookmarkCheck className="w-4 h-4 text-fun shrink-0" />}
                </div>
                {!ok && (
                  <div className="text-sm space-y-0.5 pr-6">
                    <div className="text-destructive">התשובה שלך: {answers[i] ?? '— (לא נענתה)'}</div>
                    <div className="text-success">התשובה הנכונה: {q.answer}</div>
                  </div>
                )}
                {q.explanation && <p className="text-xs text-muted-foreground mt-1.5 pr-6" dir="auto">{q.explanation}</p>}
                <div className="flex justify-end mt-2">
                  <ReportQuestionButton key={q.id} questionId={q.id} subjectId={q.subjectId} grade={q.grade} prompt={q.prompt} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-center">
          <Button onClick={() => { setPhase('config'); loadHistory() }} variant="outline" className="rounded-2xl">
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
  const isFlagged = flagged.has(idx)

  const choose = (val: string) => setAnswers((a) => ({ ...a, [idx]: val }))
  const go = (d: number) => setIdx((i) => Math.max(0, Math.min(deck.length - 1, i + d)))
  const toggleFlag = () => setFlagged((s) => {
    const n = new Set(s)
    if (n.has(idx)) n.delete(idx); else n.add(idx)
    return n
  })
  const jumpToFirstFlagged = () => {
    const first = [...flagged].sort((a, b) => a - b)[0]
    if (first != null) setIdx(first)
    setReviewPrompt(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground flex items-center gap-3">
          <span className="flex items-center gap-1.5"><ListChecks className="w-4 h-4" />נענו {answeredCount}/{deck.length}</span>
          {flagged.size > 0 && <span className="flex items-center gap-1 text-fun"><Bookmark className="w-4 h-4" />{flagged.size} סומנו</span>}
        </div>
        {endsAt && (
          <div className={`flex items-center gap-1.5 font-bold font-display ${lowTime ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
            <Clock className="w-4 h-4" />{fmtTime(remaining)}
          </div>
        )}
      </div>

      {/* progress dots — מסומנות לחזרה מקבלות טבעת */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {deck.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-6 h-6 rounded-lg text-xs font-medium transition-colors ${flagged.has(i) ? 'ring-2 ring-fun' : ''} ${
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

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">שאלה {idx + 1} מתוך {deck.length}</span>
        <button
          onClick={toggleFlag}
          className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${isFlagged ? 'bg-fun text-white border-fun' : 'border-fun/40 bg-fun/10 text-fun hover:bg-fun/20'}`}
        >
          {isFlagged ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          {isFlagged ? 'מסומנת לחזרה' : 'סמן לחזרה'}
        </button>
      </div>
      <div className={`gradient-card rounded-3xl p-6 border mb-3 ${isFlagged ? 'border-fun/50' : 'border-border'}`}>
        <p className="text-lg md:text-xl font-semibold font-display" dir="auto">{q.prompt}</p>
      </div>
      <div className="flex justify-end mb-4">
        <ReportQuestionButton key={q.id} questionId={q.id} subjectId={q.subjectId} grade={q.grade} prompt={q.prompt} />
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

      {/* חלון "לחזור לשאלות שסומנו?" לפני הגשה */}
      {reviewPrompt && (
        <div className="rounded-2xl border border-fun/40 bg-fun/5 p-4 mb-4">
          <div className="font-medium mb-1 flex items-center gap-1.5"><Bookmark className="w-4 h-4 text-fun" />סימנת {flagged.size} שאלות לחזרה</div>
          <p className="text-sm text-muted-foreground mb-3">לחזור אליהן לפני ההגשה?</p>
          <div className="flex gap-2">
            <Button onClick={jumpToFirstFlagged} className="rounded-2xl gap-1"><ArrowRight className="w-4 h-4" />חזרה לשאלות המסומנות</Button>
            <Button onClick={finish} variant="outline" className="rounded-2xl">הגש בכל זאת</Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => go(-1)} disabled={idx === 0} className="gap-1">
          <ArrowRight className="w-4 h-4" />הקודמת
        </Button>
        {idx + 1 < deck.length ? (
          <Button onClick={() => go(1)} className="rounded-2xl gap-1">
            הבאה<ArrowLeft className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={requestFinish} className="rounded-2xl gap-1">
            <Flag className="w-4 h-4" />סיים והגש
          </Button>
        )}
      </div>

      {idx + 1 < deck.length && (
        <div className="flex justify-center mt-4">
          <button onClick={requestFinish} className="text-xs text-muted-foreground hover:text-foreground underline">
            סיים והגש עכשיו
          </button>
        </div>
      )}
    </div>
  )
}
