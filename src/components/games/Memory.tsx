'use client'

import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import { useGameSession } from '@/hooks/useGameSession'
import { Button } from '@/components/ui/button'
import { Scoreboard } from './Scoreboard'
import { burstConfetti } from '@/lib/confetti'

export interface MemoryPair {
  a: string
  b: string
}

interface Tile {
  id: number
  pairId: number
  label: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Memory({ pairs }: { pairs: MemoryPair[] }) {
  const { t } = useLocale()
  const session = useGameSession()

  const tiles = useMemo<Tile[]>(() => {
    const list: Tile[] = []
    pairs.forEach((p, i) => {
      list.push({ id: i * 2, pairId: i, label: p.a })
      list.push({ id: i * 2 + 1, pairId: i, label: p.b })
    })
    return shuffle(list)
  }, [pairs])

  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [nonce, setNonce] = useState(0)

  if (pairs.length === 0) return null

  const allMatched = matched.length === tiles.length && tiles.length > 0

  const onFlip = (tile: Tile) => {
    if (busy || flipped.includes(tile.id) || matched.includes(tile.id)) return
    const nf = [...flipped, tile.id]
    setFlipped(nf)
    if (nf.length === 2) {
      setBusy(true)
      const [aId, bId] = nf
      const a = tiles.find((x) => x.id === aId)!
      const b = tiles.find((x) => x.id === bId)!
      const isMatch = a.pairId === b.pairId
      window.setTimeout(() => {
        if (isMatch) {
          const nm = [...matched, aId, bId]
          setMatched(nm)
          session.record(true)
          if (nm.length === tiles.length) burstConfetti(70)
        } else {
          session.record(false)
        }
        setFlipped([])
        setBusy(false)
      }, isMatch ? 350 : 800)
    }
  }

  const restart = () => {
    setFlipped([]); setMatched([]); setBusy(false); session.reset(); setNonce((n) => n + 1)
  }

  return (
    <div key={nonce}>
      <Scoreboard session={session} />

      {allMatched && (
        <div className="text-center mb-4 animate-pop">
          <div className="text-5xl mb-2">🌟</div>
          <h3 className="text-xl font-bold font-display">{t('game.youGot')} {session.score} {t('game.points')}!</h3>
        </div>
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
              className={`aspect-square rounded-2xl border-2 flex items-center justify-center p-2 text-center font-semibold transition-all ${
                isMatched
                  ? 'bg-success/15 border-success text-success'
                  : isUp
                  ? 'gradient-card border-primary animate-pop'
                  : 'bg-primary/90 border-primary text-primary-foreground hover:bg-primary'
              }`}
              dir="auto"
            >
              {isUp ? <span className="text-sm md:text-base">{tile.label}</span> : <span className="text-2xl">?</span>}
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
