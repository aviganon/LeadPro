'use client'

import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/context/LocaleContext'

export function LangToggle() {
  const { toggle, t } = useLocale()
  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="gap-1.5" aria-label="Switch language">
      <Languages className="w-4 h-4" />
      <span className="text-xs font-semibold">{t('common.lang')}</span>
    </Button>
  )
}
