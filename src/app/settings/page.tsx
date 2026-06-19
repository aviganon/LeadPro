'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User as UserIcon, Mail, Star, Target, LogOut, Languages, ArrowRight, Loader2, Shield } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { getGlobalStats } from '@/lib/localProgress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { APP_NAME, APP_LOGO } from '@/lib/constants'

export default function SettingsPage() {
  const { user, loading, logOut } = useAuth()
  const { locale, toggle } = useLocale()
  const router = useRouter()
  const [stats, setStats] = useState({ points: 0, answered: 0, subjects: 0 })

  // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration read from localStorage
  useEffect(() => { setStats(getGlobalStats()) }, [])
  useEffect(() => {
    if (!loading && !user) router.replace('/auth?redirect=/settings')
  }, [loading, user, router])

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  const handleLogout = async () => { await logOut(); router.replace('/') }

  return (
    <div className="min-h-screen bg-mesh">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={APP_LOGO} alt={APP_NAME} className="w-9 h-9 rounded-2xl object-cover" width={36} height={36} />
            <span className="font-bold gradient-text font-display">{APP_NAME}</span>
          </Link>
          <Button variant="ghost" size="sm" asChild className="gap-1"><Link href="/learn"><ArrowRight className="w-4 h-4" />למסך הלמידה</Link></Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-xl space-y-6">
        <h1 className="text-3xl font-bold font-display">הגדרות</h1>

        {/* פרופיל */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-3xl bg-primary/15 text-primary flex items-center justify-center">
                <UserIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xl font-bold font-display flex items-center gap-2">
                  {user.name}
                  {user.role === 'admin' && <Shield className="w-4 h-4 text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1" dir="ltr">
                  <Mail className="w-3.5 h-3.5" />{user.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* התקדמות */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 font-bold font-display mb-4"><Target className="w-5 h-5 text-primary" />ההתקדמות שלי</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat icon={Star} value={stats.points} label="נקודות" />
              <Stat value={stats.answered} label="שאלות שענית" />
              <Stat value={stats.subjects} label="מקצועות" />
            </div>
          </CardContent>
        </Card>

        {/* העדפות */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <button onClick={toggle} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-muted transition-colors">
              <span className="flex items-center gap-2"><Languages className="w-5 h-5 text-muted-foreground" />שפה</span>
              <span className="font-medium">{locale === 'he' ? 'עברית' : 'English'}</span>
            </button>
          </CardContent>
        </Card>

        <Button onClick={handleLogout} variant="outline" className="w-full rounded-2xl text-destructive border-destructive/30 hover:bg-destructive/5">
          <LogOut className="w-4 h-4 ml-2" />התנתקות
        </Button>
      </main>
    </div>
  )
}

function Stat({ icon: Icon, value, label }: { icon?: React.ElementType; value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <div className="text-2xl font-bold gradient-text flex items-center justify-center gap-1">
        {Icon && <Icon className="w-4 h-4 fill-fun text-fun" />}{value.toLocaleString('he-IL')}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}
