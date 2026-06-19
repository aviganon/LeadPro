'use client'

import { useState, useEffect, Suspense } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock, User, CheckCircle,
  Gamepad2, Sparkles, GraduationCap, Trophy,
} from 'lucide-react'
import { APP_LOGO, APP_NAME } from '@/lib/constants'
import { syncSessionCookies } from '@/lib/sessionCookieClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AuthMode = 'login' | 'signup' | 'reset'

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential': 'אימייל או סיסמה שגויים',
    'auth/user-not-found': 'משתמש לא נמצא',
    'auth/wrong-password': 'סיסמה שגויה',
    'auth/email-already-in-use': 'אימייל כבר רשום',
    'auth/weak-password': 'סיסמה חלשה — לפחות 6 תווים',
    'auth/invalid-email': 'אימייל לא תקין',
    'auth/too-many-requests': 'יותר מדי ניסיונות — נסה שוב מאוחר יותר',
  }
  return map[code] ?? 'שגיאה — נסה שוב'
}

function AuthPageContent() {
  const searchParams = useSearchParams()
  const { signIn, signUp, resetPassword } = useAuth()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    setResetSent(false)
  }, [mode])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const redirectTo = searchParams.get('redirect') || '/learn'
      if (mode === 'login') {
        await signIn(email, password)
        await syncSessionCookies()
        window.location.assign(redirectTo)
        return
      } else if (mode === 'signup') {
        await signUp(email, password, name)
        await syncSessionCookies()
        window.location.assign(redirectTo)
        return
      } else {
        await resetPassword(email)
        setResetSent(true)
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(friendlyError(code))
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Gamepad2, text: 'משחקים שמלמדים בלי לשים לב' },
    { icon: Sparkles, text: 'מורה פרטי AI שזמין תמיד' },
    { icon: Trophy, text: 'נקודות, רצפים והישגים' },
    { icon: GraduationCap, text: 'מותאם לרמה ולכיתה שלך' },
  ]

  return (
    <div className="min-h-screen flex bg-mesh">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/10 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5 animate-float-slow" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-white/10 animate-float-delay-1" />

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <img
              src={APP_LOGO}
              alt={`${APP_NAME} Logo`}
              className="w-14 h-14 rounded-2xl shadow-lg object-cover"
              width={56}
              height={56}
            />
            <span className="text-2xl font-bold font-display">{APP_NAME}</span>
          </Link>

          <h1 className="text-4xl font-bold mb-4 leading-tight font-display">
            לומדים תוך כדי משחק 🚀
          </h1>

          <p className="text-xl text-white/80 mb-8 max-w-md">
            התחברות אופציונלית — היא רק שומרת את ההתקדמות, הנקודות וההישגים שלך.
          </p>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-scale-in">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img
              src={APP_LOGO}
              alt={`${APP_NAME} Logo`}
              className="w-12 h-12 rounded-2xl shadow-md object-cover"
              width={48}
              height={48}
            />
            <span className="text-xl font-bold gradient-text font-display">{APP_NAME}</span>
          </Link>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-display">
                {mode === 'login' && 'ברוכים השבים! 👋'}
                {mode === 'signup' && 'יוצרים חשבון'}
                {mode === 'reset' && 'איפוס סיסמה'}
              </CardTitle>
              <CardDescription>
                {mode === 'login' && 'התחברו כדי לשמור את ההתקדמות'}
                {mode === 'signup' && 'חינם לגמרי — בלי כרטיס אשראי'}
                {mode === 'reset' && 'נשלח לך קישור לאיפוס סיסמה'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {mode !== 'reset' && (
                <div className="flex p-1 bg-muted rounded-xl mb-6">
                  <button
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      mode === 'login' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    התחברות
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      mode === 'signup' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    הרשמה
                  </button>
                </div>
              )}

              {resetSent ? (
                <div className="text-center py-8 animate-scale-in">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">נשלח בהצלחה!</h3>
                  <p className="text-muted-foreground mb-6">בדקו את תיבת הדואר שלכם</p>
                  <Button variant="outline" onClick={() => setMode('login')}>חזרה להתחברות</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">שם</label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="איך קוראים לך?"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">אימייל</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        dir="ltr"
                        autoComplete="email"
                        className="pr-10 text-left"
                        required
                      />
                    </div>
                  </div>

                  {mode !== 'reset' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">סיסמה</label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={mode === 'signup' ? 'לפחות 6 תווים' : '••••••••'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          dir="ltr"
                          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                          className="pr-10 pl-10 text-left"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-scale-in">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full btn-shimmer" size="lg" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        טוען...
                      </span>
                    ) : (
                      <>
                        {mode === 'login' && 'התחבר'}
                        {mode === 'signup' && 'צור חשבון'}
                        {mode === 'reset' && 'שלח קישור'}
                        {mode !== 'reset' && <ArrowLeft className="w-4 h-4 mr-2" />}
                      </>
                    )}
                  </Button>

                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('reset')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                      שכחת סיסמה?
                    </button>
                  )}
                  {mode === 'reset' && (
                    <button type="button" onClick={() => setMode('login')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                      חזרה להתחברות
                    </button>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/learn" className="text-primary hover:underline font-medium">
              דלגו והמשיכו ללמוד בלי חשבון →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          טוען...
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  )
}
