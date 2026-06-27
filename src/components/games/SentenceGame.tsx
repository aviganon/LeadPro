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
import type { ReadSentence } from '@/lib/readingContent'

export type SentenceMode = 'sentence' | 'cloze'

const MAX_ROUNDS = 10
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const fullSentence = (s: ReadSentence) => s.template.replace('___', s.answer)

/**
 * משחקי משפטים לכיתה א':
 * - 'sentence' — קוראים משפט קצר ובוחרים את התמונה המתאימה.
 * - 'cloze' — משלימים את המילה החסרה במשפט (עם תמונת רמז).
 */
export function SentenceGame({ mode, sentences, onComplete }: { mode: SentenceMode; sentences: ReadSentence[]; onComplete?: ReadingDone }) {
  const session = useGameSession()
  const pool = sentences

  const deck = useMemo(() => shuffle(pool).slice(0, Math.min(MAX_ROUNDS, pool.length)), [pool])
  const rounds = useMemo(() => deck.map((s) => {
    const others = shuffle(pool.filter((x) => x.answer !== s.answer)).slice(0, 3)
    return { s, opts: shuffle([s, ...others]) }
  }), [deck, pool])

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<ReadSentence | null>(null)
  const [done, setDone] = useState(false)
  const [doneMsg, setDoneMsg] = useState('')
  const [wallet, setWallet] = useState(0)
  const timer = useRef<number | null>(null)
  const clearTimer = () => { if (timer.current) { window.clearTimeout(timer.current); timer.current = null } }
  useEffect(() => clearTimer, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- קריאת ארנק הכוכבים לאחר hydration
  useEffect(() => { setWallet(getStars()) }, [])

  if (deck.length === 0) return null
  const round = rounds[idx]
  const revealed = picked !== null

  const choose = (opt: ReadSentence) => {
    if (revealed) return
    setPicked(opt)
    const ok = opt.answer === round.s.answer
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

  const stimulus = mode === 'cloze' ? round.s.template.replace('___', '＿＿＿') : fullSentence(round.s)

  return (
    <div>
      <KidHeader session={session} wallet={wallet} />
      <ProgressDots total={deck.length} current={idx} />

      {/* גירוי: המשפט (לחיצה משמיעה אותו), וב-cloze גם תמונת רמז */}
      <div className="gradient-card rounded-3xl p-6 border border-border mb-6 flex flex-col items-center gap-3">
        {mode === 'cloze' && <WordImage emoji={round.s.emoji} size={96} />}
        <button onClick={() => speakHe(fullSentence(round.s))} className="flex items-center gap-3 group" title="השמע">
          <span className="text-2xl md:text-4xl font-bold font-display leading-relaxed" dir="rtl">{stimulus}</span>
          <Volume2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </button>
      </div>

      {/* אפשרויות: תמונות (sentence) או מילים (cloze) */}
      <div className="grid grid-cols-2 gap-3">
        {round.opts.map((opt, i) => {
          const isCorrect = opt.answer === round.s.answer
          const isPicked = picked?.answer === opt.answer
          let cls = 'bg-card border-border hover:border-primary/40'
          if (revealed && isCorrect) cls = 'bg-success/15 border-success text-success'
          else if (revealed && isPicked && !isCorrect) cls = 'bg-destructive/15 border-destructive text-destructive animate-shake'
          return (
            <button
              key={i}
              onClick={() => choose(opt)}
              disabled={revealed}
              dir="rtl"
              className={`p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 min-h-[5rem] ${cls}`}
            >
              {mode === 'sentence'
                ? <WordImage emoji={opt.emoji} size={76} />
                : <span className="text-2xl md:text-3xl font-display">{opt.answer}</span>}
              {revealed && isCorrect && <Check className="w-5 h-5 shrink-0" />}
              {revealed && isPicked && !isCorrect && <X className="w-5 h-5 shrink-0" />}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="mt-6 animate-slide-up text-center">
          <div className={`font-bold text-lg font-display ${picked?.answer === round.s.answer ? 'text-success' : 'text-destructive'}`}>
            {picked?.answer === round.s.answer ? 'נכון!' : 'אופס...'}
          </div>
          {/* חיזוק: המשפט המלא + תמונה */}
          <div className="flex items-center justify-center gap-3 mt-2" dir="rtl">
            <WordImage emoji={round.s.emoji} size={44} />
            <span className="text-2xl font-bold font-display">{fullSentence(round.s)}</span>
          </div>
          {picked?.answer !== round.s.answer && (
            <div className="flex justify-center mt-5">
              <Button onClick={next} size="lg" className="rounded-2xl">{idx + 1 >= deck.length ? 'סיום' : 'הבא'}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
