'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Users, TrendingUp, Megaphone, ShieldCheck,
  Search, MoreVertical, CheckCircle, XCircle,
  Activity, Database, RefreshCw, AlertTriangle
} from 'lucide-react'

type AdminTab = 'users' | 'stats' | 'system' | 'logs'

const MOCK_USERS = [
  { id: 'u1', name: 'דוד לוי', email: 'david@example.com', plan: 'pro', vertical: 'real_estate', isActive: true, facebookConnected: true, leadsCount: 47, postsCount: 134 },
  { id: 'u2', name: 'שרה כהן', email: 'sara@example.com', plan: 'basic', vertical: 'car', isActive: true, facebookConnected: true, leadsCount: 23, postsCount: 58 },
  { id: 'u3', name: 'יוסי מזרחי', email: 'yossi@example.com', plan: 'free', vertical: 'real_estate', isActive: false, facebookConnected: false, leadsCount: 4, postsCount: 6 },
  { id: 'u4', name: 'מיכל ברק', email: 'michal@example.com', plan: 'enterprise', vertical: 'general', isActive: true, facebookConnected: true, leadsCount: 112, postsCount: 340 },
]

const PLAN_COLORS: Record<string, string> = {
  free: '#888780',
  basic: '#378ADD',
  pro: '#1D9E75',
  enterprise: '#7F77DD',
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('users')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState(MOCK_USERS)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth?redirect=/admin')
      return
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [authLoading, user, router])

  const filtered = users.filter(u =>
    u.name.includes(search) || u.email.includes(search)
  )

  function toggleActive(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))
  }

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'users',  label: 'משתמשים', icon: <Users size={16} /> },
    { id: 'stats',  label: 'סטטיסטיקות', icon: <TrendingUp size={16} /> },
    { id: 'system', label: 'מערכת', icon: <ShieldCheck size={16} /> },
    { id: 'logs',   label: 'לוגים', icon: <Activity size={16} /> },
  ]

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)',
      }}>
        טוען...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)', direction: 'rtl', fontFamily: 'var(--font-sans)' }}>

      {/* Top bar */}
      <div style={{
        background: 'var(--color-background-primary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        height: 56,
        gap: 32,
      }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>🎯 LeadPro Admin</span>

        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 14px', borderRadius: 7,
                border: 'none',
                background: tab === t.id ? 'var(--color-background-secondary)' : 'transparent',
                color: tab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontSize: 13, cursor: 'pointer', fontWeight: tab === t.id ? 500 : 400,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginRight: 'auto', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          Admin Panel
        </div>
      </div>

      <div style={{ padding: 28 }}>

        {/* ===== USERS TAB ===== */}
        {tab === 'users' && (
          <div>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'סה"כ משתמשים', value: users.length, icon: <Users size={18} /> },
                { label: 'פעילים', value: users.filter(u => u.isActive).length, icon: <CheckCircle size={18} /> },
                { label: 'חוברו לפייסבוק', value: users.filter(u => u.facebookConnected).length, icon: <Megaphone size={18} /> },
                { label: 'תוכניות Pro+', value: users.filter(u => ['pro','enterprise'].includes(u.plan)).length, icon: <TrendingUp size={18} /> },
              ].map(card => (
                <div key={card.label} style={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ color: 'var(--color-text-secondary)' }}>{card.icon}</div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 500 }}>{card.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{card.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16, maxWidth: 320 }}>
              <Search size={15} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text-tertiary)',
              }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חפש משתמש..."
                style={{
                  width: '100%', padding: '9px 36px 9px 12px',
                  borderRadius: 8, border: '0.5px solid var(--color-border-secondary)',
                  fontSize: 13, background: 'var(--color-background-primary)',
                  color: 'var(--color-text-primary)', direction: 'rtl',
                }}
              />
            </div>

            {/* Users table */}
            <div style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 100px 100px 80px 80px 80px 60px',
                padding: '10px 18px',
                background: 'var(--color-background-secondary)',
                fontSize: 12, color: 'var(--color-text-tertiary)', fontWeight: 500,
                gap: 12,
              }}>
                <span>משתמש</span>
                <span>אימייל</span>
                <span>תוכנית</span>
                <span>תחום</span>
                <span>לידים</span>
                <span>פרסומים</span>
                <span>פייסבוק</span>
                <span>פעיל</span>
              </div>

              {filtered.map((user, i) => (
                <div
                  key={user.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 100px 100px 80px 80px 80px 60px',
                    padding: '13px 18px',
                    borderTop: i > 0 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 13,
                    opacity: user.isActive ? 1 : 0.5,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{user.name}</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{user.email}</span>
                  <span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                      background: PLAN_COLORS[user.plan] + '22',
                      color: PLAN_COLORS[user.plan],
                    }}>
                      {user.plan}
                    </span>
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {user.vertical === 'real_estate' ? 'נדל"ן' : user.vertical === 'car' ? 'רכב' : 'כללי'}
                  </span>
                  <span style={{ fontWeight: 500 }}>{user.leadsCount}</span>
                  <span style={{ fontWeight: 500 }}>{user.postsCount}</span>
                  <span>
                    {user.facebookConnected
                      ? <CheckCircle size={16} style={{ color: 'var(--color-text-success)' }} />
                      : <XCircle size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    }
                  </span>
                  <span>
                    <button
                      onClick={() => toggleActive(user.id)}
                      style={{
                        background: user.isActive ? 'var(--color-background-success)' : 'var(--color-background-secondary)',
                        border: 'none', borderRadius: 20,
                        padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                        color: user.isActive ? 'var(--color-text-success)' : 'var(--color-text-secondary)',
                        fontWeight: 500,
                      }}
                    >
                      {user.isActive ? 'פעיל' : 'כבוי'}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== STATS TAB ===== */}
        {tab === 'stats' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'סה"כ לידים במערכת', value: '186' },
                { label: 'סה"כ פרסומים', value: '538' },
                { label: 'שיעור המרה ממוצע', value: '18.3%' },
                { label: 'פרסומים היום', value: '24' },
                { label: 'לידים היום', value: '11' },
                { label: 'קבוצות פעילות', value: '73' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 12, padding: '18px 22px',
                }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 500 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Top users table */}
            <div style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>משתמשים מובילים</div>
              {MOCK_USERS.sort((a,b) => b.leadsCount - a.leadsCount).map((u, i) => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < MOCK_USERS.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--color-background-info)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, color: 'var(--color-text-info)',
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <span>{u.leadsCount} לידים</span>
                    <span>{u.postsCount} פרסומים</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SYSTEM TAB ===== */}
        {tab === 'system' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* System status */}
            <div style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>סטטוס שירותים</div>
              {[
                { name: 'Firebase Firestore', status: 'ok' },
                { name: 'Facebook Graph API', status: 'ok' },
                { name: 'Post Scheduler', status: 'ok' },
                { name: 'Lead Scraper', status: 'ok' },
                { name: 'Claude AI', status: 'ok' },
                { name: 'Stripe Billing', status: 'warn' },
              ].map(svc => (
                <div key={svc.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 0',
                  borderBottom: '0.5px solid var(--color-border-tertiary)',
                }}>
                  <span style={{ fontSize: 13 }}>{svc.name}</span>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12,
                    color: svc.status === 'ok' ? 'var(--color-text-success)' : 'var(--color-text-warning)',
                  }}>
                    {svc.status === 'ok'
                      ? <CheckCircle size={13} />
                      : <AlertTriangle size={13} />
                    }
                    {svc.status === 'ok' ? 'תקין' : 'בדיקה'}
                  </span>
                </div>
              ))}
            </div>

            {/* System toggles */}
            <div style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>הגדרות מערכת</div>
              {[
                { label: 'מצב תחזוקה', key: 'maintenance', value: false },
                { label: 'Lead Scraper פעיל', key: 'scraper', value: true },
                { label: 'פרסום אוטומטי', key: 'autopost', value: true },
                { label: 'AI תוכן', key: 'ai', value: true },
                { label: 'רישום משתמשים חדשים', key: 'signup', value: true },
              ].map(setting => (
                <div key={setting.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '0.5px solid var(--color-border-tertiary)',
                }}>
                  <span style={{ fontSize: 13 }}>{setting.label}</span>
                  <div style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: setting.value ? '#1D9E75' : 'var(--color-border-secondary)',
                    cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 3, right: setting.value ? 3 : 19,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff',
                      transition: 'right 0.2s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== LOGS TAB ===== */}
        {tab === 'logs' && (
          <div style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 18px', background: 'var(--color-background-secondary)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Activity Log</span>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--color-text-secondary)',
              }}>
                <RefreshCw size={13} /> רענן
              </button>
            </div>
            {[
              { time: '14:32:11', level: 'info', msg: 'user u2 published to 3 groups successfully', user: 'שרה כהן' },
              { time: '14:28:44', level: 'info', msg: 'lead scraper ran for user u1 — 7 new leads', user: 'דוד לוי' },
              { time: '14:15:02', level: 'warn', msg: 'Facebook token expiring in 3 days for user u3', user: 'יוסי מזרחי' },
              { time: '13:55:19', level: 'info', msg: 'user u4 scheduled 5 posts for tomorrow', user: 'מיכל ברק' },
              { time: '13:40:07', level: 'error', msg: 'publish failed: rate limit hit for group 112233', user: 'דוד לוי' },
              { time: '13:12:55', level: 'info', msg: 'new user registered: plan=free', user: 'משתמש חדש' },
            ].map((log, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, padding: '11px 18px',
                borderTop: '0.5px solid var(--color-border-tertiary)',
                fontSize: 12, fontFamily: 'var(--font-mono)',
                alignItems: 'flex-start',
              }}>
                <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{log.time}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 10, flexShrink: 0,
                  fontWeight: 500, fontFamily: 'var(--font-sans)',
                  background: log.level === 'error'
                    ? 'var(--color-background-danger)'
                    : log.level === 'warn'
                    ? 'var(--color-background-warning)'
                    : 'var(--color-background-success)',
                  color: log.level === 'error'
                    ? 'var(--color-text-danger)'
                    : log.level === 'warn'
                    ? 'var(--color-text-warning)'
                    : 'var(--color-text-success)',
                }}>
                  {log.level}
                </span>
                <span style={{ color: 'var(--color-text-primary)', flex: 1 }}>{log.msg}</span>
                <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0, fontFamily: 'var(--font-sans)' }}>{log.user}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
