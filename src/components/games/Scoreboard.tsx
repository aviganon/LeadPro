'use client'

import { Star, Flame } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import type { GameSession } from '@/hooks/useGameSession'
import { VoiceToggle } from './VoiceToggle'

export function Scoreboard({ session }: { session: GameSession }) {
  const { t } = useLocale()
  return (
    <div className="flex items-center gap-3 justify-center mb-6">
      <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary/10 text-primary font-semibold">
        <Star className="w-4 h-4 fill-current" />
        {session.score} <span className="text-xs font-normal opacity-70">{t('game.score')}</span>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-fun/10 text-fun font-semibold">
        <Flame className="w-4 h-4 fill-current" />
        {session.streak} <span className="text-xs font-normal opacity-70">{t('game.streak')}</span>
      </div>
      <VoiceToggle />
    </div>
  )
}
