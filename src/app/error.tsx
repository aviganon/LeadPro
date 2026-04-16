'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl">
      <h2 className="text-lg font-semibold">משהו השתבש</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        אירעה שגיאה בטעינת העמוד. ניתן לנסות שוב או לרענן את הדפדפן.
      </p>
      <Button type="button" onClick={() => reset()}>
        נסה שוב
      </Button>
    </div>
  )
}
