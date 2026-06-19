'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { Button } from '@/components/ui/button'
import { LangToggle } from '@/components/LangToggle'
import { UserMenu } from '@/components/UserMenu'
import { getGlobalStats } from '@/lib/localProgress'
import { APP_LOGO, APP_NAME } from '@/lib/constants'
import {
  Gamepad2, Sparkles, GraduationCap, ArrowLeft, ArrowRight,
  Calculator, Languages, Trophy, Brain, Star,
} from 'lucide-react'

function Navbar() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [points, setPoints] = useState(0)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration read from localStorage
  useEffect(() => { setPoints(getGlobalStats().points) }, [])

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <img
            src={APP_LOGO}
            alt={`${APP_NAME} Logo`}
            className="w-10 h-10 rounded-2xl shadow-md object-cover group-hover:scale-110 transition-transform"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold gradient-text font-display hidden sm:inline">{APP_NAME}</span>
        </Link>

        <div className="flex items-center gap-2 min-w-0">
          {user ? (
            <>
              {/* ברוך הבא + ניקוד התקדמות */}
              <div className="hidden sm:flex flex-col items-end leading-tight min-w-0">
                <span className="text-sm font-medium truncate max-w-[10rem]">ברוך הבא, {user.name} 👋</span>
                {points > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 fill-fun text-fun" />{points.toLocaleString('he-IL')} נקודות
                  </span>
                )}
              </div>
              <Button size="sm" asChild className="rounded-2xl"><Link href="/learn">{t('nav.learn')}</Link></Button>
              <LangToggle />
              <UserMenu />
            </>
          ) : (
            <>
              <LangToggle />
              {/* כפתור הרשמה בולט וזוהר */}
              <Button size="sm" asChild className="rounded-2xl animate-glow bg-gradient-to-l from-primary to-fun text-white font-bold shadow-lg">
                <Link href="/auth?mode=signup">✨ הרשמה</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild><Link href="/auth">{t('nav.login')}</Link></Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function HomePage() {
  const { t, dir } = useLocale()
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight

  const features = [
    { icon: Gamepad2, title: t('home.f1Title'), desc: t('home.f1Desc'), color: 'text-primary bg-primary/10' },
    { icon: Brain, title: t('home.f2Title'), desc: t('home.f2Desc'), color: 'text-accent bg-accent/10' },
    { icon: Sparkles, title: t('home.f3Title'), desc: t('home.f3Desc'), color: 'text-fun bg-fun/10' },
  ]

  return (
    <div className="min-h-screen bg-mesh overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-24 right-[12%] w-24 h-24 rounded-3xl bg-primary/20 animate-float-slow blur-sm" />
        <div className="absolute top-48 left-[14%] w-16 h-16 rounded-2xl bg-accent/25 animate-float blur-sm" />
        <div className="absolute bottom-20 right-[20%] w-20 h-20 rounded-full bg-fun/20 animate-float-delay-2 blur-sm" />

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-pop">
            <GraduationCap className="w-4 h-4" />
            {APP_NAME}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-display leading-tight animate-slide-up">
            <span className="gradient-text">{t('home.heroTitle')}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up">
            {t('home.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Button size="lg" className="text-lg h-14 px-8 btn-shimmer rounded-2xl" asChild>
              <Link href="/learn">
                {t('home.cta')}
                <Arrow className="w-5 h-5 mr-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg h-14 px-8 rounded-2xl" asChild>
              <a href="#features">{t('home.ctaSecondary')}</a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3 mt-12 flex-wrap">
            {[
              { icon: Calculator, label: dir === 'rtl' ? 'חשבון' : 'Math' },
              { icon: Languages, label: dir === 'rtl' ? 'אנגלית' : 'English' },
              { icon: Trophy, label: dir === 'rtl' ? 'נקודות והישגים' : 'Points & badges' },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card shadow-sm border border-border">
                <c.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {features.map((f, i) => (
              <div key={i} className="gradient-card rounded-3xl p-8 border border-border hover-lift">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${f.color}`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-2 font-display">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="gradient-hero rounded-[2rem] p-12 text-center text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 animate-float" />
            <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full bg-white/10 animate-float-slow" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display relative z-10">{t('home.heroTitle')}</h2>
            <p className="text-white/80 mb-8 relative z-10">{t('home.heroSubtitle')}</p>
            <Button size="lg" variant="secondary" className="text-lg h-14 px-8 rounded-2xl relative z-10" asChild>
              <Link href="/learn">{t('home.cta')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  )
}
