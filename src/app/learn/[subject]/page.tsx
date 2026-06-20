'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import { ArrowRight, ArrowLeft, Loader2, Gamepad2, FileQuestion, BookOpen, Sparkles, Trophy, Target, ClipboardCheck, Calculator } from 'lucide-react'
import { useLocale, pickLang } from '@/context/LocaleContext'
import { LangToggle } from '@/components/LangToggle'
import { UserMenu } from '@/components/UserMenu'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GamePlayer } from '@/components/games/GamePlayer'
import { Quiz } from '@/components/games/Quiz'
import { Exam } from '@/components/games/Exam'
import { AiTutor } from '@/components/AiTutor'
import { Leaderboard } from '@/components/Leaderboard'
import { StudyReference } from '@/components/StudyReference'
import { LearningBackground } from '@/components/LearningBackground'
import { ComputeExercise } from '@/components/ComputeExercise'
import { GUIDED_SOLUTIONS } from '@/lib/guidedSolutions'
import { levelTheme } from '@/lib/levelTheme'
import { getSubjectBySlug, getGames, getQuestions, getMaterials } from '@/lib/db'
import { examScopeFor } from '@/lib/leaderboard'
import { getSubjectProgress, addQuizResult, addExamResult, readinessPct, readinessFromExam, type SubjectProgress } from '@/lib/localProgress'
import { getSavedName } from '@/lib/device'
import { APP_NAME, APP_LOGO, gradeLabel } from '@/lib/constants'
import type { Subject, Game, Question, Material } from '@/types'

type Difficulty = 'all' | 1 | 2 | 3

const GAME_EMOJI: Record<string, string> = { quiz: '❓', flashcards: '🃏', memory: '🧠', reading: '📖' }

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

  // difficulty, progress/readiness, leaderboard
  const [difficulty, setDifficulty] = useState<Difficulty>('all')
  const [progress, setProgress] = useState<SubjectProgress | null>(null)
  const [lbRefresh, setLbRefresh] = useState(0)
  const [activeSol, setActiveSol] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    getSubjectBySlug(params.subject)
      .then(async (subj) => {
        if (!active) return
        setSubject(subj)
        if (!subj) return
        setProgress(getSubjectProgress(subj.id))
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

  // הפרדה: שאלות תרגול (אימון) מול מאגר המבחן. אם אין מאגר מבחן — המבחן מורכב משאלות התרגול.
  const practiceQuestions = useMemo(() => questions.filter((q) => q.kind !== 'exam'), [questions])
  const examPool = useMemo(() => {
    const ex = questions.filter((q) => q.kind === 'exam')
    return ex.length ? ex : practiceQuestions
  }, [questions, practiceQuestions])

  const quizQuestions = useMemo(
    () => (practiceQuestions.length ? practiceQuestions : aiQuestions ?? []),
    [practiceQuestions, aiQuestions],
  )

  const filteredQuiz = useMemo(
    () => (difficulty === 'all' ? quizQuestions : quizQuestions.filter((q) => q.difficulty === difficulty)),
    [quizQuestions, difficulty],
  )

  // טבלת המנצחים מציגה ציוני מבחן בלבד
  const examScope = subject ? examScopeFor(subject.id, grade) : ''
  const theme = levelTheme(subject?.level)
  const solutions = subject?.courseNumber ? GUIDED_SOLUTIONS[subject.courseNumber] ?? [] : []

  const onQuizComplete = (correct: number, total: number, score: number) => {
    if (!subject) return
    addQuizResult(subject.id, correct, total, score)   // תרגול — מעדכן אימון בלבד, לא טבלת מנצחים
    setProgress(getSubjectProgress(subject.id))
  }

  const onExamComplete = (gradeResult: number) => {
    if (!subject) return
    addExamResult(subject.id, gradeResult)             // מבחן — משפיע על מוכנות ועל טבלת המנצחים
    setProgress(getSubjectProgress(subject.id))
    setLbRefresh((n) => n + 1)
  }

  const DIFFS: { v: Difficulty; k: 'diff.all' | 'diff.easy' | 'diff.medium' | 'diff.hard' }[] = [
    { v: 'all', k: 'diff.all' }, { v: 1, k: 'diff.easy' }, { v: 2, k: 'diff.medium' }, { v: 3, k: 'diff.hard' },
  ]

  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      <LearningBackground accent={theme?.accent} />
      <div className="relative z-10">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={APP_LOGO} alt={APP_NAME} className="w-9 h-9 rounded-2xl object-cover" width={36} height={36} />
            <span className="font-bold gradient-text font-display">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-1">
            <LangToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
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
                  {subject.level === 'student'
                    ? `${t('learn.year')} ${grade}`
                    : `${t('learn.grade')} ${gradeLabel(grade)}`}
                </p>
              </div>
            </div>

            {/* Readiness / progress */}
            <div className="gradient-card rounded-3xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold font-display">
                  <Target className="w-5 h-5 text-primary" />{t('ready.title')}
                </div>
                {progress && (progress.answered > 0 || progress.examsTaken > 0) && (
                  <span className="text-2xl font-bold gradient-text">{readinessPct(progress)}%</span>
                )}
              </div>
              {progress && (progress.answered > 0 || progress.examsTaken > 0) ? (
                <>
                  <div className="h-3 rounded-full bg-muted overflow-hidden mb-3">
                    <div className="h-full bg-gradient-to-l from-primary to-accent transition-all" style={{ width: `${readinessPct(progress)}%` }} />
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      {readinessFromExam(progress)
                        ? <><ClipboardCheck className="w-3.5 h-3.5 text-primary" />{t('ready.byExam')}</>
                        : <><FileQuestion className="w-3.5 h-3.5" />{t('ready.byPractice')}</>}
                    </span>
                    {progress.examsTaken > 0 && <span>{t('ready.examGrade')}: <b className="text-foreground">{progress.bestExam}</b></span>}
                    <span>{t('ready.answered')}: <b className="text-foreground">{progress.answered}</b></span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('ready.none')}</p>
              )}
            </div>

            <Tabs defaultValue="games">
              <TabsList className="w-full flex-wrap h-auto">
                <TabsTrigger value="games" className="flex-1 gap-1.5"><Gamepad2 className="w-4 h-4" />{t('subject.games')}</TabsTrigger>
                <TabsTrigger value="questions" className="flex-1 gap-1.5"><FileQuestion className="w-4 h-4" />{t('subject.questions')}</TabsTrigger>
                <TabsTrigger value="exam" className="flex-1 gap-1.5"><ClipboardCheck className="w-4 h-4" />{t('subject.exam')}</TabsTrigger>
                {solutions.length > 0 && (
                  <TabsTrigger value="guided" className="flex-1 gap-1.5"><Calculator className="w-4 h-4" />{t('subject.guided')}</TabsTrigger>
                )}
                <TabsTrigger value="board" className="flex-1 gap-1.5"><Trophy className="w-4 h-4" />{t('subject.leaderboard')}</TabsTrigger>
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
                  <div className={materials.length ? 'grid gap-6 items-start lg:grid-cols-[1fr_20rem]' : ''}>
                    {/* עמודה ראשית: השאלות (בימין ב-RTL) */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-5">
                        <span className="text-sm text-muted-foreground">{t('diff.label')}:</span>
                        {DIFFS.map((d) => (
                          <Button
                            key={String(d.v)}
                            variant={difficulty === d.v ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDifficulty(d.v)}
                            className="rounded-2xl"
                          >
                            {t(d.k)}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-fun" />{t('subject.practiceHint')}
                      </p>
                      {filteredQuiz.length > 0 ? (
                        <Quiz key={String(difficulty)} questions={filteredQuiz} onComplete={onQuizComplete} />
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">{t('subject.noContent')}</div>
                      )}
                    </div>

                    {/* עמודת צד שמאל: חומר עזר לנושא */}
                    {materials.length > 0 && (
                      <div className="lg:sticky lg:top-20">
                        <StudyReference materials={materials} />
                      </div>
                    )}
                  </div>
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

              {/* EXAM — מבחן אמיתי, מתוזמן ומדורג; התוצאה נכנסת לטבלת המנצחים */}
              <TabsContent value="exam" className="pt-6">
                <Exam questions={examPool} leaderboardScope={examScope} subjectId={subject.id} grade={grade} mahat={examPool.some((q) => !!q.examPaper)} onComplete={onExamComplete} />
              </TabsContent>

              {/* GUIDED — פתרונות מודרכים מונפשים לתרגילים חישוביים */}
              {solutions.length > 0 && (
                <TabsContent value="guided" className="pt-6">
                  {(() => {
                    const sel = solutions.find((x) => x.id === activeSol)
                    if (sel) return <ComputeExercise sol={sel} onBack={() => setActiveSol(null)} />
                    return (
                      <>
                        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5">
                          <Calculator className="w-4 h-4 text-primary" />פתרו את התרגיל בעצמכם — ואם צריך, יש פתרון מודרך מונפש.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {solutions.map((sol) => (
                            <button
                              key={sol.id}
                              onClick={() => setActiveSol(sol.id)}
                              className="gradient-card rounded-3xl p-5 border border-border hover-lift flex items-start gap-3 text-right"
                            >
                              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Calculator className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold font-display">{sol.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{sol.question}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </TabsContent>
              )}

              {/* LEADERBOARD — ציוני מבחן בלבד */}
              <TabsContent value="board" className="pt-6">
                <Leaderboard scope={examScope} refreshKey={lbRefresh} highlightName={getSavedName()} />
              </TabsContent>

              {/* HELP — מורה פרטי בלבד (חומר העזר עבר לטאב השאלות) */}
              <TabsContent value="help" className="pt-6">
                <AiTutor subject={subject.slug} subjectName={subjName} grade={grade} level={subject.level} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      </div>
    </div>
  )
}
