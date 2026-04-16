import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { SessionSync } from '@/components/SessionSync'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'ApexLeads - ניהול לידים ופרסום חכם',
  description:
    'פלטפורמת SaaS מתקדמת לאיסוף לידים ופרסום אוטומטי בקבוצות פייסבוק. הגדל את המכירות שלך עם AI.',
  generator: 'ApexLeads',
  keywords: ['לידים', 'פרסום', 'פייסבוק', 'נדלן', 'רכב', 'AI', 'אוטומציה', 'ApexLeads'],
  authors: [{ name: 'ApexLeads Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo-apexleads.jpg', sizes: '32x32', type: 'image/jpeg' },
      { url: '/logo-apexleads.jpg', sizes: '16x16', type: 'image/jpeg' },
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [{ url: '/logo-apexleads.jpg', sizes: '180x180', type: 'image/jpeg' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4F6AF5' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-background">
        <AuthProvider>
          <SessionSync />
          {children}
          <Toaster richColors position="top-center" dir="rtl" closeButton />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
