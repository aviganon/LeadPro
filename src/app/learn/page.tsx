'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import { ArrowLeft, ArrowRight, Loader2, Building2, GraduationCap } from 'lucide-react'
import { useLocale, pickLang } from '@/context/LocaleContext'
import { LangToggle } from '@/components/LangToggle'
import { UserMenu } from '@/components/UserMenu'
import { Button } from '@/components/ui/button'
import { getSubjects, getInstitutions, getDepartments, getDepartmentSubjects } from '@/lib/db'
import { LEVELS, APP_NAME, APP_LOGO } from '@/lib/constants'
import type { Level, Subject, Institution, Department } from '@/types'

type Step = 'level' | 'grade' | 'institution' | 'department' | 'year' | 'subject'

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

  const studentLevel = LEVELS.find((l) => l.id === 'student')

  // Load list data when entering a step that needs it
  useEffect(() => {
    let active = true
    if (step === 'institution') {
      getInstitutions().then((d) => { if (active) { setInstitutions(d); setLoading(false) } }).catch(() => { if (active) { setInstitutions([]); setLoading(false) } })
    } else if (step === 'department' && institutionId) {
      getDepartments(institutionId).then((d) => { if (active) { setDepartments(d); setLoading(false) } }).catch(() => { if (active) { setDepartments([]); setLoading(false) } })
    } else if (step === 'subject') {
      const loader = level === 'student' && departmentId
        ? getDepartmentSubjects(departmentId, grade ?? 1)
        : level ? getSubjects(level) : Promise.resolve([])
      loader.then((s) => { if (active) { setSubjects(s); setLoading(false) } }).catch(() => { if (active) { setSubjects([]); setLoading(false) } })
    }
    return () => { active = false }
  }, [step, institutionId, departmentId, level, grade])

  const goBack = () => {
    if (step === 'grade' || step === 'institution') setStep('level')
    else if (step === 'department') setStep('institution')
    else if (step === 'year') setStep('department')
    else if (step === 'subject') setStep(level === 'student' ? 'year' : 'grade')
  }

  const chooseLevel = (id: Level) => {
    setLevel(id)
    if (id === 'student') { setLoading(true); setStep('institution') }
    else setStep('grade')
  }

  // for non-student levels, subjects are filtered by chosen grade
  const visibleSubjects = level === 'student'
    ? subjects
    : grade ? subjects.filter((s) => grade >= s.gradeFrom && grade <= s.gradeTo) : subjects

  return (
    <div className="min-h-screen bg-mesh">
      <Header />

      <main className="container mx-auto px-6 py-10 max-w-3xl">
        {step !== 'level' && (
          <Button variant="ghost" size="sm" onClick={goBack} className="mb-6 gap-1">
            <Back className="w-4 h-4" /> {t('learn.back')}
          </Button>
        )}

        {/* Step: Level */}
        {step === 'level' && (
          <section className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-display">{t('learn.chooseLevel')}</h1>
            <div className="grid gap-4 sm:grid-cols-3">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => chooseLevel(l.id as Level)}
                  className="gradient-card rounded-3xl p-8 border border-border hover-lift text-center"
                >
                  <div className="text-5xl mb-3">{l.emoji}</div>
                  <div className="font-bold text-lg font-display">{pickLang(locale, l.nameHe, l.nameEn)}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step: Grade (non-student) */}
        {step === 'grade' && level && level !== 'student' && (
          <section className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-display">{t('learn.chooseGrade')}</h1>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {(LEVELS.find((l) => l.id === level)?.grades ?? []).map((g) => (
                <button
                  key={g}
                  onClick={() => { setGrade(g); setLoading(true); setStep('subject') }}
                  className="aspect-square rounded-3xl bg-card border border-border hover-lift flex flex-col items-center justify-center font-display"
                >
                  <span className="text-3xl font-bold gradient-text">{g}</span>
                  <span className="text-xs text-muted-foreground mt-1">{t('learn.grade')}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step: Institution (student) */}
        {step === 'institution' && (
          <section className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-display">{t('learn.chooseInstitution')}</h1>
            {loading ? (
              <Loading t={t} />
            ) : institutions.length === 0 ? (
              <Empty text={t('learn.noInstitutions')} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {institutions.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => { setInstitutionId(inst.id); setLoading(true); setStep('department') }}
                    className="gradient-card rounded-3xl p-6 border border-border hover-lift flex items-center gap-4 text-right"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
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

        {/* Step: Department (student) */}
        {step === 'department' && (
          <section className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-display">{t('learn.chooseDepartment')}</h1>
            {loading ? (
              <Loading t={t} />
            ) : departments.length === 0 ? (
              <Empty text={t('learn.noDepartments')} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {departments.map((dep) => (
                  <button
                    key={dep.id}
                    onClick={() => { setDepartmentId(dep.id); setStep('year') }}
                    className="gradient-card rounded-3xl p-6 border border-border hover-lift flex items-center gap-4 text-right"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div className="font-bold text-lg font-display">{dep.name}</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step: Year (student) */}
        {step === 'year' && (
          <section className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-display">{t('learn.chooseYear')}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(studentLevel?.grades ?? []).map((y) => (
                <button
                  key={y}
                  onClick={() => { setGrade(y); setLoading(true); setStep('subject') }}
                  className="aspect-square rounded-3xl bg-card border border-border hover-lift flex flex-col items-center justify-center font-display"
                >
                  <span className="text-3xl font-bold gradient-text">{y}</span>
                  <span className="text-xs text-muted-foreground mt-1">{t('learn.year')}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step: Subject / Course */}
        {step === 'subject' && (
          <section className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-display">{t('learn.chooseSubject')}</h1>
            {loading ? (
              <Loading t={t} />
            ) : visibleSubjects.length === 0 ? (
              <Empty text={t('subject.noContent')} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleSubjects.map((s) => {
                  const Icon = (Icons[s.icon as keyof typeof Icons] as React.ElementType) ?? Icons.BookOpen
                  return (
                    <button
                      key={s.id}
                      onClick={() => router.push(`/learn/${s.slug}?grade=${grade}`)}
                      className="gradient-card rounded-3xl p-6 border border-border hover-lift flex items-center gap-4 text-right"
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `color-mix(in oklch, ${s.color} 18%, transparent)`, color: s.color }}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="font-bold text-lg font-display">{pickLang(locale, s.nameHe, s.nameEn)}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>
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
