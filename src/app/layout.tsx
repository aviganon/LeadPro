import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SessionSync } from '@/components/SessionSync'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LeadPro — מערכת ניהול לידים ופרסום',
  description: 'פלטפורמת SaaS לאיסוף לידים ופרסום אוטומטי בקבוצות פייסבוק',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        <AuthProvider><SessionSync />{children}</AuthProvider>
      </body>
    </html>
  )
}
