'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ה-dashboard הישן (לידים) הוסר. המסך הראשי של הלמידה הוא /learn.
export default function DashboardRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/learn')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
      טוען…
    </div>
  )
}
