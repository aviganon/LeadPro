'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, X, RotateCcw, ArrowLeft, ArrowRight, Volume2, Sparkles } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import { useGameSession } from '@/hooks/useGameSession'
import { Button } from '@/components/ui/button'
import { WordImage } from './WordImage'
import { burstConfetti } from '@/lib/confetti'
import { getStars } from '@/lib/localProgress'
import { praiseAloud, cheerAloud } from '@/lib/speech'
import { KidHeader, ProgressDots, DoneScreen, praise, type ReadingDone } from './kidUi'
import type { ReadCategory, ReadItem } from '@/lib/readingContent'

export type { ReadingDone }

export type ReadingMode = 'pic2word' | 'word2pic' | 'memory' | 'firstletter'

const MAX_ROUNDS = 10
const HEB_ALEF = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** האות הראשונה של מילה (ללא ניקוד). */
function firstLetter(word: string): string {
  const base = word.replace(/[֑-ׇ]/g, '').trim()
  return [...base][0] ?? ''
}

/** מספר האותיות במילה (ללא ניקוד) — בסיס לרמת הקושי. */
function letterCount(word: string): number {
  return [...word.replace(/[֑-ׇ]/g, '').trim()].length
}

const LEVELS: { id: number; label: string }[] = [
  { id: 0, label: 'הכל' },
  { id: 1, label: 'קל' },
  { id: 2, label: 'בינוני' },
  { id: 3, label: 'קשה' },
]

/** סינון מילים לפי רמת קושי (אורך): 1 → עד 3 אותיות · 2 → 4 אותיות · 3 → 5+ אותיות.
 *  נופל בחזרה לכל המילים אם אין מספיק מילים ברמה. */
function filterByLevel(items: ReadItem[], level: number): ReadItem[] {
  if (!level) return items
  const f = items.filter((it) => {
    const n = letterCount(it.word)
    return level === 1 ? n <= 3 : level === 2 ? n === 4 : n >= 5
  })
  return f.length >= 2 ? f : items
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

export function ReadingGame({ mode, categories, onComplete }: { mode: ReadingMode; categories: ReadCategory[]; onComplete?: ReadingDone }) {
  const { dir } = useLocale()
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  const [catId, setCatId] = useState<string | null>(categories.length === 1 ? categories[0].id : null)
  const [level, setLevel] = useState(0)
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
              <WordImage emoji={c.emoji} size={60} />
              <span className="font-bold font-display text-lg" dir="rtl">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        {categories.length > 1 ? (
          <Button variant="ghost" size="sm" onClick={() => setCatId(null)} className="gap-1">
            <Back className="w-4 h-4" />נושא אחר
          </Button>
        ) : <span />}
        {/* בורר רמת קושי */}
        <div className="flex items-center gap-1.5" dir="rtl">
          <span className="text-sm text-muted-foreground">רמה:</span>
          {LEVELS.map((lv) => (
            <button
              key={lv.id}
              onClick={() => setLevel(lv.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                level === lv.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/40'
              }`}
            >
              {lv.label}
            </button>
          ))}
        </div>
      </div>
      {mode === 'memory'
        ? <ReadMemory key={`${category.id}-${level}`} category={category} level={level} onComplete={onComplete} />
        : mode === 'firstletter'
        ? <ReadFirstLetter key={`${category.id}-${level}`} category={category} level={level} onComplete={onComplete} />
        : <ReadChoose key={`${category.id}-${mode}-${level}`} mode={mode} category={category} level={level} onComplete={onComplete} />}
    </div>
  )
}

// ===== משחק בחירה: תמונה→מילה או מילה→תמונה =====
function ReadChoose({ mode, category, level, onComplete }: { mode: ReadingMode; category: ReadCategory; level: number; onComplete?: ReadingDone }) {
  const { t } = useLocale()
  const session = useGameSession()
  const pool = category.items // מאגר מלא — לאפשרויות המסיחות

  // מילות המטרה מסוננות לפי רמת הקושי; המסיחים נשארים מכל המאגר
  const targetPool = useMemo(() => filterByLevel(pool, level), [pool, level])
  const deck = useMemo(() => shuffle(targetPool).slice(0, Math.min(MAX_ROUNDS, targetPool.length)), [targetPool])

  // אפשרויות לכל שאלה — מחושב פעם אחת לכל ה-deck
  const rounds = useMemo(() => deck.map((item) => {
    const distractors = shuffle(pool.filter((x) => x.word !== item.word)).slice(0, 3)
    const opts = shuffle([item, ...distractors])
    return { item, opts }
  }), [deck, pool])

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<ReadItem | null>(null)
  const [done, setDone] = useState(false)
  const [doneMsg, setDoneMsg] = useState('')
  const [wallet, setWallet] = useState(0)
  const advanceTimer = useRef<number | null>(null)
  const clearTimer = () => { if (advanceTimer.current) { window.clearTimeout(advanceTimer.current); advanceTimer.current = null } }
  useEffect(() => clearTimer, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- קריאת ארנק הכוכבים לאחר hydration
  useEffect(() => { setWallet(getStars()) }, [])

  if (deck.length === 0) return null

  const round = rounds[idx]
  const revealed = picked !== null

  const choose = (opt: ReadItem) => {
    if (revealed) return
    setPicked(opt)
    const ok = opt.word === round.item.word
    session.record(ok)
    if (ok) { praiseAloud(); clearTimer(); advanceTimer.current = window.setTimeout(() => next(), 1000) }
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

      {/* גירוי: תמונה גדולה או מילה מנוקדת גדולה */}
      <div className="gradient-card rounded-3xl p-8 border border-border mb-6 flex items-center justify-center min-h-[8rem]">
        {mode === 'pic2word' ? (
          <WordImage emoji={round.item.emoji} size={128} />
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
                : <WordImage emoji={opt.emoji} size={76} />}
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
            <WordImage emoji={round.item.emoji} size={48} />
            <span className="text-3xl font-bold font-display" dir="rtl">{round.item.word}</span>
          </div>
          {picked?.word !== round.item.word && (
            <div className="flex justify-center mt-5">
              <Button onClick={next} size="lg" className="rounded-2xl">
                {idx + 1 >= deck.length ? t('game.finish') : t('game.next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===== מאיזו אות מתחילה המילה? =====
function ReadFirstLetter({ category, level, onComplete }: { category: ReadCategory; level: number; onComplete?: ReadingDone }) {
  const { t } = useLocale()
  const session = useGameSession()
  const pool = useMemo(() => filterByLevel(category.items, level), [category.items, level])

  const deck = useMemo(() => shuffle(pool).slice(0, Math.min(MAX_ROUNDS, pool.length)), [pool])
  const rounds = useMemo(() => deck.map((item) => {
    const correct = firstLetter(item.word)
    const others = shuffle(HEB_ALEF.filter((l) => l !== correct)).slice(0, 3)
    return { item, correct, opts: shuffle([correct, ...others]) }
  }), [deck])

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [doneMsg, setDoneMsg] = useState('')
  const [wallet, setWallet] = useState(0)
  const advanceTimer = useRef<number | null>(null)
  const clearTimer = () => { if (advanceTimer.current) { window.clearTimeout(advanceTimer.current); advanceTimer.current = null } }
  useEffect(() => clearTimer, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- קריאת ארנק הכוכבים לאחר hydration
  useEffect(() => { setWallet(getStars()) }, [])

  if (deck.length === 0) return null
  const round = rounds[idx]
  const revealed = picked !== null

  const choose = (l: string) => {
    if (revealed) return
    setPicked(l)
    const ok = l === round.correct
    session.record(ok)
    if (ok) { praiseAloud(); clearTimer(); advanceTimer.current = window.setTimeout(() => next(), 1000) }
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

      <div className="gradient-card rounded-3xl p-6 border border-border mb-3 flex flex-col items-center gap-2">
        <WordImage emoji={round.item.emoji} size={112} />
        <span className="text-sm text-muted-foreground">מאיזו אות מתחילה המילה?</span>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-2">
        {round.opts.map((l, i) => {
          const isCorrect = l === round.correct
          const isPicked = picked === l
          let cls = 'bg-card border-border hover:border-primary/40'
          if (revealed && isCorrect) cls = 'bg-success/15 border-success text-success'
          else if (revealed && isPicked && !isCorrect) cls = 'bg-destructive/15 border-destructive text-destructive animate-shake'
          return (
            <button
              key={i}
              onClick={() => choose(l)}
              disabled={revealed}
              className={`aspect-square rounded-2xl border-2 font-bold font-display text-4xl transition-all flex items-center justify-center ${cls}`}
              dir="rtl"
            >
              {l}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="mt-5 animate-slide-up text-center">
          <div className={`font-bold text-lg font-display ${picked === round.correct ? 'text-success' : 'text-destructive'}`}>
            {picked === round.correct ? t('game.correct') : t('game.wrong')}
          </div>
          <div className="flex items-center justify-center gap-3 mt-2" dir="rtl">
            <WordImage emoji={round.item.emoji} size={44} />
            <span className="text-3xl font-bold font-display">
              <span className="text-success">{round.correct}</span>{round.item.word.replace(/[֑-ׇ]/g, '').slice(1)}
            </span>
          </div>
          {picked !== round.correct && (
            <div className="flex justify-center mt-5">
              <Button onClick={next} size="lg" className="rounded-2xl">
                {idx + 1 >= deck.length ? t('game.finish') : t('game.next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===== זיכרון: מילה ↔ תמונה =====
interface MTile { id: number; pairId: number; kind: 'word' | 'emoji'; label: string }

function ReadMemory({ category, level, onComplete }: { category: ReadCategory; level: number; onComplete?: ReadingDone }) {
  const { t } = useLocale()
  const session = useGameSession()

  const tiles = useMemo<MTile[]>(() => {
    const items = shuffle(filterByLevel(category.items, level)).slice(0, 6)
    const list: MTile[] = []
    items.forEach((it, i) => {
      list.push({ id: i * 2, pairId: i, kind: 'emoji', label: it.emoji })
      list.push({ id: i * 2 + 1, pairId: i, kind: 'word', label: it.word })
    })
    return shuffle(list)
  }, [category, level])

  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [nonce, setNonce] = useState(0)
  const [wallet, setWallet] = useState(0)
  const [doneMsg, setDoneMsg] = useState('')
  const firedRef = useRef(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- קריאת ארנק הכוכבים לאחר hydration
  useEffect(() => { setWallet(getStars()) }, [])

  const allMatched = tiles.length > 0 && matched.length === tiles.length
  useEffect(() => {
    if (!allMatched || firedRef.current) return
    firedRef.current = true
    onComplete?.(session.correct, tiles.length / 2, session.score)
    cheerAloud()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- עדכון תצוגת הסיום
    setWallet(getStars()); setDoneMsg(praise())
  }, [allMatched, onComplete, session.score, session.correct, tiles.length])

  if (tiles.length === 0) return null

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
          if (nm.length === tiles.length) burstConfetti(70); else praiseAloud()
        } else {
          session.record(false)
        }
        setFlipped([])
        setBusy(false)
      }, isMatch ? 350 : 850)
    }
  }

  const restart = () => { firedRef.current = false; setFlipped([]); setMatched([]); setBusy(false); setWallet(getStars()); session.reset(); setNonce((n) => n + 1) }

  return (
    <div key={nonce}>
      <KidHeader session={session} wallet={wallet} />
      {allMatched ? (
        <div className="text-center mb-4 animate-pop" dir="rtl">
          <div className="text-6xl mb-2">🎉</div>
          <h3 className="text-2xl font-extrabold font-display text-primary mb-1">{doneMsg}</h3>
          <div className="flex items-center justify-center gap-2 text-amber-500 font-bold animate-pop">
            <Sparkles className="w-5 h-5" /><span>עכשיו יש לך {wallet} כוכבים!</span>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground mb-4">חברו כל תמונה למילה שלה</p>
      )}
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
                    ? <WordImage emoji={tile.label} size={52} />
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
