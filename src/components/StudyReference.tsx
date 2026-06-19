'use client'

import { BookOpen } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import type { Material } from '@/types'

/** חלון "חומר עזר לנושא" שמופיע ליד שאלות התרגול — מקופל, נפתח לפי נושא. */
export function StudyReference({ materials }: { materials: Material[] }) {
  const { t } = useLocale()
  if (materials.length === 0) return null

  return (
    <div className="gradient-card rounded-3xl border border-border p-4 mb-5">
      <div className="flex items-center gap-2 mb-1 px-1">
        <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
          <BookOpen className="w-4 h-4" />
        </div>
        <h3 className="font-bold font-display">{t('subject.studyRef')}</h3>
      </div>
      <Accordion type="single" collapsible defaultValue={materials[0]?.id} className="w-full">
        {materials.map((m) => (
          <AccordionItem key={m.id} value={m.id} className="border-border">
            <AccordionTrigger className="text-right hover:no-underline font-medium">{m.title}</AccordionTrigger>
            <AccordionContent>
              <div className="whitespace-pre-wrap leading-relaxed text-foreground/90 pt-1" dir="auto">
                {m.bodyMarkdown}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
