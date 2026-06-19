'use client'

import { useMemo, useState } from 'react'
import { RotateCcw, Check, X } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import { useGameSession } from '@/hooks/useGameSession'
import { Button } from '@/components/ui/button'
import { Scoreboard } from './Scoreboard'
import { burstConfetti } from '@/lib/confetti'

export interface FlashCard {
  front: string
  back: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Flashcards({ cards }: { cards: FlashCard[] }) {
  const { t } = useLocale()
  const session = useGameSession()
  const deck = useMemo(() => shuffle(cards), [cards])

  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)

  if (deck.length === 0) return null
  const card = deck[idx]

  const answer = (known: boolean) => {
    session.record(known)
    if (idx + 1 >= deck.length) {
      setDone(true)
      burstConfetti(60)
      return
    }
    setIdx(idx + 1)
    setFlipped(false)
  }

  const restart = () => { setIdx(0); setFlipped(false); setDone(false); session.reset() }

  if (done) {
    return (
      <div className="text-center py-10 animate-pop">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold font-display mb-2">{t('game.youGot')} {session.score} {t('game.points')}!</h3>
        <p className="text-muted-foreground mb-6">{session.correct}/{deck.length} ✓</p>
        <Button onClick={restart} className="rounded-2xl"><RotateCcw className="w-4 h-4 ml-2" />{t('game.again')}</Button>
      </div>
    )
  }

  return (
    <div>
      <Scoreboard session={session} />
      <div className="mb-2 text-sm text-muted-foreground text-center">{idx + 1} / {deck.length}</div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[14rem] gradient-card rounded-3xl border-2 border-border p-8 flex items-center justify-center text-center hover-lift mb-4"
      >
        <div className="animate-pop" key={flipped ? 'b' : 'f'}>
          <div className="text-3xl md:text-4xl font-bold font-display" dir="auto">
            {flipped ? card.back : card.front}
          </div>
          <div className="text-xs text-muted-foreground mt-4">{t('game.flip')}</div>
        </div>
      </button>

      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => answer(false)} className="rounded-2xl border-destructive/40 text-destructive">
            <X className="w-4 h-4 ml-2" />{t('game.wrong')}
          </Button>
          <Button onClick={() => answer(true)} className="rounded-2xl bg-success hover:bg-success/90">
            <Check className="w-4 h-4 ml-2" />{t('game.correct')}
          </Button>
        </div>
      ) : (
        <Button onClick={() => setFlipped(true)} variant="secondary" className="w-full rounded-2xl">{t('game.flip')}</Button>
      )}
    </div>
  )
}
