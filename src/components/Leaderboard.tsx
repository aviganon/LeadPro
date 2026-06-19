'use client'

import { useCallback, useEffect, useState } from 'react'
import { Trophy, ShieldCheck, Loader2, Medal } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import { getLeaderboard } from '@/lib/leaderboard'
import type { LeaderboardEntry } from '@/types'

const MEDAL = ['text-yellow-500', 'text-zinc-400', 'text-amber-700']

export function Leaderboard({ scope, refreshKey, highlightName }: { scope: string; refreshKey?: number; highlightName?: string }) {
  const { t } = useLocale()
  const [rows, setRows] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    getLeaderboard(scope).then((r) => { setRows(r); setLoading(false) }).catch(() => setLoading(false))
  }, [scope])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="gradient-card rounded-3xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-fun/10 text-fun flex items-center justify-center">
          <Trophy className="w-5 h-5" />
        </div>
        <h3 className="font-bold font-display text-lg">{t('lb.title')}</h3>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">{t('lb.empty')}</div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.id}
              className={`flex items-center gap-3 p-2.5 rounded-2xl ${
                highlightName && r.name === highlightName ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-background'
              }`}
            >
              <span className="w-7 text-center font-bold shrink-0">
                {i < 3 ? <Medal className={`w-5 h-5 mx-auto ${MEDAL[i]}`} /> : i + 1}
              </span>
              <span className="flex-1 font-medium truncate flex items-center gap-1.5" dir="auto">
                {r.name}
                {r.verified && <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
              </span>
              <span className="font-bold text-primary tabular-nums">{r.score.toLocaleString('he-IL')}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
