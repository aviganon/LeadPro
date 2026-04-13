import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background-tertiary)',
      direction: 'rtl',
      fontFamily: 'var(--font-sans)',
    }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 60,
        background: 'var(--color-background-primary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
      }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>🎯 LeadPro</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontSize: 14, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>תמחור</Link>
          <Link href="/auth" style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 14,
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            textDecoration: 'none', fontWeight: 500,
          }}>התחבר</Link>
        </div>
      </nav>
      <div style={{ textAlign: 'center', padding: '80px 20px 60px' }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.2, margin: '0 0 20px', color: 'var(--color-text-primary)' }}>
          לידים ופרסום בפייסבוק
        </h1>
        <p style={{ fontSize: 18, color: 'var(--color-text-secondary)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          אסוף לידים חמים מ-Yad2, Google ופורומים, ופרסם אוטומטית בקבוצות הפייסבוק שלך.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/auth" style={{
            padding: '14px 32px', borderRadius: 10, fontSize: 16, fontWeight: 500,
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            textDecoration: 'none',
          }}>התחל חינם 14 יום</Link>
          <Link href="/pricing" style={{
            padding: '14px 32px', borderRadius: 10, fontSize: 16,
            border: '0.5px solid var(--color-border-secondary)',
            color: 'var(--color-text-primary)', textDecoration: 'none',
          }}>ראה תמחור</Link>
        </div>
      </div>
    </div>
  )
}
