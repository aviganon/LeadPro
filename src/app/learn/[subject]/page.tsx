'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import { ArrowRight, ArrowLeft, Loader2, Gamepad2, FileQuestion, BookOpen, Sparkles } from 'lucide-react'
import { useLocale, pickLang } from '@/context/LocaleContext'
import { LangToggle } from '@/components/LangToggle'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GamePlayer } from '@/components/games/GamePlayer'
import { Quiz } from '@/components/games/Quiz'
import { AiTutor } from '@/components/AiTutor'
import { getSubjectBySlug, getGames, getQuestions, getMaterials } from '@/lib/db'
import { APP_NAME, APP_LOGO } from '@/lib/constants'
import type { Subject, Game, Question, Material } from '@/types'

const GAME_EMOJI: Record<string, string> = { quiz: '❓', flashcards: '🃏', memory: '🧠' }

export default function SubjectHub() {
  const params = useParams<{ subject: string }>()
  const searchParams = useSearchParams()
  const grade = Number(searchParams.get('grade')) || 1
  const { t, locale, dir } = useLocale()
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft

  const [subject, setSubject] = useState<Subject | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGame, setActiveGame] = useState<Game | null>(null)

  // AI-generated questions (when bank empty)
  const [aiQuestions, setAiQuestions] = useState<Question[] | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getSubjectBySlug(params.subject)
      .then(async (subj) => {
        if (!active) return
        setSubject(subj)
        if (!subj) return
        const [g, q, m] = await Promise.all([
          getGames(subj.id, grade),
          getQuestions(subj.id, grade),
          getMaterials(subj.id, grade),
        ])
        if (!active) return
        setGames(g); setQuestions(q); setMaterials(m)
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [params.subject, grade])

  const subjName = subject ? pickLang(locale, subject.nameHe, subject.nameEn) : ''
  const SubjIcon = (subject && (Icons[subject.icon as keyof typeof Icons] as React.ElementType)) || BookOpen

  const generateQuestions = async () => {
    setGenLoading(true); setGenError('')
    try {
      const res = await fetch('/api/ai/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject?.slug, subjectName: subjName, grade, level: subject?.level, count: 5, lang: locale }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGenError(data.error === 'AI is not configured' ? 'יצירת השאלות עדיין לא הוגדרה (חסר מפתח API).' : 'שגיאה — נסו שוב')
        return
      }
      const mapped: Question[] = (data.questions ?? []).map((q: { prompt: string; options: string[]; answer: string; explanation?: string }, i: number) => ({
        id: `ai-${i}`,
        subjectId: subject?.id ?? '',
        level: subject?.level ?? 'elementary',
        grade,
        lang: locale,
        type: 'mc',
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: 1,
      }))
      setAiQuestions(mapped)
    } catch {
      setGenError('שגיאה — נסו שוב')
    } finally {
      setGenLoading(false)
    }
  }

  const quizQuestions = useMemo(() => (questions.length ? questions : aiQuestions ?? []), [questions, aiQuestions])

  return (
    <div className="min-h-screen bg-mesh">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={APP_LOGO} alt={APP_NAME} className="w-9 h-9 rounded-2xl object-cover" width={36} height={36} />
            <span className="font-bold gradient-text font-display">{APP_NAME}</span>
          </Link>
          <LangToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-4 gap-1">
          <Link href="/learn"><Back className="w-4 h-4" />{t('learn.back')}</Link>
        </Button>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />{t('common.loading')}
          </div>
        ) : !subject ? (
          <div className="py-20 text-center text-muted-foreground">{t('learn.noSubjects')}</div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ backgroundColor: `color-mix(in oklch, ${subject.color} 18%, transparent)`, color: subject.color }}
              >
                <SubjIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-display">{subjName}</h1>
                <p className="text-muted-foreground">
                  {subject.level === 'student' ? t('learn.year') : t('learn.grade')} {grade}
                </p>
              </div>
            </div>

            <Tabs defaultValue="games">
              <TabsList className="w-full">
                <TabsTrigger value="games" className="flex-1 gap-1.5"><Gamepad2 className="w-4 h-4" />{t('subject.games')}</TabsTrigger>
                <TabsTrigger value="questions" className="flex-1 gap-1.5"><FileQuestion className="w-4 h-4" />{t('subject.questions')}</TabsTrigger>
                <TabsTrigger value="help" className="flex-1 gap-1.5"><BookOpen className="w-4 h-4" />{t('subject.help')}</TabsTrigger>
              </TabsList>

              {/* GAMES */}
              <TabsContent value="games" className="pt-6">
                {activeGame ? (
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveGame(null)} className="mb-4 gap-1">
                      <Back className="w-4 h-4" />{t('learn.back')}
                    </Button>
                    <GamePlayer game={activeGame} questionBank={quizQuestions} />
                  </div>
                ) : games.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">{t('subject.noContent')}</div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {games.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setActiveGame(g)}
                        className="gradient-card rounded-3xl p-6 border border-border hover-lift flex items-center gap-4 text-right"
                      >
                        <span className="text-4xl">{GAME_EMOJI[g.type] ?? '🎮'}</span>
                        <span className="font-bold text-lg font-display">{pickLang(locale, g.titleHe, g.titleEn)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* QUESTIONS */}
              <TabsContent value="questions" className="pt-6">
                {quizQuestions.length > 0 ? (
                  <Quiz questions={quizQuestions} />
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground mb-5">{t('subject.noContent')}</p>
                    <Button onClick={generateQuestions} disabled={genLoading} className="rounded-2xl">
                      {genLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Sparkles className="w-4 h-4 ml-2" />}
                      {t('subject.generateMore')}
                    </Button>
                    {genError && <p className="text-sm text-destructive mt-4">{genError}</p>}
                  </div>
                )}
              </TabsContent>

              {/* HELP */}
              <TabsContent value="help" className="pt-6 space-y-6">
                {materials.map((m) => (
                  <div key={m.id} className="gradient-card rounded-3xl border border-border p-6">
                    <h3 className="font-bold font-display text-lg mb-3">{m.title}</h3>
                    <div className="whitespace-pre-wrap leading-relaxed text-foreground/90" dir="auto">{m.bodyMarkdown}</div>
                  </div>
                ))}
                <AiTutor subject={subject.slug} subjectName={subjName} grade={grade} level={subject.level} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}
