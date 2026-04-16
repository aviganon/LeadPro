'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { APP_LOGO, APP_NAME } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { AdminConsole } from '@/components/admin/AdminConsole'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth?redirect=/admin')
      return
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [authLoading, user, router])

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        טוען...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <div className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={APP_LOGO}
                alt={`${APP_NAME} Logo`}
                className="w-9 h-9 rounded-lg shadow-md object-cover"
                width={36}
                height={36}
              />
              <span className="font-bold text-lg">{APP_NAME}</span>
              <span className="rounded bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">Admin</span>
            </Link>
            <Button variant="ghost" size="sm" className="text-sidebar-foreground/70" asChild>
              <Link href="/dashboard">דשבורד</Link>
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        <AdminConsole />
      </main>
    </div>
  )
}
