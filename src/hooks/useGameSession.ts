'use client'

import { useCallback, useState } from 'react'
import { burstConfetti } from '@/lib/confetti'

const POINTS_PER_CORRECT = 10

export interface GameSession {
  score: number
  streak: number
  bestStreak: number
  answered: number
  correct: number
  /** call on each answer; returns whether it was correct */
  record: (isCorrect: boolean) => void
  reset: () => void
}

/** ניהול ניקוד/רצף משותף לכל המשחקים, כולל confetti על רצף */
export function useGameSession(): GameSession {
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)

  const record = useCallback((isCorrect: boolean) => {
    setAnswered((a) => a + 1)
    if (isCorrect) {
      setCorrect((c) => c + 1)
      setStreak((s) => {
        const next = s + 1
        setBestStreak((b) => Math.max(b, next))
        // bonus points grow with streak, and confetti every 3 in a row
        setScore((sc) => sc + POINTS_PER_CORRECT + Math.min(next - 1, 5) * 2)
        if (next % 3 === 0) burstConfetti()
        return next
      })
    } else {
      setStreak(0)
    }
  }, [])

  const reset = useCallback(() => {
    setScore(0); setStreak(0); setBestStreak(0); setAnswered(0); setCorrect(0)
  }, [])

  return { score, streak, bestStreak, answered, correct, record, reset }
}
