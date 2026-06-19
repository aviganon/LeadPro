'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useLocale, pickLang } from '@/context/LocaleContext'
import { LangToggle } from '@/components/LangToggle'
import { Button } from '@/components/ui/button'
import { getSubjects } from '@/lib/db'
import { LEVELS, APP_NAME, APP_LOGO } from '@/lib/constants'
import type { Level, Subject } from '@/types'

type Step = 'level' | 'grade' | 'subject'

function Header() {
  return (
    <header className="glass sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src={APP_LOGO} alt={APP_NAME} className="w-9 h-9 rounded-2xl object-cover" width={36} height={36} />
          <span className="font-bold gradient-text font-display">{APP_NAME}</span>
        </Link>
        <LangToggle />
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

  const levelMeta = LEVELS.find((l) => l.id === level)

  useEffect(() => {
    if (step !== 'subject' || !level) return
    let active = true
    getSubjects(level)
      .then((s) => { if (active) { setSubjects(s); setLoading(false) } })
      .catch(() => { if (active) { setSubjects([]); setLoading(false) } })
    return () => { active = false }
  }, [step, level])

  const goBack = () => {
    if (step === 'grade') setStep('level')
    else if (step === 'subject') setStep('grade')
  }

  const filteredSubjects = grade
    ? subjects.filter((s) => grade >= s.gradeFrom && grade <= s.gradeTo)
    : subjects

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
                  onClick={() => { setLevel(l.id as Level); setStep('grade') }}
                  className="gradient-card rounded-3xl p-8 border border-border hover-lift text-center"
                >
                  <div className="text-5xl mb-3">{l.emoji}</div>
                  <div className="font-bold text-lg font-display">{pickLang(locale, l.nameHe, l.nameEn)}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step: Grade */}
        {step === 'grade' && levelMeta && (
          <section className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-display">{t('learn.chooseGrade')}</h1>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {levelMeta.grades.map((g) => (
                <button
                  key={g}
                  onClick={() => { setGrade(g); setLoading(true); setStep('subject') }}
                  className="aspect-square rounded-3xl bg-card border border-border hover-lift flex flex-col items-center justify-center font-display"
                >
                  <span className="text-3xl font-bold gradient-text">{g}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {level === 'student' ? t('learn.year') : t('learn.grade')}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step: Subject */}
        {step === 'subject' && (
          <section className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-display">{t('learn.chooseSubject')}</h1>
            {loading ? (
              <div className="py-16 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />{t('common.loading')}
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">{t('learn.noSubjects')}</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredSubjects.map((s) => {
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
