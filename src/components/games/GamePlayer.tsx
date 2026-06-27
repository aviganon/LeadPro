'use client'

import { Quiz } from './Quiz'
import { Flashcards, type FlashCard } from './Flashcards'
import { Memory, type MemoryPair } from './Memory'
import { ReadingGame, type ReadingMode } from './ReadingGame'
import { SentenceGame, OrderSentence, type SentenceMode } from './SentenceGame'
import type { ReadCategory, ReadSentence } from '@/lib/readingContent'
import type { Game, Question } from '@/types'
import { addStars, addQuizResult } from '@/lib/localProgress'
import { incrementUserStars } from '@/lib/db'
import { useAuth } from '@/context/AuthContext'

/**
 * מציג משחק לפי הסוג שלו. תצורת המשחק נשמרת ב-game.config:
 * - quiz: { questions?: Question[] } (אם ריק — משתמש במאגר השאלות של המקצוע)
 * - flashcards: { cards: { front, back }[] }
 * - memory: { pairs: { a, b }[] }
 */
export function GamePlayer({ game, questionBank }: { game: Game; questionBank: Question[] }) {
  const config = game.config ?? {}
  const { user } = useAuth()

  // סיום משחק → צובר נקודות לארנק הכוכבים המתמשך + מעדכן התקדמות במקצוע.
  // אם המשתמש מחובר — מסנכרן את הכוכבים גם לחשבון ב-Firestore (נשמר בין מכשירים).
  const finish = (correct: number, total: number, score: number) => {
    addStars(score)
    if (game.subjectId) addQuizResult(game.subjectId, correct, total, score)
    if (user && score > 0) void incrementUserStars(user.id, score, 1).catch(() => { /* offline — נשמר מקומית */ })
  }

  if (game.type === 'flashcards') {
    const cards = (config.cards as FlashCard[] | undefined) ?? []
    return <Flashcards cards={cards} />
  }

  if (game.type === 'memory') {
    const pairs = (config.pairs as MemoryPair[] | undefined) ?? []
    return <Memory pairs={pairs} />
  }

  if (game.type === 'reading') {
    const mode = (config.mode as string | undefined) ?? 'pic2word'
    if (mode === 'sentence' || mode === 'cloze') {
      const sentences = (config.sentences as ReadSentence[] | undefined) ?? []
      return <SentenceGame mode={mode as SentenceMode} sentences={sentences} onComplete={finish} />
    }
    if (mode === 'order') {
      const sentences = (config.sentences as ReadSentence[] | undefined) ?? []
      return <OrderSentence sentences={sentences} onComplete={finish} />
    }
    const categories = (config.categories as ReadCategory[] | undefined) ?? []
    return <ReadingGame mode={mode as ReadingMode} categories={categories} onComplete={finish} />
  }

  // quiz (default)
  const questions = (config.questions as Question[] | undefined)?.length
    ? (config.questions as Question[])
    : questionBank
  return <Quiz questions={questions} onComplete={finish} />
}
