'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Radio, ShieldCheck, UserCircle2, Bell, BellRing } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const [canNotify, setCanNotify] = useState(false)

  // זיהוי כניסה חדשה → התראה
  const prevIds = useRef<Set<string>>(new Set())
  const initialized = useRef(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration read of Notification.permission
    setCanNotify(typeof Notification !== 'undefined' && Notification.permission === 'granted')
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

  // התראה כשמישהו חדש נכנס (מדלגים על הטעינה הראשונה כדי לא להציף)
  useEffect(() => {
    const currentIds = new Set(online.map((r) => r.id))
    if (!initialized.current) {
      initialized.current = true
      prevIds.current = currentIds
      return
    }
    const newcomers = online.filter((r) => !prevIds.current.has(r.id))
    for (const r of newcomers) {
      const who = r.verified ? (r.name || 'משתמש רשום') : 'מבקר אנונימי'
      toast(`👋 ${who} נכנס/ה`, { description: 'מישהו מחובר עכשיו' })
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try { new Notification('ApexLeads — מישהו נכנס', { body: `${who} מחובר/ת עכשיו`, icon: '/logo-apexleads.jpg' }) } catch { /* ignore */ }
      }
    }
    prevIds.current = currentIds
  }, [online])

  const requestNotify = async () => {
    if (typeof Notification === 'undefined') return
    const p = await Notification.requestPermission()
    setCanNotify(p === 'granted')
    if (p === 'granted') toast.success('התראות הופעלו — תקבל הודעה כשמישהו נכנס')
  }

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
            {canNotify ? (
              <span className="text-xs text-success flex items-center gap-1"><BellRing className="w-3.5 h-3.5" />התראות פעילות</span>
            ) : (
              <Button variant="ghost" size="sm" onClick={requestNotify} className="h-7 gap-1 text-xs">
                <Bell className="w-3.5 h-3.5" />הפעל התראות
              </Button>
            )}
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
