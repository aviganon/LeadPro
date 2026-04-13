'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

const VERTICALS = [
  { value: 'real_estate', label: '🏠 נדל"ן' },
  { value: 'car',         label: '🚗 רכב' },
  { value: 'general',     label: '💼 כללי' },
]

type Mode = 'login' | 'signup' | 'reset'

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [vertical, setVertical] = useState('real_estate')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  function friendlyError(code: string): string {
    const map: Record<string, string> = {
      'auth/invalid-credential':     'אימייל או סיסמה שגויים',
      'auth/user-not-found':         'משתמש לא נמצא',
      'auth/wrong-password':         'סיסמה שגויה',
      'auth/email-already-in-use':   'אימייל כבר רשום',
      'auth/weak-password':          'סיסמה חלשה — לפחות 6 תווים',
      'auth/invalid-email':          'אימייל לא תקין',
      'auth/too-many-requests':      'יותר מדי ניסיונות — נסה שוב מאוחר יותר',
    }
    return map[code] ?? 'שגיאה — נסה שוב'
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        router.push('/dashboard')
      } else if (mode === 'signup') {
        await signUp(email, password, name, vertical)
        router.push('/dashboard')
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-background-tertiary)',
      direction: 'rtl',
      fontFamily: 'var(--font-sans)',
      padding: 16,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 16,
        padding: '32px 28px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🎯</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>LeadPro</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 3 }}>
            פלטפורמת לידים ופרסום
          </div>
        </div>

        {/* Mode tabs */}
        {mode !== 'reset' && (
          <div style={{
            display: 'flex',
            background: 'var(--color-background-secondary)',
            borderRadius: 10,
            padding: 3,
            marginBottom: 24,
          }}>
            {(['login', 'signup'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: 'none',
                  background: mode === m ? 'var(--color-background-primary)' : 'transparent',
                  color: mode === m ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontSize: 14,
                  cursor: 'pointer',
                  fontWeight: mode === m ? 500 : 400,
                }}
              >
                {m === 'login' ? 'התחברות' : 'הרשמה'}
              </button>
            ))}
          </div>
        )}

        {/* Reset confirmation */}
        {resetSent ? (
          <div style={{
            textAlign: 'center',
            padding: '20px 0',
            color: 'var(--color-text-success)',
            fontSize: 15,
          }}>
            ✅ קישור לאיפוס סיסמה נשלח לאימייל שלך
            <br />
            <button
              onClick={() => { setMode('login'); setResetSent(false) }}
              style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-info)', fontSize: 14 }}
            >
              חזרה להתחברות
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name — signup only */}
            {mode === 'signup' && (
              <Field label="שם מלא">
                <input
                  required value={name} onChange={e => setName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  style={inputStyle}
                />
              </Field>
            )}

            {/* Email */}
            <Field label="אימייל">
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </Field>

            {/* Password — not for reset */}
            {mode !== 'reset' && (
              <Field label="סיסמה">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'לפחות 6 תווים' : '••••••••'}
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{
                      position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            )}

            {/* Vertical — signup only */}
            {mode === 'signup' && (
              <Field label="תחום עיסוק">
                <select
                  value={vertical} onChange={e => setVertical(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {VERTICALS.map(v => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </Field>
            )}

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 8,
                background: 'var(--color-background-danger)',
                color: 'var(--color-text-danger)',
                fontSize: 13,
              }}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: loading ? 'var(--color-border-secondary)' : 'var(--color-text-primary)',
                color: 'var(--color-background-primary)',
                fontSize: 15,
                fontWeight: 500,
                cursor: loading ? 'default' : 'pointer',
                marginTop: 4,
              }}
            >
              {loading
                ? 'אנא המתן...'
                : mode === 'login' ? 'התחבר'
                : mode === 'signup' ? 'צור חשבון'
                : 'שלח קישור איפוס'
              }
            </button>

            {/* Forgot password */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('reset'); setError('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-secondary)', fontSize: 13, textAlign: 'center',
                }}
              >
                שכחת סיסמה?
              </button>
            )}

            {/* Trial notice for signup */}
            {mode === 'signup' && (
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 4 }}>
                14 יום ניסיון חינם — ללא כרטיס אשראי
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '0.5px solid var(--color-border-secondary)',
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)',
  direction: 'rtl',
  outline: 'none',
}
