'use client'

import { useMemo, useState } from 'react'
import { Check, X, RotateCcw, ArrowLeft, ArrowRight, Volume2 } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import { useGameSession } from '@/hooks/useGameSession'
import { Button } from '@/components/ui/button'
import { Scoreboard } from './Scoreboard'
import { burstConfetti } from '@/lib/confetti'
import type { ReadCategory, ReadItem } from '@/lib/readingContent'

export type ReadingMode = 'pic2word' | 'word2pic' | 'memory'

const MAX_ROUNDS = 10

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** הקראת מילה (ללא ניקוד) — תמיכה דפדפנית בלבד, נכשל בשקט אם אין. */
function speak(word: string) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(word.normalize('NFC'))
    u.lang = 'he-IL'
    u.rate = 0.8
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* ignore */ }
}

export function ReadingGame({ mode, categories }: { mode: ReadingMode; categories: ReadCategory[] }) {
  const { dir } = useLocale()
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  const [catId, setCatId] = useState<string | null>(categories.length === 1 ? categories[0].id : null)
  const category = categories.find((c) => c.id === catId) ?? null

  if (categories.length === 0) return null

  if (!category) {
    return (
      <div className="animate-slide-up">
        <h3 className="text-center font-bold font-display text-lg mb-1">בחרו נושא</h3>
        <p className="text-center text-sm text-muted-foreground mb-6">על מה נלמד לקרוא היום?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatId(c.id)}
              className="gradient-card rounded-3xl p-6 border border-border hover-lift flex flex-col items-center gap-2"
            >
              <span className="text-5xl">{c.emoji}</span>
              <span className="font-bold font-display text-lg" dir="rtl">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {categories.length > 1 && (
        <Button variant="ghost" size="sm" onClick={() => setCatId(null)} className="mb-3 gap-1">
          <Back className="w-4 h-4" />נושא אחר
        </Button>
      )}
      {mode === 'memory'
        ? <ReadMemory key={category.id} category={category} />
        : <ReadChoose key={`${category.id}-${mode}`} mode={mode} category={category} />}
    </div>
  )
}

// ===== משחק בחירה: תמונה→מילה או מילה→תמונה =====
function ReadChoose({ mode, category }: { mode: ReadingMode; category: ReadCategory }) {
  const { t } = useLocale()
  const session = useGameSession()
  const pool = category.items

  const deck = useMemo(() => shuffle(pool).slice(0, Math.min(MAX_ROUNDS, pool.length)), [pool])

  // אפשרויות לכל שאלה — מחושב פעם אחת לכל ה-deck
  const rounds = useMemo(() => deck.map((item) => {
    const distractors = shuffle(pool.filter((x) => x.word !== item.word)).slice(0, 3)
    const opts = shuffle([item, ...distractors])
    return { item, opts }
  }), [deck, pool])

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<ReadItem | null>(null)
  const [done, setDone] = useState(false)
  const [nonce, setNonce] = useState(0)

  if (deck.length === 0) return null

  const round = rounds[idx]
  const revealed = picked !== null

  const choose = (opt: ReadItem) => {
    if (revealed) return
    setPicked(opt)
    session.record(opt.word === round.item.word)
  }

  const next = () => {
    if (idx + 1 >= deck.length) { setDone(true); burstConfetti(60); return }
    setIdx(idx + 1); setPicked(null)
  }

  const restart = () => { setIdx(0); setPicked(null); setDone(false); session.reset(); setNonce((n) => n + 1) }

  if (done) {
    return (
      <div key={nonce} className="text-center py-8 animate-pop max-w-md mx-auto">
        <div className="text-6xl mb-3">🌟</div>
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

      {/* גירוי: תמונה גדולה או מילה מנוקדת גדולה */}
      <div className="gradient-card rounded-3xl p-8 border border-border mb-6 flex items-center justify-center min-h-[8rem]">
        {mode === 'pic2word' ? (
          <span className="text-8xl">{round.item.emoji}</span>
        ) : (
          <button onClick={() => speak(round.item.word)} className="flex items-center gap-3 group" title="השמע">
            <span className="text-5xl md:text-6xl font-bold font-display" dir="rtl">{round.item.word}</span>
            <Volume2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}
      </div>

      {/* אפשרויות */}
      <div className="grid grid-cols-2 gap-3">
        {round.opts.map((opt, i) => {
          const isCorrect = opt.word === round.item.word
          const isPicked = picked?.word === opt.word
          let cls = 'bg-card border-border hover:border-primary/40'
          if (revealed && isCorrect) cls = 'bg-success/15 border-success text-success'
          else if (revealed && isPicked && !isCorrect) cls = 'bg-destructive/15 border-destructive text-destructive animate-shake'
          return (
            <button
              key={i}
              onClick={() => choose(opt)}
              disabled={revealed}
              className={`p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 min-h-[5rem] ${cls}`}
              dir="rtl"
            >
              {mode === 'pic2word'
                ? <span className="text-3xl md:text-4xl font-display">{opt.word}</span>
                : <span className="text-6xl">{opt.emoji}</span>}
              {revealed && isCorrect && <Check className="w-5 h-5 shrink-0" />}
              {revealed && isPicked && !isCorrect && <X className="w-5 h-5 shrink-0" />}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="mt-6 animate-slide-up text-center">
          <div className={`font-bold text-lg font-display ${picked?.word === round.item.word ? 'text-success' : 'text-destructive'}`}>
            {picked?.word === round.item.word ? t('game.correct') : t('game.wrong')}
          </div>
          {/* תמיד מציגים מילה+תמונה יחד אחרי תשובה — חיזוק קריאה */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-4xl">{round.item.emoji}</span>
            <span className="text-3xl font-bold font-display" dir="rtl">{round.item.word}</span>
          </div>
          <div className="flex justify-center mt-5">
            <Button onClick={next} size="lg" className="rounded-2xl">
              {idx + 1 >= deck.length ? t('game.finish') : t('game.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== זיכרון: מילה ↔ תמונה =====
interface MTile { id: number; pairId: number; kind: 'word' | 'emoji'; label: string }

function ReadMemory({ category }: { category: ReadCategory }) {
  const { t } = useLocale()
  const session = useGameSession()

  const tiles = useMemo<MTile[]>(() => {
    const items = shuffle(category.items).slice(0, 6)
    const list: MTile[] = []
    items.forEach((it, i) => {
      list.push({ id: i * 2, pairId: i, kind: 'emoji', label: it.emoji })
      list.push({ id: i * 2 + 1, pairId: i, kind: 'word', label: it.word })
    })
    return shuffle(list)
  }, [category])

  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [nonce, setNonce] = useState(0)

  if (tiles.length === 0) return null
  const allMatched = matched.length === tiles.length

  const onFlip = (tile: MTile) => {
    if (busy || flipped.includes(tile.id) || matched.includes(tile.id)) return
    const nf = [...flipped, tile.id]
    setFlipped(nf)
    if (nf.length === 2) {
      setBusy(true)
      const a = tiles.find((x) => x.id === nf[0])!
      const b = tiles.find((x) => x.id === nf[1])!
      const isMatch = a.pairId === b.pairId
      window.setTimeout(() => {
        if (isMatch) {
          const nm = [...matched, a.id, b.id]
          setMatched(nm)
          session.record(true)
          if (nm.length === tiles.length) burstConfetti(70)
        } else {
          session.record(false)
        }
        setFlipped([])
        setBusy(false)
      }, isMatch ? 350 : 850)
    }
  }

  const restart = () => { setFlipped([]); setMatched([]); setBusy(false); session.reset(); setNonce((n) => n + 1) }

  return (
    <div key={nonce}>
      <Scoreboard session={session} />
      {allMatched && (
        <div className="text-center mb-4 animate-pop">
          <div className="text-5xl mb-2">🌟</div>
          <h3 className="text-xl font-bold font-display">{t('game.youGot')} {session.score} {t('game.points')}!</h3>
        </div>
      )}
      <p className="text-center text-sm text-muted-foreground mb-4">חברו כל תמונה למילה שלה</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => {
          const isUp = flipped.includes(tile.id) || matched.includes(tile.id)
          const isMatched = matched.includes(tile.id)
          return (
            <button
              key={tile.id}
              onClick={() => onFlip(tile)}
              disabled={isUp || busy}
              className={`aspect-square rounded-2xl border-2 flex items-center justify-center p-2 text-center transition-all ${
                isMatched ? 'bg-success/15 border-success text-success'
                : isUp ? 'gradient-card border-primary animate-pop'
                : 'bg-primary/90 border-primary text-primary-foreground hover:bg-primary'
              }`}
              dir="rtl"
            >
              {isUp
                ? (tile.kind === 'emoji'
                    ? <span className="text-4xl">{tile.label}</span>
                    : <span className="text-xl md:text-2xl font-bold font-display">{tile.label}</span>)
                : <span className="text-2xl text-primary-foreground">?</span>}
            </button>
          )
        })}
      </div>
      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={restart} className="rounded-2xl"><RotateCcw className="w-4 h-4 ml-2" />{t('game.again')}</Button>
      </div>
    </div>
  )
}
