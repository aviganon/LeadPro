'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, X, Volume2 } from 'lucide-react'
import { useGameSession } from '@/hooks/useGameSession'
import { Button } from '@/components/ui/button'
import { WordImage } from './WordImage'
import { burstConfetti } from '@/lib/confetti'
import { getStars } from '@/lib/localProgress'
import { praiseAloud, cheerAloud, speakHe } from '@/lib/speech'
import { KidHeader, ProgressDots, DoneScreen, praise, type ReadingDone } from './kidUi'
import type { RhymeWord, SyllableWord } from '@/lib/readingContent'

const MAX_ROUNDS = 10
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ===== חרוזים — איזו מילה מתחרזת? =====
export function RhymeGame({ groups, onComplete }: { groups: RhymeWord[][]; onComplete?: ReadingDone }) {
  const session = useGameSession()
  const flat = useMemo(() => groups.flat(), [groups])

  const rounds = useMemo(() => {
    const usable = groups.filter((g) => g.length >= 2)
    const out: { target: RhymeWord; correct: RhymeWord; opts: RhymeWord[] }[] = []
    for (const g of shuffle(usable)) {
      const p = shuffle(g)
      const target = p[0], correct = p[1]
      const distractors = shuffle(flat.filter((w) => !g.includes(w))).slice(0, 3)
      out.push({ target, correct, opts: shuffle([correct, ...distractors]) })
    }
    return shuffle(out).slice(0, MAX_ROUNDS)
  }, [groups, flat])

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<RhymeWord | null>(null)
  const [done, setDone] = useState(false)
  const [doneMsg, setDoneMsg] = useState('')
  const [wallet, setWallet] = useState(0)
  const timer = useRef<number | null>(null)
  const clearTimer = () => { if (timer.current) { window.clearTimeout(timer.current); timer.current = null } }
  useEffect(() => clearTimer, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- קריאת ארנק הכוכבים לאחר hydration
  useEffect(() => { setWallet(getStars()) }, [])

  if (rounds.length === 0) return null
  const round = rounds[idx]
  const revealed = picked !== null

  const choose = (opt: RhymeWord) => {
    if (revealed) return
    setPicked(opt)
    const ok = opt.word === round.correct.word
    session.record(ok)
    if (ok) { praiseAloud(); clearTimer(); timer.current = window.setTimeout(() => next(), 1100) }
  }
  const next = () => {
    clearTimer()
    if (idx + 1 >= rounds.length) {
      onComplete?.(session.correct, rounds.length, session.score)
      setWallet(getStars()); setDoneMsg(praise()); cheerAloud()
      setDone(true); burstConfetti(80)
      return
    }
    setIdx(idx + 1); setPicked(null)
  }
  const restart = () => { clearTimer(); setIdx(0); setPicked(null); setDone(false); setWallet(getStars()); session.reset() }

  if (done) {
    return <DoneScreen message={doneMsg} score={session.score} correct={session.correct} total={rounds.length} wallet={wallet} onRestart={restart} />
  }

  return (
    <div>
      <KidHeader session={session} wallet={wallet} />
      <ProgressDots total={rounds.length} current={idx} />

      <div className="gradient-card rounded-3xl p-6 border border-border mb-6 flex flex-col items-center gap-2">
        <span className="text-sm text-muted-foreground">איזו מילה מתחרזת עם:</span>
        <button onClick={() => speakHe(round.target.word)} className="flex items-center gap-3 group" title="השמע">
          {round.target.emoji && <WordImage emoji={round.target.emoji} size={56} />}
          <span className="text-4xl md:text-5xl font-bold font-display" dir="rtl">{round.target.word}</span>
          <Volume2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {round.opts.map((opt, i) => {
          const isCorrect = opt.word === round.correct.word
          const isPicked = picked?.word === opt.word
          let cls = 'bg-card border-border hover:border-primary/40'
          if (revealed && isCorrect) cls = 'bg-success/15 border-success text-success'
          else if (revealed && isPicked && !isCorrect) cls = 'bg-destructive/15 border-destructive text-destructive animate-shake'
          return (
            <button key={i} onClick={() => choose(opt)} disabled={revealed} dir="rtl"
              className={`p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 min-h-[4.5rem] ${cls}`}>
              {opt.emoji && <WordImage emoji={opt.emoji} size={40} />}
              <span className="text-2xl md:text-3xl font-display">{opt.word}</span>
              {revealed && isCorrect && <Check className="w-5 h-5 shrink-0" />}
              {revealed && isPicked && !isCorrect && <X className="w-5 h-5 shrink-0" />}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="mt-6 animate-slide-up text-center">
          <div className={`font-bold text-lg font-display ${picked?.word === round.correct.word ? 'text-success' : 'text-destructive'}`}>
            {picked?.word === round.correct.word ? 'נכון! זה מתחרז!' : `הנכון: ${round.correct.word}`}
          </div>
          {picked?.word !== round.correct.word && (
            <div className="flex justify-center mt-5">
              <Button onClick={next} size="lg" className="rounded-2xl">{idx + 1 >= rounds.length ? 'סיום' : 'הבא'}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===== כמה הברות? =====
export function SyllableGame({ words, onComplete }: { words: SyllableWord[]; onComplete?: ReadingDone }) {
  const session = useGameSession()
  const deck = useMemo(() => shuffle(words).slice(0, MAX_ROUNDS), [words])

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [doneMsg, setDoneMsg] = useState('')
  const [wallet, setWallet] = useState(0)
  const timer = useRef<number | null>(null)
  const clearTimer = () => { if (timer.current) { window.clearTimeout(timer.current); timer.current = null } }
  useEffect(() => clearTimer, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- קריאת ארנק הכוכבים לאחר hydration
  useEffect(() => { setWallet(getStars()) }, [])

  if (deck.length === 0) return null
  const round = deck[idx]
  const revealed = picked !== null

  const choose = (n: number) => {
    if (revealed) return
    setPicked(n)
    const ok = n === round.count
    session.record(ok)
    if (ok) { praiseAloud(); clearTimer(); timer.current = window.setTimeout(() => next(), 1100) }
  }
  const next = () => {
    clearTimer()
    if (idx + 1 >= deck.length) {
      onComplete?.(session.correct, deck.length, session.score)
      setWallet(getStars()); setDoneMsg(praise()); cheerAloud()
      setDone(true); burstConfetti(80)
      return
    }
    setIdx(idx + 1); setPicked(null)
  }
  const restart = () => { clearTimer(); setIdx(0); setPicked(null); setDone(false); setWallet(getStars()); session.reset() }

  if (done) {
    return <DoneScreen message={doneMsg} score={session.score} correct={session.correct} total={deck.length} wallet={wallet} onRestart={restart} />
  }

  return (
    <div>
      <KidHeader session={session} wallet={wallet} />
      <ProgressDots total={deck.length} current={idx} />

      <div className="gradient-card rounded-3xl p-6 border border-border mb-6 flex flex-col items-center gap-2">
        <WordImage emoji={round.emoji} size={96} />
        <button onClick={() => speakHe(round.word)} className="flex items-center gap-3 group" title="השמע">
          <span className="text-4xl md:text-5xl font-bold font-display" dir="rtl">{round.word}</span>
          <Volume2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </button>
        <span className="text-sm text-muted-foreground">כמה הברות? (מחאו כפיים)</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((n) => {
          const isCorrect = n === round.count
          const isPicked = picked === n
          let cls = 'bg-card border-border hover:border-primary/40'
          if (revealed && isCorrect) cls = 'bg-success/15 border-success text-success'
          else if (revealed && isPicked && !isCorrect) cls = 'bg-destructive/15 border-destructive text-destructive animate-shake'
          return (
            <button key={n} onClick={() => choose(n)} disabled={revealed}
              className={`aspect-square rounded-2xl border-2 font-bold font-display text-4xl transition-all flex items-center justify-center ${cls}`}>
              {n}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="mt-6 animate-slide-up text-center">
          <div className={`font-bold text-lg font-display ${picked === round.count ? 'text-success' : 'text-destructive'}`}>
            {picked === round.count ? 'נכון!' : `יש ${round.count} הברות`}
          </div>
          {picked !== round.count && (
            <div className="flex justify-center mt-5">
              <Button onClick={next} size="lg" className="rounded-2xl">{idx + 1 >= deck.length ? 'סיום' : 'הבא'}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
