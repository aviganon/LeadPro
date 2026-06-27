'use client'

import { Star, Flame, Sparkles, RotateCcw } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import { Button } from '@/components/ui/button'
import type { GameSession } from '@/hooks/useGameSession'
import { VoiceToggle } from './VoiceToggle'

/** קריאה בסיום משחק: (correct, total, score). */
export interface ReadingDone { (correct: number, total: number, score: number): void }

/** מחמאות אקראיות — חיזוק חיובי לכיתה א'. */
export const PRAISE = ['כָּל הַכָּבוֹד!', 'מְעוּלֶה!', 'אַלּוּף/ה!', 'וָואו!', 'מַדְהִים!', 'יָפֶה מְאוֹד!', 'מָמָשׁ טוֹב!', 'אֵיזֶה כֵּיף!']
export function praise(): string { return PRAISE[Math.floor(Math.random() * PRAISE.length)] }

/** כותרת ניקוד גדולה וידידותית לילדים: ניקוד המשחק, רצף, וארנק הכוכבים המצטבר. */
export function KidHeader({ session, wallet }: { session: GameSession; wallet: number }) {
  return (
    <div className="flex items-center justify-center gap-2.5 mb-4 flex-wrap" dir="rtl">
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-3xl bg-primary/10 text-primary">
        <Star className="w-7 h-7 fill-current" />
        <span className="text-3xl font-extrabold font-display tabular-nums">{session.score}</span>
      </div>
      {session.streak > 1 && (
        <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-3xl bg-fun/10 text-fun animate-pop">
          <Flame className="w-6 h-6 fill-current" />
          <span className="text-2xl font-bold tabular-nums">{session.streak}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-3xl bg-amber-400/15 text-amber-500" title="כל הכוכבים שצברת">
        <Sparkles className="w-6 h-6" />
        <span className="text-xl font-bold tabular-nums">{wallet + session.score}</span>
      </div>
      <VoiceToggle className="!p-2.5 !rounded-3xl" />
    </div>
  )
}

/** נקודות התקדמות: מה כבר ענינו ומה נשאר. */
export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap mb-5" dir="ltr">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < current ? 'bg-success w-3 h-3' : i === current ? 'bg-primary w-4 h-4 ring-4 ring-primary/20' : 'bg-muted w-3 h-3'
          }`}
        />
      ))}
      <span className="text-sm text-muted-foreground mr-1.5">נשארו {Math.max(0, total - current)}</span>
    </div>
  )
}

/** מסך סיום חגיגי משותף — מחמאה, כוכבי המשחק, וסך הכוכבים המצטבר. */
export function DoneScreen({ message, score, correct, total, wallet, onRestart }: { message: string; score: number; correct: number; total: number; wallet: number; onRestart: () => void }) {
  const { t } = useLocale()
  return (
    <div className="text-center py-8 animate-pop max-w-md mx-auto">
      <div className="text-7xl mb-3">🎉</div>
      <h3 className="text-3xl font-extrabold font-display mb-1 text-primary" dir="rtl">{message}</h3>
      <p className="text-muted-foreground mb-4" dir="rtl">{correct}/{total} תשובות נכונות</p>
      <div className="flex items-center justify-center gap-3 mb-2" dir="rtl">
        <div className="flex items-center gap-2 px-5 py-3 rounded-3xl bg-primary/10 text-primary">
          <Star className="w-7 h-7 fill-current" />
          <span className="text-3xl font-extrabold font-display">+{score}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 text-amber-500 font-bold text-lg mb-6 animate-pop" dir="rtl">
        <Sparkles className="w-6 h-6" />
        <span>עכשיו יש לך {wallet} כוכבים!</span>
      </div>
      <Button onClick={onRestart} size="lg" className="rounded-2xl text-lg"><RotateCcw className="w-5 h-5 ml-2" />{t('game.again')}</Button>
    </div>
  )
}
