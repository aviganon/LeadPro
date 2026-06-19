'use client'

import { useEffect, useMemo, useState } from 'react'
import { Radio, ShieldCheck, UserCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { subscriberPresence, ONLINE_WINDOW_MS, type PresenceRow } from '@/lib/presence'

function pageLabel(p: string): string {
  if (!p || p === '/') return 'מסך הבית'
  if (p === '/learn') return 'בחירת מקצוע'
  if (p.startsWith('/learn/')) return 'בתוך קורס'
  if (p.startsWith('/admin')) return 'ניהול'
  if (p.startsWith('/settings')) return 'הגדרות'
  if (p.startsWith('/auth')) return 'התחברות'
  return p
}

export function OnlinePanel() {
  const [rows, setRows] = useState<PresenceRow[]>([])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const unsub = subscriberPresence(setRows)
    const tick = window.setInterval(() => setNow(Date.now()), 5000)
    return () => { unsub(); window.clearInterval(tick) }
  }, [])

  const online = useMemo(
    () => rows
      .filter((r) => r.lastSeenMs > 0 && now - r.lastSeenMs < ONLINE_WINDOW_MS)
      .sort((a, b) => b.lastSeenMs - a.lastSeenMs),
    [rows, now],
  )
  const registered = online.filter((r) => r.verified)
  const anon = online.filter((r) => !r.verified)

  return (
    <Card className="border-success/30">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
            </span>
            <h3 className="font-bold font-display">מחוברים עכשיו</h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-2xl font-bold gradient-text">{online.length}</span>
            <span className="text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" />{registered.length} רשומים</span>
            <span className="text-muted-foreground flex items-center gap-1"><UserCircle2 className="w-4 h-4" />{anon.length} אנונימיים</span>
          </div>
        </div>

        {online.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">אין מחוברים כרגע</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {online.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-2 rounded-2xl bg-background">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                <span className="flex-1 font-medium truncate flex items-center gap-1.5">
                  {r.verified ? (r.name || 'משתמש רשום') : 'אנונימי'}
                  {r.verified && <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Radio className="w-3 h-3" />{pageLabel(r.page)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
