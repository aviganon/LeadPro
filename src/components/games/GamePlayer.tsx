'use client'

import { Quiz } from './Quiz'
import { Flashcards, type FlashCard } from './Flashcards'
import { Memory, type MemoryPair } from './Memory'
import type { Game, Question } from '@/types'

/**
 * מציג משחק לפי הסוג שלו. תצורת המשחק נשמרת ב-game.config:
 * - quiz: { questions?: Question[] } (אם ריק — משתמש במאגר השאלות של המקצוע)
 * - flashcards: { cards: { front, back }[] }
 * - memory: { pairs: { a, b }[] }
 */
export function GamePlayer({ game, questionBank }: { game: Game; questionBank: Question[] }) {
  const config = game.config ?? {}

  if (game.type === 'flashcards') {
    const cards = (config.cards as FlashCard[] | undefined) ?? []
    return <Flashcards cards={cards} />
  }

  if (game.type === 'memory') {
    const pairs = (config.pairs as MemoryPair[] | undefined) ?? []
    return <Memory pairs={pairs} />
  }

  // quiz (default)
  const questions = (config.questions as Question[] | undefined)?.length
    ? (config.questions as Question[])
    : questionBank
  return <Quiz questions={questions} />
}
