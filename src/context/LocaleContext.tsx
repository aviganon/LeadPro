'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { he } from '@/lib/i18n/he'
import { en } from '@/lib/i18n/en'
import type { Lang } from '@/types'

type TKey = keyof typeof he

const DICTS = { he, en }

interface LocaleContextValue {
  locale: Lang
  dir: 'rtl' | 'ltr'
  t: (key: TKey) => string
  setLocale: (l: Lang) => void
  toggle: () => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Lang>('he')

  // Hydrate from storage on mount. Done in an effect (not a lazy initializer) on
  // purpose: the server always renders `he`, so reading localStorage during render
  // would cause a hydration mismatch. This one-time post-hydration sync is the
  // intended pattern for an external store.
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem('locale')) as Lang | null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration external-store sync
    if (saved === 'he' || saved === 'en') setLocaleState(saved)
  }, [])

  // Keep <html> lang/dir in sync
  useEffect(() => {
    const dir = locale === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale])

  const setLocale = useCallback((l: Lang) => {
    setLocaleState(l)
    try {
      window.localStorage.setItem('locale', l)
      document.cookie = `locale=${l}; path=/; max-age=31536000`
    } catch { /* ignore */ }
  }, [])

  const toggle = useCallback(() => setLocale(locale === 'he' ? 'en' : 'he'), [locale, setLocale])

  const t = useCallback((key: TKey) => DICTS[locale][key] ?? key, [locale])

  const dir = locale === 'he' ? 'rtl' : 'ltr'

  return (
    <LocaleContext.Provider value={{ locale, dir, t, setLocale, toggle }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

/** בוחר את הטקסט הנכון לפי שפה עבור שדות dual-language */
export function pickLang<T>(locale: Lang, he: T, en: T): T {
  return locale === 'he' ? he : en
}
