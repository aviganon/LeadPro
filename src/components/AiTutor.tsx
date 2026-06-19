'use client'

import { useState } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import { Button } from '@/components/ui/button'

export function AiTutor({ subject, grade }: { subject: string; grade?: number }) {
  const { t, locale } = useLocale()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ask = async () => {
    if (!question.trim()) return
    setLoading(true)
    setError('')
    setAnswer('')
    try {
      const res = await fetch('/api/ai/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, subject, grade, lang: locale }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'AI is not configured' ? 'המורה הפרטי עדיין לא הוגדר (חסר מפתח API).' : 'שגיאה — נסו שוב')
        return
      }
      setAnswer(data.text ?? '')
    } catch {
      setError('שגיאה — נסו שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-card rounded-3xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-fun/10 text-fun flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="font-bold font-display text-lg">{t('subject.askAi')}</h3>
      </div>

      <div className="flex gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask() }}
          placeholder={t('subject.aiPlaceholder')}
          rows={2}
          dir="auto"
          className="flex-1 p-3 rounded-2xl border-2 border-border bg-background resize-none focus:border-primary outline-none"
        />
        <Button onClick={ask} disabled={loading || !question.trim()} className="rounded-2xl self-stretch px-4">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground mt-4">{t('subject.aiThinking')}</p>}
      {error && <p className="text-sm text-destructive mt-4">{error}</p>}
      {answer && (
        <div className="mt-5 p-4 rounded-2xl bg-background border border-border whitespace-pre-wrap leading-relaxed animate-slide-up" dir="auto">
          {answer}
        </div>
      )}
    </div>
  )
}
