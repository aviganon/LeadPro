import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Fredoka } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { LocaleProvider } from '@/context/LocaleContext'
import { SessionSync } from '@/components/SessionSync'
import { PresenceTracker } from '@/components/PresenceTracker'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

// פונט "כיפי" עגול לכותרות — נותן את התחושה העתידנית/משחקית
const fredoka = Fredoka({
  subsets: ['latin', 'hebrew'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: `${APP_NAME} — לומדים תוך כדי משחק`,
  description: APP_DESCRIPTION,
  generator: APP_NAME,
  keywords: ['לימוד', 'משחקים', 'תלמידים', 'סטודנטים', 'חשבון', 'אנגלית', 'תרגול', 'AI', APP_NAME],
  authors: [{ name: `${APP_NAME} Team` }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo-apexleads.jpg', sizes: '32x32', type: 'image/jpeg' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/logo-apexleads.jpg', sizes: '180x180', type: 'image/jpeg' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7C3AED' },
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
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable}`}
    >
      <body className="font-sans antialiased bg-background">
        <LocaleProvider>
          <AuthProvider>
            <SessionSync />
            <PresenceTracker />
            {children}
            <Toaster richColors position="top-center" closeButton />
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
