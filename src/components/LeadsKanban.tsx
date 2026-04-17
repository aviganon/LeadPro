'use client'

import { useMemo, useState, memo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Lead, LeadStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

const COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'חדש', color: 'bg-primary/10 text-primary border-primary/30' },
  { id: 'contacted', label: 'נוצר קשר', color: 'bg-warning/10 text-warning border-warning/30' },
  { id: 'qualified', label: 'מסונן', color: 'bg-accent/10 text-accent border-accent/30' },
  { id: 'converted', label: 'המרה', color: 'bg-success/10 text-success border-success/30' },
  { id: 'lost', label: 'לא רלוונטי', color: 'bg-muted text-muted-foreground border-muted-foreground/20' },
]

function scoreTone(score: number): string {
  if (score >= 90) return 'bg-success/10 text-success'
  if (score >= 80) return 'bg-primary/10 text-primary'
  if (score >= 60) return 'bg-warning/10 text-warning'
  return 'bg-muted text-muted-foreground'
}

const LeadCard = memo(function LeadCard({ lead, dragging = false }: { lead: Lead; dragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: lead.id, data: { leadId: lead.id, status: lead.status } })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'select-none touch-none',
        (isDragging || dragging) && 'opacity-50'
      )}
    >
      <Card className="border-0 shadow-sm hover-lift cursor-grab active:cursor-grabbing">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
                scoreTone(lead.qualityScore)
              )}
            >
              {lead.qualityScore}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug line-clamp-2 break-words">{lead.notes}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-muted truncate max-w-[120px]">{lead.source}</span>
                <span className="truncate">{lead.vertical}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

function Column({
  column,
  leads,
}: {
  column: typeof COLUMNS[number]
  leads: Lead[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { status: column.id } })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[260px] w-[260px] max-w-[320px] rounded-xl border-2 border-dashed transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
      )}
    >
      <div className={cn('px-3 py-2 border-b flex items-center justify-between gap-2 rounded-t-xl', column.color)}>
        <span className="font-semibold text-sm">{column.label}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">{leads.length}</span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-300px)]">
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 opacity-70">גרור לכאן לידים</p>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  )
}

export function LeadsKanban({
  leads,
  onStatusChange,
}: {
  leads: Lead[]
  onStatusChange: (leadId: string, status: LeadStatus) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  const byStatus = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      converted: [],
      lost: [],
    }
    for (const lead of leads) {
      const key = (map[lead.status] ? lead.status : 'new') as LeadStatus
      map[key].push(lead)
    }
    return map
  }, [leads])

  const activeLead = useMemo(
    () => (activeId ? leads.find((l) => l.id === activeId) ?? null : null),
    [activeId, leads]
  )

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const leadId = String(e.active.id)
    const nextStatus = e.over?.data.current?.status as LeadStatus | undefined
    if (!nextStatus) return
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === nextStatus) return
    onStatusChange(leadId, nextStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2" dir="rtl">
        {COLUMNS.map((col) => (
          <Column key={col.id} column={col} leads={byStatus[col.id]} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
