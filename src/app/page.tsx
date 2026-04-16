'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Target, Zap, Users, MessageSquare, BarChart3,
  ArrowLeft, CheckCircle, Play, Star, Sparkles, Globe,
  Building2, Car, Briefcase, ChevronDown, Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { APP_LOGO, APP_NAME } from '@/lib/constants'

function FloatingElement({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div 
      className={`absolute rounded-full opacity-30 animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass shadow-lg py-3' : 'bg-transparent py-5'
    }`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src={APP_LOGO}
            alt={`${APP_NAME} Logo`}
            className="w-10 h-10 rounded-xl shadow-md object-cover group-hover:scale-110 transition-transform"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-primary to-accent">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            יתרונות
          </Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            תמחור
          </Link>
          <Link href="#why" className="text-muted-foreground hover:text-foreground transition-colors">
            למה {APP_NAME}
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/auth">התחברות</Link>
          </Button>
          <Button asChild className="btn-shimmer">
            <Link href="/auth?mode=signup">
              התחל חינם
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full right-0 left-0 glass border-t border-border animate-slide-up">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
            <Link href="#features" className="py-2 text-muted-foreground hover:text-foreground">
              יתרונות
            </Link>
            <Link href="#pricing" className="py-2 text-muted-foreground hover:text-foreground">
              תמחור
            </Link>
            <Link href="#why" className="py-2 text-muted-foreground hover:text-foreground">
              למה {APP_NAME}
            </Link>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/auth">התחברות</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/auth?mode=signup">התחל חינם</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 gradient-hero-soft" />
      <FloatingElement className="w-72 h-72 bg-primary/20 -top-20 -right-20" delay={0} />
      <FloatingElement className="w-96 h-96 bg-accent/20 -bottom-40 -left-40" delay={1} />
      <FloatingElement className="w-48 h-48 bg-success/20 top-1/3 left-1/4" delay={2} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center stagger-children">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">חדש! יצירת תוכן עם AI</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="block">הגיע לפסגה.</span>
            <span className="gradient-text">עם {APP_NAME}.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            אסוף לידים איכותיים מכל הפלטפורמות, צור תוכן עם AI ופרסם אוטומטית בקבוצות פייסבוק - הכל במקום אחד.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-6 btn-shimmer hover-glow" asChild>
              <Link href="/auth?mode=signup">
                התחל 14 יום חינם
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover-lift group" asChild>
              <Link href="#features">
                <Play className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                גלה יכולות
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            ללא מספרי &quot;שיווק&quot; מומצאים — הלידים, הפרסומים וההגדרות נשמרים ב-Firestore תחת המשתמש שלך.
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-soft">
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Target,
      title: 'איסוף לידים חכם',
      description: 'סקרייפינג אוטומטי מ-Yad2, Google Alerts, Telegram ופלטפורמות נוספות',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: MessageSquare,
      title: 'פרסום לקבוצות',
      description: 'פרסום אוטומטי ומתוזמן לעשרות קבוצות פייסבוק במקביל',
      color: 'bg-accent/10 text-accent',
    },
    {
      icon: Sparkles,
      title: 'יצירת תוכן AI',
      description: 'טקסטים מותאמים אישית עם Claude AI - פוסטים שמושכים תשומת לב',
      color: 'bg-success/10 text-success',
    },
    {
      icon: BarChart3,
      title: 'אנליטיקס מתקדם',
      description: 'עקוב אחרי ביצועים, שיעורי המרה ולידים איכותיים בזמן אמת',
      color: 'bg-warning/10 text-warning',
    },
    {
      icon: Zap,
      title: 'אוטומציה מלאה',
      description: 'תזמן פרסומים, הגדר כללים אוטומטיים וחסוך שעות עבודה',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Users,
      title: 'ניהול לידים',
      description: 'מעקב סטטוסים, ניקוד איכות וניהול pipeline מלא',
      color: 'bg-accent/10 text-accent',
    },
  ]

  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 stagger-children">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">יתרונות הפלטפורמה</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            כל מה שצריך ב<span className="gradient-text">מקום אחד</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            פלטפורמה מלאה לאיסוף לידים, יצירת תוכן ופרסום - בלי צורך בכלים נוספים
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-lg hover-lift bg-card/50 backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function VerticalsSection() {
  const verticals = [
    {
      icon: Building2,
      title: 'נדל"ן',
      description: 'לידים מ-Yad2, Madlan וקבוצות פייסבוק',
      features: ['סריקת נכסים חדשים', 'התראות מיידיות', 'פרסום לקבוצות נדל"ן'],
      color: 'from-primary to-primary/70',
    },
    {
      icon: Car,
      title: 'רכב',
      description: 'מכירת רכבים ולידים מקבוצות רכב',
      features: ['סריקת לוחות רכב', 'מעקב מחירים', 'פרסום ממוקד'],
      color: 'from-accent to-accent/70',
    },
    {
      icon: Briefcase,
      title: 'עסקים',
      description: 'B2B לידים ושיווק לעסקים',
      features: ['איסוף לידים עסקיים', 'אינטגרציות CRM', 'דוחות מותאמים'],
      color: 'from-success to-success/70',
    },
  ]

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <FloatingElement className="w-64 h-64 bg-primary/10 -top-20 -left-20" delay={0.5} />
      <FloatingElement className="w-48 h-48 bg-accent/10 bottom-10 right-10" delay={1.5} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-6">
            <Globe className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">תחומי עיסוק</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            מותאם ל<span className="gradient-text">תחום שלך</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            הגדרות, מקורות ותבניות מותאמות לתחום העיסוק שלך
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {verticals.map((vertical, index) => (
            <Card 
              key={index}
              className="border-0 shadow-xl hover-lift overflow-hidden group"
            >
              <div className={`h-2 bg-gradient-to-l ${vertical.color}`} />
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${vertical.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <vertical.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{vertical.title}</h3>
                <p className="text-muted-foreground mb-6">{vertical.description}</p>
                <ul className="space-y-3">
                  {vertical.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/** ערך מוצר אמיתי בלי ציטוטים בדויים של &quot;לקוחות&quot; */
function WhySection() {
  const items = [
    {
      title: 'לידים ממקורות אמיתיים',
      body: 'חיבור ל-Firestore: לידים נאספים ונשמרים בחשבון שלך — לא רשימות דמה בממשק.',
    },
    {
      title: 'פרסום דרך חשבון הפייסבוק שלך',
      body: 'OAuth ו-Graph API: פרסומים מתבצעים מההרשאות שלך לקבוצות שבחרת.',
    },
    {
      title: 'AI כשיש מפתח',
      body: 'יצירת טקסטים עם Claude — רק כש-API מוגדר בסביבה; אין תוכן מדומה קבוע.',
    },
  ]

  return (
    <section id="why" className="py-24 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            למה <span className="gradient-text">{APP_NAME}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ללא המלצות בדויות — אלה היכולות שמוצגות במוצר בפועל (נתונים ב-Firestore ובחשבונות המשתמש).
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item) => (
            <Card key={item.title} className="border-0 shadow-lg hover-lift">
              <CardContent className="p-6">
                <Star className="w-6 h-6 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <FloatingElement className="w-96 h-96 bg-white/10 -top-40 -right-40" delay={0} />
      <FloatingElement className="w-64 h-64 bg-white/10 -bottom-20 -left-20" delay={1} />
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          מוכנים להגדיל את המכירות?
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
          התחל עכשיו עם 14 יום ניסיון חינם - ללא כרטיס אשראי, ללא התחייבות
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6 hover-lift" asChild>
            <Link href="/auth?mode=signup">
              התחל עכשיו בחינם
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10" asChild>
            <Link href="/pricing">ראה תמחור</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img
                src={APP_LOGO}
                alt={`${APP_NAME} Logo`}
                className="w-8 h-8 rounded-lg shadow-sm object-cover"
                width={32}
                height={32}
              />
              <span className="text-lg font-bold">{APP_NAME}</span>
            </Link>
            <p className="text-sidebar-foreground/70 text-sm">
              פלטפורמת הלידים והפרסום המתקדמת בישראל
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">מוצר</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link href="#features" className="hover:text-sidebar-foreground">יתרונות</Link></li>
              <li><Link href="/pricing" className="hover:text-sidebar-foreground">תמחור</Link></li>
              <li><Link href="#" className="hover:text-sidebar-foreground">אינטגרציות</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">חברה</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link href="#" className="hover:text-sidebar-foreground">אודות</Link></li>
              <li><Link href="#" className="hover:text-sidebar-foreground">בלוג</Link></li>
              <li><Link href="#" className="hover:text-sidebar-foreground">צור קשר</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">משפטי</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link href="#" className="hover:text-sidebar-foreground">תנאי שימוש</Link></li>
              <li><Link href="#" className="hover:text-sidebar-foreground">פרטיות</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-sidebar-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-sidebar-foreground/70">
            © 2026 {APP_NAME}. כל הזכויות שמורות.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.46 6c-.85.38-1.78.64-2.75.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1-4-.2-7.58-2.11-9.96-5.02-.42.72-.66 1.56-.66 2.46 0 1.68.85 3.16 2.14 4.02-.79-.02-1.53-.24-2.18-.6v.06c0 2.35 1.67 4.31 3.88 4.76-.4.1-.83.16-1.27.16-.31 0-.62-.03-.92-.08.63 1.96 2.45 3.39 4.61 3.43-1.69 1.32-3.83 2.1-6.15 2.1-.4 0-.8-.02-1.19-.07 2.19 1.4 4.78 2.22 7.57 2.22 9.07 0 14.02-7.52 14.02-14.02 0-.21 0-.42-.01-.63.96-.69 1.79-1.56 2.45-2.55z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <VerticalsSection />
      <WhySection />
      <CTASection />
      <Footer />
    </div>
  )
}
