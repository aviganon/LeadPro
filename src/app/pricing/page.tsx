'use client'

import { useState } from 'react'
import { Check, Zap } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'חינמי',
    price: 0,
    period: '',
    description: 'להתחיל ולנסות',
    color: '#888780',
    features: [
      '3 פרסומים ביום',
      '20 לידים בחודש',
      'עד 5 קבוצות',
      'תבניות בסיסיות',
    ],
    cta: 'התחל חינם',
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    period: '/ חודש',
    description: 'לסוכנים עצמאיים',
    color: '#378ADD',
    features: [
      '10 פרסומים ביום',
      '100 לידים בחודש',
      'עד 15 קבוצות',
      'כל התבניות',
      'תזמון פרסומים',
    ],
    cta: 'התחל ב-14 יום חינם',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    period: '/ חודש',
    description: 'לסוכנים מקצועיים',
    color: '#1D9E75',
    features: [
      '30 פרסומים ביום',
      '500 לידים בחודש',
      'עד 50 קבוצות',
      'AI יצירת תוכן',
      'אנליטיקס מתקדם',
      'תמיכה עדיפותית',
    ],
    cta: 'התחל ב-14 יום חינם',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    period: '/ חודש',
    description: 'לצוותים וסוכנויות',
    color: '#7F77DD',
    features: [
      'ללא הגבלת פרסומים',
      'לידים ללא הגבלה',
      'קבוצות ללא הגבלה',
      'מספר משתמשים',
      'White-label',
      'API גישה',
      'מנהל חשבון אישי',
    ],
    cta: 'צור קשר',
    popular: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handlePlanClick(planId: string) {
    if (planId === 'free') {
      window.location.href = '/auth'
      return
    }
    if (planId === 'enterprise') {
      window.location.href = 'mailto:hello@leadpro.co.il'
      return
    }

    setLoading(planId)
    try {
      const userId = 'current-user-id'  // replace with real auth
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: planId }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background-tertiary)',
      direction: 'rtl',
      fontFamily: 'var(--font-sans)',
      padding: '60px 20px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-info)', marginBottom: 10, letterSpacing: '0.06em' }}>
          תמחור
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 600, margin: '0 0 12px', color: 'var(--color-text-primary)' }}>
          בחר תוכנית
        </h1>
        <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', margin: 0 }}>
          14 יום ניסיון חינם בכל תוכנית — ללא כרטיס אשראי
        </p>
      </div>

      {/* Plan cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        {PLANS.map(plan => (
          <div
            key={plan.id}
            style={{
              background: 'var(--color-background-primary)',
              border: plan.popular
                ? `2px solid ${plan.color}`
                : '0.5px solid var(--color-border-tertiary)',
              borderRadius: 16,
              padding: 28,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: -13,
                right: '50%',
                transform: 'translateX(50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: plan.color,
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 14px',
                borderRadius: 20,
              }}>
                <Zap size={12} />
                הכי פופולרי
              </div>
            )}

            {/* Plan name & price */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: plan.color, marginBottom: 6 }}>
                {plan.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {plan.price === 0 ? 'חינם' : `₪${plan.price}`}
                </span>
                {plan.period && (
                  <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    {plan.period}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {plan.description}
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', marginBottom: 20 }} />

            {/* Features */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <Check size={15} style={{ color: plan.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--color-text-primary)' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => handlePlanClick(plan.id)}
              disabled={loading === plan.id}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: plan.popular ? 'none' : `0.5px solid var(--color-border-secondary)`,
                background: plan.popular ? plan.color : 'transparent',
                color: plan.popular ? '#fff' : 'var(--color-text-primary)',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading === plan.id ? 'default' : 'pointer',
                opacity: loading === plan.id ? 0.6 : 1,
              }}
            >
              {loading === plan.id ? 'מעביר...' : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ section */}
      <div style={{ maxWidth: 600, margin: '60px auto 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 28 }}>שאלות נפוצות</h2>
        {[
          { q: 'האם צריך כרטיס אשראי לניסיון?', a: 'לא. 14 יום ניסיון חינם לגמרי ללא כרטיס.' },
          { q: 'האם אפשר לבטל בכל עת?', a: 'כן. ביטול מיידי ללא עמלות.' },
          { q: 'הפרסום יעשה מהחשבון שלי?', a: 'כן. כל פרסום נעשה מחשבון הפייסבוק שלך, בקבוצות שאתה בוחר.' },
          { q: 'האם זה עובד עם כל הנדל"ן בישראל?', a: 'כן — Yad2, Madlan, ופייסבוק קבוצות.' },
        ].map(faq => (
          <div key={faq.q} style={{
            textAlign: 'right',
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 10,
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{faq.q}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{faq.a}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
