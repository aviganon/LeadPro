'use client'

import { useState, useEffect, Suspense } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  User,
  UserPlus,
  Building2,
  Car,
  Briefcase,
  CheckCircle,
  Sparkles,
  Zap,
  TrendingUp,
  Target,
} from 'lucide-react'
import { APP_LOGO, APP_NAME } from '@/lib/constants'
import { syncSessionCookies } from '@/lib/sessionCookieClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AuthMode = 'login' | 'signup' | 'reset'

const VERTICALS = [
  { value: 'real_estate', label: 'נדל"ן', icon: Building2, color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'car', label: 'רכב', icon: Car, color: 'bg-accent/10 text-accent border-accent/20' },
  { value: 'recruitment', label: 'גיוס והשמה', icon: UserPlus, color: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20' },
  { value: 'general', label: 'עסקים', icon: Briefcase, color: 'bg-success/10 text-success border-success/20' },
]

function FloatingCard({ className, delay = 0, children }: { className?: string; delay?: number; children: React.ReactNode }) {
  return (
    <div 
      className={`absolute animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

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
  const router = useRouter()
  const { signIn, signUp, resetPassword } = useAuth()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [vertical, setVertical] = useState('real_estate')
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
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      if (mode === 'login') {
        await signIn(email, password)
        await syncSessionCookies()
        // Give the browser a tick to commit the cookie before navigation (fixes Safari + Chrome race)
        await new Promise(r => setTimeout(r, 150))
        router.replace(redirectTo)
      } else if (mode === 'signup') {
        await signUp(email, password, name, vertical)
        await syncSessionCookies()
        await new Promise(r => setTimeout(r, 150))
        router.replace(redirectTo)
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
    { icon: Target, text: 'איסוף לידים אוטומטי' },
    { icon: Sparkles, text: 'יצירת תוכן עם AI' },
    { icon: Zap, text: 'פרסום בקליק אחד' },
    { icon: TrendingUp, text: 'אנליטיקס בזמן אמת' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        {/* Floating elements */}
        <FloatingCard className="top-20 right-20" delay={0}>
          <Card className="w-64 shadow-2xl border-0 glass-dark text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <span className="text-sm font-medium">ליד חדש!</span>
              </div>
              <p className="text-xs text-white/70">דירה 4 חדרים, רמת גן</p>
              <div className="mt-2 text-lg font-bold">ציון: 92</div>
            </CardContent>
          </Card>
        </FloatingCard>

        <FloatingCard className="bottom-40 left-16" delay={1}>
          <Card className="w-56 shadow-2xl border-0 glass-dark text-white">
            <CardContent className="p-4">
              <div className="text-sm text-white/70 mb-1">פרסומים היום</div>
              <div className="text-3xl font-bold">24</div>
              <div className="flex gap-1 mt-2">
                {[14, 22, 18, 28, 20, 16, 24].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white/20 rounded-full"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </FloatingCard>

        <FloatingCard className="top-1/3 left-1/4" delay={2}>
          <Card className="w-48 shadow-2xl border-0 glass-dark text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-warning" />
                <span className="text-sm">AI יצר פוסט חדש</span>
              </div>
            </CardContent>
          </Card>
        </FloatingCard>

        {/* Background circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5 animate-float-slow" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-white/5 animate-float-delay-1" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <img
              src={APP_LOGO}
              alt={`${APP_NAME} Logo`}
              className="w-14 h-14 rounded-xl shadow-lg object-cover"
              width={56}
              height={56}
            />
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </Link>

          <h1 className="text-4xl font-bold mb-4 leading-tight">
            הגיע לפסגה<br />
            עם <span className="text-white/90">{APP_NAME}</span>
          </h1>
          
          <p className="text-xl text-white/80 mb-8 max-w-md">
            אסוף לידים, צור פוסטים עם AI (כשהמפתח מוגדר), ופרסם בקבוצות פייסבוק מהחשבון שלך
          </p>
          
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <feature.icon className="w-4 h-4" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img
              src={APP_LOGO}
              alt={`${APP_NAME} Logo`}
              className="w-12 h-12 rounded-xl shadow-md object-cover"
              width={48}
              height={48}
            />
            <span className="text-xl font-bold gradient-text">{APP_NAME}</span>
          </Link>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">
                {mode === 'login' && 'ברוכים השבים!'}
                {mode === 'signup' && 'צור חשבון חדש'}
                {mode === 'reset' && 'איפוס סיסמה'}
              </CardTitle>
              <CardDescription>
                {mode === 'login' && 'התחבר לחשבון שלך להמשך'}
                {mode === 'signup' && 'התחל את הניסיון החינמי שלך'}
                {mode === 'reset' && 'נשלח לך קישור לאיפוס סיסמה'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Mode tabs */}
              {mode !== 'reset' && (
                <div className="flex p-1 bg-muted rounded-xl mb-6">
                  <button
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      mode === 'login' 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    התחברות
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      mode === 'signup' 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    הרשמה
                  </button>
                </div>
              )}

              {/* Reset success message */}
              {resetSent ? (
                <div className="text-center py-8 animate-scale-in">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">נשלח בהצלחה!</h3>
                  <p className="text-muted-foreground mb-6">
                    בדוק את תיבת הדואר שלך לקישור איפוס הסיסמה
                  </p>
                  <Button variant="outline" onClick={() => setMode('login')}>
                    חזרה להתחברות
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name field - signup only */}
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">שם מלא</label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="ישראל ישראלי"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          dir="ltr"
                          className="pr-10 text-left"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Email field */}
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

                  {/* Password field - not for reset */}
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

                  {/* Vertical selection - signup only */}
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">תחום עיסוק</label>
                      <div className="grid grid-cols-3 gap-2">
                        {VERTICALS.map((v) => (
                          <button
                            key={v.value}
                            type="button"
                            onClick={() => setVertical(v.value)}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              vertical === v.value 
                                ? v.color + ' border-current' 
                                : 'border-border hover:border-muted-foreground/30'
                            }`}
                          >
                            <v.icon className={`w-5 h-5 mx-auto mb-1 ${vertical === v.value ? '' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-medium ${vertical === v.value ? '' : 'text-muted-foreground'}`}>
                              {v.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-scale-in">
                      {error}
                    </div>
                  )}

                  {/* Submit button */}
                  <Button 
                    type="submit" 
                    className="w-full btn-shimmer" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

                  {/* Forgot password link */}
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      שכחת סיסמה?
                    </button>
                  )}

                  {/* Back to login from reset */}
                  {mode === 'reset' && (
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      חזרה להתחברות
                    </button>
                  )}

                  {/* Trial notice */}
                  {mode === 'signup' && (
                    <p className="text-center text-xs text-muted-foreground">
                      14 יום ניסיון חינם - ללא כרטיס אשראי
                    </p>
                  )}
                </form>
              )}

            </CardContent>
          </Card>

          {/* Terms */}
          {mode === 'signup' && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              בהרשמה אתה מסכים ל
              <Link href="#" className="text-primary hover:underline">תנאי השימוש</Link>
              {' '}ו
              <Link href="#" className="text-primary hover:underline">מדיניות הפרטיות</Link>
            </p>
          )}
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
