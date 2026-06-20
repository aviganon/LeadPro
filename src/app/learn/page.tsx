'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import {
  ArrowLeft, ArrowRight, Loader2, Building2, GraduationCap, Shapes, Atom,
  Ruler, Compass, Calculator, PenTool, Sigma, Pi, BookOpen, FlaskConical, Globe2, Check,
} from 'lucide-react'
import { useLocale, pickLang } from '@/context/LocaleContext'
import { LangToggle } from '@/components/LangToggle'
import { UserMenu } from '@/components/UserMenu'
import { Button } from '@/components/ui/button'
import { getSubjects, getInstitutions, getDepartments, getDepartmentSubjects } from '@/lib/db'
import { LEVELS, APP_NAME, APP_LOGO, gradeLabel } from '@/lib/constants'
import type { Level, Subject, Institution, Department } from '@/types'

type Step = 'level' | 'grade' | 'institution' | 'department' | 'year' | 'semester' | 'subject'

// ===== ערכת עיצוב לכל רמה — צבע, גרדיאנט, אייקון וכותרת משנה =====
interface LevelTheme {
  icon: React.ElementType
  tagline: string
  grad: string        // גרדיאנט לכותרת/אייקון
  accent: string      // צבע מבטא (oklch)
  soft: string        // רקע רך למבטא
  glyphs: string[]    // סמלי למידה אופייניים לרמה
}
const LEVEL_THEME: Record<string, LevelTheme> = {
  elementary: {
    icon: Shapes,
    tagline: 'בונים יסודות חזקים — בהנאה',
    grad: 'linear-gradient(135deg, oklch(0.82 0.16 75) 0%, oklch(0.68 0.2 30) 100%)',
    accent: 'oklch(0.7 0.19 45)',
    soft: 'oklch(0.7 0.19 45 / 0.12)',
    glyphs: ['＋', '−', 'ABC', '△', '123'],
  },
  middle_high: {
    icon: Atom,
    tagline: 'מגלים, חוקרים ומעמיקים',
    grad: 'linear-gradient(135deg, oklch(0.74 0.15 195) 0%, oklch(0.58 0.25 295) 100%)',
    accent: 'oklch(0.62 0.2 250)',
    soft: 'oklch(0.62 0.2 250 / 0.12)',
    glyphs: ['π', 'Σ', '√', 'H₂O', '∞'],
  },
  student: {
    icon: GraduationCap,
    tagline: 'לתואר, למקצוע ולהסמכה',
    grad: 'linear-gradient(135deg, oklch(0.56 0.16 285) 0%, oklch(0.44 0.07 265) 100%)',
    accent: 'oklch(0.55 0.18 285)',
    soft: 'oklch(0.55 0.18 285 / 0.12)',
    glyphs: ['∫', 'Δ', 'λ', '∂', 'Σℱ'],
  },
}

// ===== רקע למידה דקורטיבי — נייר משבצות + סמלים מרחפים =====
const FLOATING: { node: React.ReactNode; cls: string; delay: string }[] = [
  { node: <Pi className="w-full h-full" />, cls: 'top-[14%] right-[8%] w-10 h-10', delay: '0s' },
  { node: <Sigma className="w-full h-full" />, cls: 'top-[26%] left-[10%] w-9 h-9', delay: '1.2s' },
  { node: <Ruler className="w-full h-full" />, cls: 'top-[60%] right-[12%] w-11 h-11', delay: '0.6s' },
  { node: <Compass className="w-full h-full" />, cls: 'bottom-[16%] left-[14%] w-10 h-10', delay: '2s' },
  { node: <Calculator className="w-full h-full" />, cls: 'top-[42%] right-[22%] w-8 h-8', delay: '1.6s' },
  { node: <PenTool className="w-full h-full" />, cls: 'bottom-[28%] right-[30%] w-8 h-8', delay: '0.9s' },
  { node: <FlaskConical className="w-full h-full" />, cls: 'top-[70%] left-[26%] w-9 h-9', delay: '2.4s' },
  { node: <BookOpen className="w-full h-full" />, cls: 'top-[10%] left-[30%] w-9 h-9', delay: '1.8s' },
  { node: <Globe2 className="w-full h-full" />, cls: 'bottom-[10%] right-[44%] w-8 h-8', delay: '0.4s' },
  { node: <span className="text-2xl font-display">∑</span>, cls: 'top-[52%] left-[6%]', delay: '2.1s' },
  { node: <span className="text-2xl font-display">√x</span>, cls: 'bottom-[40%] left-[40%]', delay: '1.1s' },
  { node: <span className="text-xl font-display">a²+b²</span>, cls: 'top-[34%] left-[44%]', delay: '0.7s' },
]

function LearningBackground({ accent }: { accent?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* נייר משבצות (סרגל חישובים) — דועך בשוליים */}
      <div
        className="absolute inset-0 opacity-50 dark:opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in oklch, var(--foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 8%, transparent) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 78%)',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 78%)',
        }}
      />
      {/* הילת צבע לפי הרמה הנבחרת */}
      {accent && (
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-3xl opacity-25 transition-colors duration-700"
          style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
        />
      )}
      {/* סמלי למידה מרחפים */}
      {FLOATING.map((f, i) => (
        <div
          key={i}
          className={`absolute animate-float ${f.cls}`}
          style={{ animationDelay: f.delay, color: accent ? `color-mix(in oklch, ${accent} 35%, var(--muted-foreground))` : 'var(--muted-foreground)', opacity: 0.22 }}
        >
          {f.node}
        </div>
      ))}
    </div>
  )
}

function Header() {
  return (
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
  )
}

export default function LearnWizard() {
  const router = useRouter()
  const { t, locale, dir } = useLocale()
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft

  const [step, setStep] = useState<Step>('level')
  const [level, setLevel] = useState<Level | null>(null)
  const [grade, setGrade] = useState<number | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)

  // student path
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [institutionId, setInstitutionId] = useState<string | null>(null)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [semester, setSemester] = useState<'a' | 'b' | null>(null)

  const studentLevel = LEVELS.find((l) => l.id === 'student')
  const theme = level ? LEVEL_THEME[level] : null

  useEffect(() => {
    getInstitutions().then(setInstitutions).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    if (step === 'institution') {
      getInstitutions().then((d) => { if (active) { setInstitutions(d); setLoading(false) } }).catch(() => { if (active) { setInstitutions([]); setLoading(false) } })
    } else if (step === 'department' && institutionId) {
      getDepartments(institutionId).then((d) => { if (active) { setDepartments(d); setLoading(false) } }).catch(() => { if (active) { setDepartments([]); setLoading(false) } })
    } else if (step === 'subject') {
      const loader = level === 'student' && departmentId
        ? getDepartmentSubjects(departmentId, grade ?? 1, semester ?? undefined)
        : level ? getSubjects(level) : Promise.resolve([])
      loader.then((s) => { if (active) { setSubjects(s); setLoading(false) } }).catch(() => { if (active) { setSubjects([]); setLoading(false) } })
    }
    return () => { active = false }
  }, [step, institutionId, departmentId, level, grade, semester])

  const goBack = () => {
    if (step === 'grade' || step === 'institution') setStep('level')
    else if (step === 'department') setStep('institution')
    else if (step === 'year') setStep('department')
    else if (step === 'semester') setStep('year')
    else if (step === 'subject') setStep(level === 'student' ? 'semester' : 'grade')
  }

  const chooseLevel = (id: Level) => {
    setLevel(id)
    if (id === 'student') {
      if (institutions.length === 0) setLoading(true)
      setStep('institution')
    } else setStep('grade')
  }

  const visibleSubjects = level === 'student'
    ? subjects
    : grade ? subjects.filter((s) => grade >= s.gradeFrom && grade <= s.gradeTo) : subjects

  // כותרת שלב עם הדגשה בצבע הרמה (פונקציית עזר — לא רכיב, כדי לא לאפס state בכל רינדור)
  const stepTitle = (label: string) =>
    theme ? (
      <h1
        className="text-3xl md:text-4xl font-bold mb-8 text-center font-display"
        style={{ background: theme.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
      >
        {label}
      </h1>
    ) : (
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-display"><span className="gradient-text">{label}</span></h1>
    )

  // מחוון: שם הרמה הנבחרת
  const ThemeIcon = theme?.icon
  const levelChip = () =>
    theme && level && ThemeIcon ? (
      <div className="flex justify-center mb-6">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border"
          style={{ background: theme.soft, color: theme.accent, borderColor: `color-mix(in oklch, ${theme.accent} 30%, transparent)` }}
        >
          <ThemeIcon className="w-4 h-4" />
          {pickLang(locale, LEVELS.find((l) => l.id === level)?.nameHe ?? '', LEVELS.find((l) => l.id === level)?.nameEn ?? '')}
        </span>
      </div>
    ) : null

  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      <LearningBackground accent={theme?.accent} />
      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-6 py-10 max-w-4xl">
          {step !== 'level' && (
            <Button variant="ghost" size="sm" onClick={goBack} className="mb-6 gap-1">
              <Back className="w-4 h-4" /> {t('learn.back')}
            </Button>
          )}

          {/* ===== Step: Level ===== */}
          {step === 'level' && (
            <section className="animate-slide-up">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full mb-4">
                  <Ruler className="w-3.5 h-3.5" /> מתחילים ללמוד
                </span>
                <h1 className="text-4xl md:text-5xl font-bold font-display"><span className="gradient-text">{t('learn.chooseLevel')}</span></h1>
                <p className="text-muted-foreground mt-3 max-w-md mx-auto">בחרו את שלב הלימוד שלכם, ונתאים לכם את התוכן, המשחקים והמבחנים.</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3 stagger-children">
                {LEVELS.map((l) => {
                  const th = LEVEL_THEME[l.id]
                  const Icon = th.icon
                  return (
                    <button
                      key={l.id}
                      onClick={() => chooseLevel(l.id as Level)}
                      className="group relative rounded-[1.75rem] p-6 text-center border border-border bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)]"
                    >
                      <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: th.grad }} />
                      <span className="absolute -bottom-3 -left-3 text-5xl font-display opacity-[0.06] select-none" style={{ color: th.accent }}>{th.glyphs[0]}</span>
                      <span className="absolute top-4 left-4 text-lg font-display opacity-[0.12] select-none" style={{ color: th.accent }}>{th.glyphs[2]}</span>

                      <div
                        className="relative w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                        style={{ background: th.grad, boxShadow: `0 10px 30px -8px ${th.accent}` }}
                      >
                        <Icon className="w-10 h-10" strokeWidth={1.75} />
                        <span className="absolute -bottom-1 -right-1 text-2xl drop-shadow">{l.emoji}</span>
                      </div>

                      <div className="font-bold text-lg font-display">{pickLang(locale, l.nameHe, l.nameEn)}</div>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{th.tagline}</p>

                      <span
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: th.accent }}
                      >
                        בחירה <Back className="w-4 h-4" />
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-muted-foreground/70">
                {[
                  { i: Calculator, label: 'תרגול חכם' },
                  { i: Compass, label: 'חומרי עזר' },
                  { i: GraduationCap, label: 'מבחנים אמיתיים' },
                  { i: Sigma, label: 'מעקב התקדמות' },
                  { i: Atom, label: 'מורה AI' },
                ].map(({ i: I, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-sm">
                    <I className="w-4 h-4" /> {label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ===== Step: Grade (non-student) ===== */}
          {step === 'grade' && level && level !== 'student' && theme && (
            <section className="animate-slide-up">
              {levelChip()}
              {stepTitle(t('learn.chooseGrade'))}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-2xl mx-auto">
                {(LEVELS.find((l) => l.id === level)?.grades ?? []).map((g) => (
                  <button
                    key={g}
                    onClick={() => { setGrade(g); setLoading(true); setStep('subject') }}
                    className="group aspect-square rounded-3xl bg-card/70 backdrop-blur-sm border border-border flex flex-col items-center justify-center font-display transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="text-3xl font-bold" style={{ color: theme.accent }}>{gradeLabel(g)}</span>
                    <span className="text-xs text-muted-foreground mt-1">{t('learn.grade')}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ===== Step: Institution (student) ===== */}
          {step === 'institution' && (
            <section className="animate-slide-up">
              {levelChip()}
              {stepTitle(t('learn.chooseInstitution'))}
              {loading ? <Loading t={t} /> : institutions.length === 0 ? <Empty text={t('learn.noInstitutions')} /> : (
                <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
                  {institutions.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => { setInstitutionId(inst.id); setLoading(true); setStep('department') }}
                      className="rounded-3xl p-6 border border-border bg-card/70 backdrop-blur-sm hover-lift flex items-center gap-4 text-right"
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: theme?.soft, color: theme?.accent }}>
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="font-bold text-lg font-display">{inst.name}</div>
                        <div className="text-xs text-muted-foreground">{inst.type === 'university' ? 'אוניברסיטה' : 'מכללה'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ===== Step: Department (student) ===== */}
          {step === 'department' && (
            <section className="animate-slide-up">
              {levelChip()}
              {stepTitle(t('learn.chooseDepartment'))}
              {loading ? <Loading t={t} /> : departments.length === 0 ? <Empty text={t('learn.noDepartments')} /> : (
                <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
                  {departments.map((dep) => (
                    <button
                      key={dep.id}
                      onClick={() => { setDepartmentId(dep.id); setStep('year') }}
                      className="rounded-3xl p-6 border border-border bg-card/70 backdrop-blur-sm hover-lift flex items-center gap-4 text-right"
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: theme?.soft, color: theme?.accent }}>
                        <GraduationCap className="w-7 h-7" />
                      </div>
                      <div className="font-bold text-lg font-display">{dep.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ===== Step: Year (student) ===== */}
          {step === 'year' && (
            <section className="animate-slide-up">
              {levelChip()}
              {stepTitle(t('learn.chooseYear'))}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                {(studentLevel?.grades ?? []).map((y) => (
                  <button
                    key={y}
                    onClick={() => { setGrade(y); setStep('semester') }}
                    className="aspect-square rounded-3xl bg-card/70 backdrop-blur-sm border border-border hover-lift flex flex-col items-center justify-center font-display"
                  >
                    <span className="text-3xl font-bold" style={{ color: theme?.accent }}>{y}</span>
                    <span className="text-xs text-muted-foreground mt-1">{t('learn.year')}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ===== Step: Semester (student) ===== */}
          {step === 'semester' && (
            <section className="animate-slide-up">
              {levelChip()}
              {stepTitle(t('learn.chooseSemester'))}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {(['a', 'b'] as const).map((sem) => (
                  <button
                    key={sem}
                    onClick={() => { setSemester(sem); setLoading(true); setStep('subject') }}
                    className="rounded-3xl bg-card/70 backdrop-blur-sm border border-border hover-lift p-8 flex flex-col items-center justify-center font-display"
                  >
                    <span className="text-4xl font-bold mb-2" style={{ color: theme?.accent }}>{sem === 'a' ? "א'" : "ב'"}</span>
                    <span className="text-sm text-muted-foreground">{sem === 'a' ? t('learn.semesterA') : t('learn.semesterB')}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ===== Step: Subject / Course ===== */}
          {step === 'subject' && (
            <section className="animate-slide-up">
              {levelChip()}
              {stepTitle(t('learn.chooseSubject'))}
              {loading ? <Loading t={t} /> : visibleSubjects.length === 0 ? <Empty text={t('subject.noContent')} /> : (
                <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
                  {visibleSubjects.map((s) => {
                    const Icon = (Icons[s.icon as keyof typeof Icons] as React.ElementType) ?? Icons.BookOpen
                    return (
                      <button
                        key={s.id}
                        onClick={() => router.push(`/learn/${s.slug}?grade=${grade}`)}
                        className="group rounded-3xl p-6 border border-border bg-card/70 backdrop-blur-sm hover-lift flex items-center gap-4 text-right"
                      >
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                          style={{ backgroundColor: `color-mix(in oklch, ${s.color} 18%, transparent)`, color: s.color }}
                        >
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1 font-bold text-lg font-display">{pickLang(locale, s.nameHe, s.nameEn)}</div>
                        <Check className="w-5 h-5 text-transparent group-hover:text-muted-foreground transition-colors" />
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function Loading({ t }: { t: (k: 'common.loading') => string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />{t('common.loading')}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="py-16 text-center text-muted-foreground">{text}</div>
}
