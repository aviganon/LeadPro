'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLocale, pickLang } from '@/context/LocaleContext'
import { Button } from '@/components/ui/button'
import { LangToggle } from '@/components/LangToggle'
import { UserMenu } from '@/components/UserMenu'
import { LearningBackground } from '@/components/LearningBackground'
import { LEVEL_THEME } from '@/lib/levelTheme'
import { getGlobalStats } from '@/lib/localProgress'
import { LEVELS, APP_LOGO, APP_NAME } from '@/lib/constants'
import {
  Gamepad2, Sparkles, GraduationCap, ArrowLeft, ArrowRight, FileQuestion,
  Trophy, Brain, Star, Target, Compass, MousePointerClick, Award, type LucideIcon,
} from 'lucide-react'

// ===== עזרי אנימציה =====

/** מגלה את הילדים בהחלקה עדינה כשהם נכנסים לתצוגה (scroll reveal). */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShown(true) }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
      io.observe(el)
    }
    // רשת ביטחון — לעולם לא להשאיר תוכן נסתר גם אם ה-observer לא נורה
    const fb = window.setTimeout(() => setShown(true), 1200)
    return () => { io?.disconnect(); window.clearTimeout(fb) }
  }, [])
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className ?? ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/** מונה שמטפס מ-0 ליעד כשנכנס לתצוגה. */
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const dur = 1000
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur)
        setN(Math.round(to * (0.5 - Math.cos(p * Math.PI) / 2)))   // ease-in-out
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return <span ref={ref}>{n.toLocaleString('he-IL')}{suffix}</span>
}

const ROTATE_HE = ['חשבון', 'אנגלית', 'בטיחות בבנייה', 'מדעים', 'הנדסה', 'לימודי מבנים']
const ROTATE_EN = ['Math', 'English', 'Safety', 'Science', 'Engineering', 'Structures']

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
          <img src={APP_LOGO} alt={`${APP_NAME} Logo`} className="w-10 h-10 rounded-2xl shadow-md object-cover group-hover:scale-110 transition-transform" width={40} height={40} />
          <span className="text-xl font-bold gradient-text font-display hidden sm:inline">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          {user ? (
            <>
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
              <UserMenu />
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function HomePage() {
  const { t, dir, locale } = useLocale()
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight

  // מילה מתחלפת בכותרת
  const words = dir === 'rtl' ? ROTATE_HE : ROTATE_EN
  const [wi, setWi] = useState(0)
  useEffect(() => { const id = window.setInterval(() => setWi((i) => i + 1), 2200); return () => window.clearInterval(id) }, [])
  const word = words[wi % words.length]

  // התקדמות אישית (עובד גם בלי הרשמה)
  const [stats, setStats] = useState({ points: 0, answered: 0, subjects: 0 })
  // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration read from localStorage
  useEffect(() => { setStats(getGlobalStats()) }, [])
  const hasProgress = stats.answered > 0 || stats.subjects > 0

  const features: { icon: LucideIcon; title: string; desc: string; color: string }[] = [
    { icon: Gamepad2, title: t('home.f1Title'), desc: t('home.f1Desc'), color: 'text-primary bg-primary/10' },
    { icon: Brain, title: t('home.f2Title'), desc: t('home.f2Desc'), color: 'text-accent bg-accent/10' },
    { icon: Sparkles, title: t('home.f3Title'), desc: t('home.f3Desc'), color: 'text-fun bg-fun/10' },
    { icon: Award, title: 'מבחנים אמיתיים', desc: 'מבחני מה"ט אמיתיים, מתוזמנים ומדורגים — עם טבלת מנצחים.', color: 'text-success bg-success/10' },
  ]

  const steps: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: Compass, title: 'בוחרים', desc: 'רמה, כיתה/שנה ומקצוע — והכל מתאים את עצמו אליכם.' },
    { icon: Gamepad2, title: 'מתרגלים', desc: 'משחקים, שאלות וחומרי עזר — לומדים בלי לשים לב.' },
    { icon: Trophy, title: 'מצליחים', desc: 'ניגשים למבחן, צוברים נקודות ומטפסים בטבלה.' },
  ]

  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      <LearningBackground />
      <div className="relative z-10">
        <Navbar />

        {/* ===== Hero ===== */}
        <section className="relative pt-32 pb-16 px-6">
          {/* כדורי גרדיאנט עדינים */}
          <div className="absolute top-28 right-[14%] w-28 h-28 rounded-[2rem] bg-primary/15 animate-float-slow blur-md" />
          <div className="absolute top-52 left-[12%] w-16 h-16 rounded-2xl bg-accent/20 animate-float blur-md" />
          <div className="absolute bottom-6 right-[24%] w-20 h-20 rounded-full bg-fun/15 animate-float-delay-2 blur-md" />

          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-pop">
              <GraduationCap className="w-4 h-4" />
              פלטפורמת למידה, משחקים ומבחנים
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-5 font-display leading-tight animate-slide-up">
              <span className="gradient-text animate-gradient" style={{ backgroundImage: 'linear-gradient(135deg, oklch(0.58 0.25 295), oklch(0.66 0.24 350), oklch(0.72 0.16 200), oklch(0.58 0.25 295))' }}>
                {t('home.heroTitle')}
              </span>
            </h1>

            {/* מילה מתחלפת */}
            <div className="text-xl md:text-2xl font-display mb-6 animate-slide-up flex items-center justify-center gap-2 flex-wrap">
              <span className="text-muted-foreground">{dir === 'rtl' ? 'לומדים' : 'Learning'}</span>
              <span key={wi} className="inline-block font-bold animate-pop px-3 py-0.5 rounded-xl" style={{ background: 'var(--secondary)', color: 'var(--primary)' }}>{word}</span>
            </div>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-9 animate-slide-up">{t('home.heroSubtitle')}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
              <Button size="lg" className="text-lg h-14 px-8 btn-shimmer rounded-2xl shadow-lg" asChild>
                <Link href="/learn">{hasProgress ? 'המשך ללמוד' : t('home.cta')}<Arrow className="w-5 h-5 mr-2" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8 rounded-2xl bg-card/60 backdrop-blur-sm" asChild>
                <a href="#how">{t('home.ctaSecondary')}</a>
              </Button>
            </div>
          </div>
        </section>

        {/* ===== כרטיסי רמות (כניסה מהירה) ===== */}
        <section className="px-6 pb-8">
          <div className="container mx-auto max-w-4xl grid gap-4 sm:grid-cols-3">
            {LEVELS.map((l, i) => {
              const th = LEVEL_THEME[l.id]
              const Icon = th.icon
              return (
                <Reveal key={l.id} delay={i * 90}>
                  <Link
                    href="/learn"
                    className="group relative flex items-center gap-4 rounded-3xl p-5 border border-border bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <span className="absolute inset-y-0 right-0 w-1.5" style={{ background: th.grad }} />
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ background: th.grad, boxShadow: `0 8px 22px -8px ${th.accent}` }}>
                      <Icon className="w-7 h-7" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="font-bold font-display">{pickLang(locale, l.nameHe, l.nameEn)}</div>
                      <div className="text-xs text-muted-foreground leading-snug">{th.tagline}</div>
                    </div>
                    <Arrow className="w-4 h-4 mr-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: th.accent }} />
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* ===== מונים / התקדמות אישית ===== */}
        <section className="px-6 py-10">
          <div className="container mx-auto max-w-4xl">
            {hasProgress ? (
              <Reveal>
                <div className="gradient-card rounded-3xl border border-border p-6 flex flex-wrap items-center justify-around gap-6 text-center">
                  <div className="flex items-center gap-2 font-bold font-display text-lg"><Target className="w-5 h-5 text-primary" />ההתקדמות שלך</div>
                  <Stat value={stats.points} label="נקודות" icon={Star} />
                  <Stat value={stats.answered} label="שאלות שתרגלת" icon={FileQuestion} />
                  <Stat value={stats.subjects} label="מקצועות" icon={GraduationCap} />
                </div>
              </Reveal>
            ) : (
              <Reveal>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { n: 3, s: '', label: 'רמות לימוד', icon: GraduationCap },
                    { n: 200, s: '+', label: 'שאלות מבחן', icon: Award },
                    { n: 6, s: '', label: 'מבחני מה"ט', icon: FileQuestion },
                    { n: 3, s: '', label: 'סוגי משחקים', icon: Gamepad2 },
                  ].map((c) => (
                    <div key={c.label} className="rounded-3xl border border-border bg-card/70 backdrop-blur-sm p-5 text-center">
                      <c.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <div className="text-3xl font-bold gradient-text font-display"><CountUp to={c.n} suffix={c.s} /></div>
                      <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* ===== Features ===== */}
        <section id="features" className="py-12 px-6">
          <div className="container mx-auto max-w-5xl">
            <Reveal><h2 className="text-3xl md:text-4xl font-bold text-center font-display mb-10">למה <span className="gradient-text">{APP_NAME}</span>?</h2></Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f, i) => (
                <Reveal key={i} delay={i * 90}>
                  <div className="h-full gradient-card rounded-3xl p-6 border border-border hover-lift">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${f.color}`}>
                      <f.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold mb-1.5 font-display">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== How it works ===== */}
        <section id="how" className="py-12 px-6">
          <div className="container mx-auto max-w-4xl">
            <Reveal><h2 className="text-3xl md:text-4xl font-bold text-center font-display mb-12">איך זה עובד?</h2></Reveal>
            <div className="grid sm:grid-cols-3 gap-6 relative">
              {steps.map((s, i) => (
                <Reveal key={i} delay={i * 120} className="relative">
                  <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-sm p-6 text-center h-full">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><s.icon className="w-8 h-8" /></div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center font-display">{i + 1}</span>
                    </div>
                    <h3 className="font-bold font-display text-lg mb-1.5">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-3xl">
            <Reveal>
              <div className="gradient-hero rounded-[2rem] p-12 text-center text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 animate-float" />
                <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full bg-white/10 animate-float-slow" />
                <MousePointerClick className="w-10 h-10 mx-auto mb-4 relative z-10 opacity-90" />
                <h2 className="text-3xl md:text-4xl font-bold mb-3 font-display relative z-10">{t('home.heroTitle')}</h2>
                <p className="text-white/85 mb-8 relative z-10 max-w-md mx-auto">{t('home.heroSubtitle')}</p>
                <Button size="lg" variant="secondary" className="text-lg h-14 px-8 rounded-2xl relative z-10 shadow-lg" asChild>
                  <Link href="/learn">{t('home.cta')}<Arrow className="w-5 h-5 mr-2" /></Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        <footer className="py-10 px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}
        </footer>
      </div>
    </div>
  )
}

function Stat({ value, label, icon: Icon }: { value: number; label: string; icon: LucideIcon }) {
  return (
    <div>
      <div className="text-3xl font-bold gradient-text font-display flex items-center justify-center gap-1.5">
        <Icon className="w-5 h-5 text-fun" /><CountUp to={value} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}
