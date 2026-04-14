'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { 
  Target, Check, Zap, ArrowLeft, Star, Users, 
  Sparkles, TrendingUp, HelpCircle, ChevronDown,
  Building2, Globe, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Plan {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  popular: boolean
  color: string
  icon: React.ElementType
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    description: 'להתחיל ולנסות',
    features: [
      '3 פרסומים ביום',
      '20 לידים בחודש',
      'עד 5 קבוצות',
      'תבניות בסיסיות',
      'תמיכה באימייל',
    ],
    popular: false,
    color: 'from-muted-foreground to-muted-foreground/70',
    icon: Users,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    period: '/ חודש',
    description: 'לסוכנים עצמאיים',
    features: [
      '10 פרסומים ביום',
      '100 לידים בחודש',
      'עד 15 קבוצות',
      'כל התבניות',
      'תזמון פרסומים',
      'סקרייפינג Yad2',
      'תמיכה עדיפה',
    ],
    popular: false,
    color: 'from-primary to-primary/70',
    icon: Building2,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    period: '/ חודש',
    description: 'לסוכנים מקצועיים',
    features: [
      '30 פרסומים ביום',
      '500 לידים בחודש',
      'עד 50 קבוצות',
      'AI יצירת תוכן',
      'אנליטיקס מתקדם',
      'כל מקורות הסקרייפינג',
      'תמיכה עדיפותית 24/7',
      'Webhooks',
    ],
    popular: true,
    color: 'from-success to-accent',
    icon: Sparkles,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    period: '/ חודש',
    description: 'לצוותים וסוכנויות',
    features: [
      'ללא הגבלת פרסומים',
      'לידים ללא הגבלה',
      'קבוצות ללא הגבלה',
      'מספר משתמשים',
      'White-label',
      'API גישה מלאה',
      'מנהל חשבון אישי',
      'SLA מובטח',
      'אינטגרציות מותאמות',
    ],
    popular: false,
    color: 'from-accent to-primary',
    icon: Globe,
  },
]

const FAQS = [
  {
    q: 'האם צריך כרטיס אשראי לניסיון?',
    a: 'לא. 14 יום ניסיון חינם לגמרי ללא כרטיס אשראי. תוכל לשדרג בכל שלב.',
  },
  {
    q: 'האם אפשר לבטל בכל עת?',
    a: 'כן. ביטול מיידי ללא עמלות ובלי שאלות. התשלום הוא חודשי ללא התחייבות.',
  },
  {
    q: 'הפרסום יעשה מהחשבון שלי?',
    a: 'כן. כל פרסום נעשה מחשבון הפייסבוק שלך, בקבוצות שאתה בוחר. אנחנו לא שולחים שום דבר בלי אישורך.',
  },
  {
    q: 'האם זה עובד עם כל הפלטפורמות בישראל?',
    a: 'כן! אנחנו תומכים ב-Yad2, Madlan, קבוצות פייסבוק, Telegram, Google Alerts ועוד.',
  },
  {
    q: 'מה קורה אם אני צריך יותר לידים?',
    a: 'תוכל לשדרג את התוכנית בכל רגע, והשינוי יחול מיד. אנחנו נחשב את ההפרש באופן יחסי.',
  },
  {
    q: 'האם יש תמיכה בעברית?',
    a: 'כן! כל הממשק בעברית, התמיכה בעברית, ו-AI יוצר תוכן בעברית מושלמת.',
  },
]

function Navbar() {
  return (
    <nav className="bg-background/80 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">LeadPro</span>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/auth">התחברות</Link>
          </Button>
          <Button asChild>
            <Link href="/auth?mode=signup">
              התחל חינם
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

function PricingCard({ plan, isAnnual }: { plan: Plan; isAnnual: boolean }) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const price = isAnnual ? Math.round(plan.price * 0.8) : plan.price
  const annualSavings = isAnnual && plan.price > 0 ? Math.round(plan.price * 12 * 0.2) : 0

  const handleClick = async () => {
    if (plan.id === 'free') {
      window.location.href = '/auth?mode=signup'
      return
    }
    if (plan.id === 'enterprise') {
      window.location.href = 'mailto:hello@leadpro.co.il'
      return
    }

    if (!user?.id) {
      window.location.href = '/auth?redirect=/pricing'
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan: plan.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`relative border-2 transition-all hover-lift ${
      plan.popular ? 'border-primary shadow-xl scale-105' : 'border-transparent shadow-lg'
    }`}>
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg">
            <Zap className="w-4 h-4" />
            הכי פופולרי
          </div>
        </div>
      )}

      {/* Color bar */}
      <div className={`h-2 rounded-t-lg bg-gradient-to-l ${plan.color}`} />

      <CardHeader className="text-center pb-2">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-3`}>
          <plan.icon className="w-7 h-7 text-white" />
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">
              {price === 0 ? 'חינם' : `${price}`}
            </span>
            {price > 0 && <span className="text-lg text-muted-foreground">ש״ח</span>}
            {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
          </div>
          {annualSavings > 0 && (
            <p className="text-sm text-success mt-1">
              חיסכון של {annualSavings} ש״ח בשנה
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0`}>
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button 
          className={`w-full py-6 ${plan.popular ? 'btn-shimmer' : ''}`}
          variant={plan.popular ? 'default' : 'outline'}
          size="lg"
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              {plan.id === 'free' && 'התחל חינם'}
              {plan.id === 'basic' && 'התחל ב-14 יום חינם'}
              {plan.id === 'pro' && 'התחל ב-14 יום חינם'}
              {plan.id === 'enterprise' && 'צור קשר'}
            </>
          )}
        </Button>

        {plan.price > 0 && plan.id !== 'enterprise' && (
          <p className="text-center text-xs text-muted-foreground">
            14 יום ניסיון חינם, ללא כרטיס אשראי
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <HelpCircle className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">שאלות נפוצות</span>
          </div>
          <h2 className="text-3xl font-bold">יש לך שאלות?</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => (
            <Card 
              key={index} 
              className={`border-0 shadow-sm overflow-hidden transition-all cursor-pointer ${
                openIndex === index ? 'shadow-md' : ''
              }`}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-5">
                  <h3 className="font-semibold">{faq.q}</h3>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} />
                </div>
                {openIndex === index && (
                  <div className="px-5 pb-5 text-muted-foreground animate-slide-up">
                    {faq.a}
                  </div>
                )}
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
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-95" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/10 animate-float" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 animate-float-slow" />
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          מוכנים להתחיל?
        </h2>
        <p className="text-xl text-white/80 max-w-xl mx-auto mb-8">
          בחרו תוכנית לפי נפח פרסומים, לידים וקבוצות — החיוב ב-Stripe כשהמפתחות מוגדרים
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg hover-lift" asChild>
            <Link href="/auth?mode=signup">
              התחל 14 יום חינם
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-white/30 text-white hover:bg-white/10" asChild>
            <Link href="mailto:hello@leadpro.co.il">דבר איתנו</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-8 bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">LeadPro</span>
          </Link>
          
          <div className="flex items-center gap-6 text-sm text-sidebar-foreground/70">
            <Link href="#" className="hover:text-sidebar-foreground">תנאי שימוש</Link>
            <Link href="#" className="hover:text-sidebar-foreground">פרטיות</Link>
            <Link href="#" className="hover:text-sidebar-foreground">צור קשר</Link>
          </div>
          
          <p className="text-sm text-sidebar-foreground/70">
            &copy; 2026 LeadPro. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="py-16 md:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero-soft" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/10 animate-float" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-accent/10 animate-float-slow" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">תמחור פשוט ושקוף</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            בחר את התוכנית <span className="gradient-text">המתאימה לך</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-10">
            14 יום ניסיון חינם בכל תוכנית - ללא כרטיס אשראי, ללא התחייבות
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 rounded-xl bg-muted">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isAnnual ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              חודשי
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isAnnual ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2">
                שנתי
                <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
                  חיסכון 20%
                </span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-8 pb-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto stagger-children">
            {PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} isAnnual={isAnnual} />
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-16 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm">SSL מאובטח</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success" />
              <span className="text-sm">ביטול בכל עת</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-sm">מותאם לסוכנים ולעסקים בישראל</span>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
