'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLeads, usePosts, useScraper, useFacebookGroups } from '@/hooks/useLeads'
import { renderTemplate, DEFAULT_TEMPLATES, VERTICAL_CONFIG } from '@/lib/templates'
import {
  LayoutDashboard, Users, Megaphone, Settings, Bell,
  Plus, RefreshCw, LogOut, Calendar, X, CheckCircle,
  AlertTriangle, Clock,
} from 'lucide-react'
import type { LeadStatus } from '@/types'

function FBIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}

type Tab = 'overview' | 'leads' | 'posts' | 'groups' | 'compose' | 'settings'
const STATUS_LABEL: Record<LeadStatus, string> = { new:'חדש', contacted:'נוצר קשר', qualified:'מסונן', converted:'המרה', lost:'לא רלוונטי' }
const STATUS_COLOR: Record<LeadStatus, string> = { new:'var(--color-text-info)', contacted:'var(--color-text-warning)', qualified:'var(--color-text-success)', converted:'var(--color-text-success)', lost:'var(--color-text-danger)' }
const NAV: { id: Tab; label: string }[] = [
  { id:'overview', label:'סקירה' },
  { id:'leads',    label:'לידים' },
  { id:'posts',    label:'פרסומים' },
  { id:'groups',   label:'קבוצות' },
  { id:'compose',  label:'פרסום חדש' },
  { id:'settings', label:'הגדרות' },
]

export default function DashboardPage() {
  const { user, logOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [notice, setNotice] = useState('')

  const { leads, loading: leadsLoading, stats: leadStats, updateStatus } = useLeads(user?.id ?? null)
  const { posts, loading: postsLoading, stats: postStats, cancelPost, fetchPosts } = usePosts(user?.id ?? null)
  const { run: runScraper, running: scraperRunning, lastCount } = useScraper(user?.id ?? null, user?.vertical ?? 'general')
  const { groups, syncing, syncGroups, toggleGroup } = useFacebookGroups(user?.id ?? null)

  const [postBody, setPostBody] = useState('')
  const [selGroups, setSelGroups] = useState<string[]>([])
  const [schedAt, setSchedAt] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [pubResult, setPubResult] = useState<{ published:number; failed:number } | null>(null)
  const [aiGen, setAiGen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth')
    const p = new URLSearchParams(window.location.search)
    if (p.get('fb_connected') === '1') setNotice('✅ פייסבוק חובר בהצלחה!')
    if (p.get('fb_error')) setNotice('❌ שגיאה בחיבור פייסבוק')
    if (p.get('upgrade') === 'success') setNotice('🎉 שדרוג הצליח!')
    window.history.replaceState({}, '', '/dashboard')
  }, [authLoading, user, router])

  function connectFacebook() {
    if (!user) return
    const ru = encodeURIComponent(`${window.location.origin}/api/facebook/callback`)
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? ''
    window.location.href = `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${ru}&scope=publish_to_groups,groups_access_member_info,email,public_profile&state=${user.id}&response_type=code`
  }

  async function handlePublish() {
    if (!user || !postBody.trim()) return
    setPublishing(true); setPubResult(null)
    try {
      const res = await fetch('/api/posts/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, body: postBody, groupIds: selGroups, scheduledAt: schedAt || undefined }),
      })
      const data = await res.json()
      setPubResult({ published: data.published ?? 0, failed: data.failed ?? 0 })
      if (data.success) { setPostBody(''); setSchedAt('') }
      fetchPosts()
    } finally { setPublishing(false) }
  }

  async function handleAiGenerate() {
    if (!user) return
    setAiGen(true)
    try {
      const cfg = VERTICAL_CONFIG[user.vertical ?? 'general']
      const res = await fetch('/api/ai/generate-post', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `כתוב פוסט קצר ומזמין בעברית (עד 120 מילים) לפרסום בקבוצת פייסבוק בתחום ${cfg?.label ?? 'כללי'}. כלול קריאה לפעולה ואמוג'י. ללא כותרת.` }),
      })
      const data = await res.json()
      if (data.text) setPostBody(data.text)
    } finally { setAiGen(false) }
  }

  function applyTemplate(i: number) {
    const t = DEFAULT_TEMPLATES[i]
    if (!t || !user) return
    setPostBody(renderTemplate(t.bodyTemplate, { agentName: user.name ?? '', phone: '', city: '', area: '', carModel: '', dealerName: user.name ?? '' }))
  }

  if (authLoading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'var(--font-sans)', color:'var(--color-text-secondary)' }}>טוען...</div>

  const vertCfg = VERTICAL_CONFIG[user?.vertical ?? 'general']
  const selectedGroups = groups.filter(g => g.isSelected)

  const card: React.CSSProperties = { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12 }
  const pill = (active: boolean): React.CSSProperties => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: active ? 'var(--color-background-info)' : 'transparent', color: active ? 'var(--color-text-info)' : 'var(--color-text-secondary)', border: `0.5px solid ${active ? 'var(--color-border-info)' : 'var(--color-border-secondary)'}`, cursor: 'pointer' })

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'var(--font-sans)', direction:'rtl', overflow:'hidden' }}>

      {/* SIDEBAR */}
      <aside style={{ width:210, flexShrink:0, background:'var(--color-background-secondary)', borderLeft:'0.5px solid var(--color-border-tertiary)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'18px 18px 14px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
          <div style={{ fontSize:17, fontWeight:600 }}>🎯 LeadPro</div>
          <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:2 }}>{vertCfg?.emoji} {vertCfg?.label}</div>
        </div>

        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'none', marginBottom:2, background: tab===n.id ? 'var(--color-background-primary)' : 'transparent', color: tab===n.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontSize:13, cursor:'pointer', fontWeight: tab===n.id ? 500 : 400, textAlign:'right' }}>
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ padding:'10px 12px', borderTop:'0.5px solid var(--color-border-tertiary)' }}>
          {user?.facebookConnected ? (
            <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 10px', borderRadius:8, background:'var(--color-background-success)', color:'var(--color-text-success)', fontSize:12 }}>
              <FBIcon size={14} /> מחובר לפייסבוק
            </div>
          ) : (
            <button onClick={connectFacebook} style={{ width:'100%', padding:'9px', borderRadius:8, background:'#1877F2', color:'#fff', border:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontSize:13, cursor:'pointer', fontWeight:500 }}>
              <FBIcon size={14} /> חבר פייסבוק
            </button>
          )}
        </div>

        <div style={{ padding:'10px 12px', borderTop:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, color:'var(--color-text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name ?? user?.email}</span>
          <button onClick={logOut} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-tertiary)', flexShrink:0 }}><LogOut size={14}/></button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--color-background-tertiary)' }}>
        {/* Topbar */}
        <div style={{ height:50, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', background:'var(--color-background-primary)', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
          <h1 style={{ fontSize:15, fontWeight:500, margin:0 }}>{NAV.find(n => n.id===tab)?.label}</h1>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <Bell size={17} style={{ color:'var(--color-text-secondary)', cursor:'pointer' }}/>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--color-background-info)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, color:'var(--color-text-info)' }}>{(user?.name??'U')[0]}</div>
          </div>
        </div>

        {/* Notice */}
        {notice && (
          <div style={{ padding:'9px 22px', background:'var(--color-background-info)', color:'var(--color-text-info)', fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {notice}
            <X size={14} style={{ cursor:'pointer' }} onClick={() => setNotice('')}/>
          </div>
        )}

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:22 }}>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
                {[
                  { label:'לידים', value:leadStats.total, sub:`${leadStats.byStatus.new} חדשים` },
                  { label:'פרסומים', value:postStats.total, sub:`${postStats.published} פורסמו` },
                  { label:'ציון ממוצע', value:leadStats.avgScore||'—', sub:'איכות' },
                  { label:'קבוצות', value:selectedGroups.length, sub:`מתוך ${groups.length}` },
                ].map(c => (
                  <div key={c.label} style={{ ...card, padding:'14px 16px' }}>
                    <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:4 }}>{c.label}</div>
                    <div style={{ fontSize:26, fontWeight:500 }}>{c.value}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-tertiary)', marginTop:2 }}>{c.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...card, padding:18 }}>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:12, display:'flex', justifyContent:'space-between' }}>
                  <span>לידים אחרונים</span>
                  <button onClick={() => setTab('leads')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--color-text-info)' }}>כל הלידים ←</button>
                </div>
                {leadsLoading ? <div style={{ color:'var(--color-text-tertiary)', fontSize:13 }}>טוען...</div>
                : leads.length === 0 ? <div style={{ color:'var(--color-text-tertiary)', fontSize:13, textAlign:'center', padding:'20px 0' }}>אין לידים עדיין</div>
                : leads.slice(0,5).map((l,i) => (
                  <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom: i<4 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.notes.slice(0,70)}</div>
                      <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:1 }}>{l.source}</div>
                    </div>
                    <div style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:500, marginRight:10, background: l.qualityScore>80 ? 'var(--color-background-success)' : 'var(--color-background-warning)', color: l.qualityScore>80 ? 'var(--color-text-success)' : 'var(--color-text-warning)' }}>{l.qualityScore}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LEADS */}
          {tab === 'leads' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{leadStats.total} לידים · {leadStats.byStatus.new} חדשים · {leadStats.byStatus.converted} המרות</div>
                <button onClick={() => runScraper(vertCfg?.keywords??[])} disabled={scraperRunning} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 15px', borderRadius:8, background:'var(--color-text-primary)', color:'var(--color-background-primary)', border:'none', fontSize:13, cursor: scraperRunning?'default':'pointer', fontWeight:500, opacity: scraperRunning?0.6:1 }}>
                  <RefreshCw size={13}/> {scraperRunning ? 'אוסף...' : 'אסוף לידים'}
                </button>
              </div>
              {lastCount !== null && <div style={{ marginBottom:10, fontSize:13, color:'var(--color-text-success)' }}>✅ {lastCount} לידים חדשים נוספו</div>}
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {leadsLoading ? <div style={{ color:'var(--color-text-tertiary)', fontSize:13, textAlign:'center', padding:'30px 0' }}>טוען...</div>
                : leads.length === 0 ? <div style={{ color:'var(--color-text-tertiary)', fontSize:13, textAlign:'center', padding:'40px 0' }}>לחץ &quot;אסוף לידים&quot; כדי להתחיל</div>
                : leads.map(l => (
                  <div key={l.id} style={{ ...card, padding:'11px 15px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, background: l.qualityScore>80 ? 'var(--color-background-success)' : l.qualityScore>60 ? 'var(--color-background-warning)' : 'var(--color-background-secondary)', color: l.qualityScore>80 ? 'var(--color-text-success)' : l.qualityScore>60 ? 'var(--color-text-warning)' : 'var(--color-text-secondary)' }}>{l.qualityScore}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.notes}</div>
                      <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:1 }}>{l.source} · {l.vertical}</div>
                    </div>
                    <select value={l.status} onChange={e => updateStatus(l.id, e.target.value as LeadStatus)} style={{ padding:'4px 8px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', fontSize:12, background:'var(--color-background-primary)', color:STATUS_COLOR[l.status], cursor:'pointer', flexShrink:0 }}>
                      {Object.entries(STATUS_LABEL).map(([v,lbl]) => <option key={v} value={v}>{lbl}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSTS */}
          {tab === 'posts' && (
            <div>
              <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
                {[{ label:'פורסמו', v:postStats.published, c:'var(--color-text-success)' },{ label:'מתוזמנים', v:postStats.scheduled, c:'var(--color-text-info)' },{ label:'נכשלו', v:postStats.failed, c:'var(--color-text-danger)' }].map(s => (
                  <div key={s.label} style={{ padding:'6px 12px', borderRadius:8, background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', fontSize:12, color:s.c }}>{s.v} {s.label}</div>
                ))}
                <button onClick={() => setTab('compose')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, background:'var(--color-text-primary)', color:'var(--color-background-primary)', border:'none', fontSize:12, cursor:'pointer', fontWeight:500, marginRight:'auto' }}>
                  <Plus size={13}/> חדש
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {postsLoading ? <div style={{ color:'var(--color-text-tertiary)', fontSize:13, textAlign:'center', padding:'30px 0' }}>טוען...</div>
                : posts.length === 0 ? <div style={{ color:'var(--color-text-tertiary)', fontSize:13, textAlign:'center', padding:'40px 0' }}>אין פרסומים עדיין</div>
                : posts.map(p => (
                  <div key={p.id} style={{ ...card, padding:'12px 15px', display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.body}</div>
                      <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:3 }}>{p.groupIds.length} קבוצות{p.scheduledAt && ` · ${new Date(p.scheduledAt).toLocaleDateString('he-IL')}`}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
                      <span style={{ padding:'2px 9px', borderRadius:20, fontSize:10, fontWeight:500, background: p.status==='published'?'var(--color-background-success)':p.status==='failed'?'var(--color-background-danger)':p.status==='scheduled'?'var(--color-background-info)':'var(--color-background-secondary)', color: p.status==='published'?'var(--color-text-success)':p.status==='failed'?'var(--color-text-danger)':p.status==='scheduled'?'var(--color-text-info)':'var(--color-text-secondary)' }}>
                        {p.status==='published'?'פורסם':p.status==='failed'?'נכשל':p.status==='scheduled'?'מתוזמן':p.status==='queued'?'בתור':'עצור'}
                      </span>
                      {(p.status==='scheduled'||p.status==='queued') && <button onClick={() => cancelPost(p.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-tertiary)' }}><X size={13}/></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUPS */}
          {tab === 'groups' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{selectedGroups.length} נבחרו מתוך {groups.length}</div>
                <button onClick={syncGroups} disabled={syncing||!user?.facebookConnected} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:8, background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-secondary)', fontSize:12, cursor: syncing?'default':'pointer', color:'var(--color-text-primary)', opacity: syncing||!user?.facebookConnected ? 0.5:1 }}>
                  <RefreshCw size={13}/> {syncing ? 'מסנכרן...' : 'סנכרן'}
                </button>
              </div>
              {!user?.facebookConnected && <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:12, background:'var(--color-background-warning)', color:'var(--color-text-warning)', fontSize:13 }}>⚠️ חבר פייסבוק כדי לסנכרן קבוצות</div>}
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {groups.length === 0 ? <div style={{ color:'var(--color-text-tertiary)', fontSize:13, textAlign:'center', padding:'40px 0' }}>לחץ &quot;סנכרן&quot; כדי לטעון קבוצות</div>
                : groups.map(g => (
                  <div key={g.id} onClick={() => toggleGroup(g.id, !g.isSelected)} style={{ ...card, padding:'11px 15px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', border: `0.5px solid ${g.isSelected?'var(--color-border-info)':'var(--color-border-tertiary)'}` }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{g.name}</div>
                      {g.memberCount && <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:1 }}>{g.memberCount.toLocaleString()} חברים</div>}
                    </div>
                    <div style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${g.isSelected?'var(--color-border-info)':'var(--color-border-secondary)'}`, background: g.isSelected?'var(--color-background-info)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {g.isSelected && <CheckCircle size={12} style={{ color:'var(--color-text-info)' }}/>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPOSE */}
          {tab === 'compose' && (
            <div style={{ maxWidth:580 }}>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:7 }}>תבניות מהירות</div>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  {DEFAULT_TEMPLATES.filter(t => t.vertical===user?.vertical||t.vertical==='general').slice(0,3).map((t,i) => (
                    <button key={i} onClick={() => applyTemplate(i)} style={{ padding:'5px 11px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-primary)', fontSize:12, cursor:'pointer', color:'var(--color-text-secondary)' }}>{t.name}</button>
                  ))}
                  <button onClick={handleAiGenerate} disabled={aiGen} style={{ padding:'5px 11px', borderRadius:8, border:'0.5px solid var(--color-border-info)', background:'var(--color-background-info)', fontSize:12, cursor: aiGen?'default':'pointer', color:'var(--color-text-info)', fontWeight:500, opacity: aiGen?0.6:1 }}>
                    {aiGen ? '✨ יוצר...' : '✨ AI'}
                  </button>
                </div>
              </div>

              <div style={{ ...card, padding:18, marginBottom:14 }}>
                <textarea value={postBody} onChange={e => setPostBody(e.target.value)} placeholder="כתוב את תוכן הפרסום..." rows={6} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', fontSize:14, fontFamily:'inherit', resize:'vertical', background:'var(--color-background-primary)', color:'var(--color-text-primary)', direction:'rtl', lineHeight:1.7 }}/>
                <div style={{ fontSize:10, color:'var(--color-text-tertiary)', marginTop:5, textAlign:'left' }}>{postBody.length} תווים</div>
              </div>

              <div style={{ ...card, padding:'14px 18px', marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:9 }}>קבוצות ({selGroups.length} נבחרו)</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {groups.slice(0,20).map(g => (
                    <button key={g.id} onClick={() => setSelGroups(p => p.includes(g.id) ? p.filter(id=>id!==g.id) : [...p,g.id])} style={pill(selGroups.includes(g.id))}>
                      {g.name.slice(0,28)}
                    </button>
                  ))}
                  {groups.length === 0 && <div style={{ fontSize:12, color:'var(--color-text-tertiary)' }}>סנכרן קבוצות תחילה</div>}
                </div>
              </div>

              <div style={{ ...card, padding:'14px 18px', marginBottom:18 }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:9, display:'flex', alignItems:'center', gap:7 }}><Calendar size={14}/> תזמון (אופציונלי)</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="datetime-local" value={schedAt} onChange={e => setSchedAt(e.target.value)} style={{ padding:'8px 10px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', fontSize:13, background:'var(--color-background-primary)', color:'var(--color-text-primary)' }}/>
                  {schedAt && <button onClick={() => setSchedAt('')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--color-text-secondary)' }}>✕</button>}
                </div>
              </div>

              {pubResult && (
                <div style={{ padding:'9px 14px', borderRadius:8, marginBottom:14, fontSize:13, background: pubResult.failed===0?'var(--color-background-success)':'var(--color-background-warning)', color: pubResult.failed===0?'var(--color-text-success)':'var(--color-text-warning)' }}>
                  {pubResult.published>0 && `✅ פורסם ב-${pubResult.published} קבוצות`}{pubResult.failed>0 && ` · ❌ נכשל ב-${pubResult.failed}`}
                </div>
              )}

              <button onClick={handlePublish} disabled={publishing||!postBody.trim()} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background: publishing||!postBody.trim() ? 'var(--color-border-secondary)' : 'var(--color-text-primary)', color:'var(--color-background-primary)', fontSize:14, fontWeight:500, cursor: publishing||!postBody.trim() ? 'default' : 'pointer' }}>
                {publishing ? 'מפרסם...' : schedAt ? '📅 תזמן פרסום' : '📢 פרסם עכשיו'}
              </button>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div style={{ maxWidth:460 }}>
              <div style={{ ...card, padding:22, marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:16 }}>פרטי חשבון</div>
                {[{ label:'שם', value:user?.name??'' },{ label:'אימייל', value:user?.email??'' }].map(f => (
                  <div key={f.label} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:4 }}>{f.label}</div>
                    <input defaultValue={f.value} style={{ width:'100%', padding:'8px 11px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', fontSize:13, background:'var(--color-background-primary)', color:'var(--color-text-primary)' }}/>
                  </div>
                ))}
              </div>
              <div style={{ ...card, padding:22 }}>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>תוכנית: <strong>{user?.plan ?? 'free'}</strong></div>
                <a href="/pricing" style={{ display:'inline-block', padding:'8px 18px', borderRadius:8, background:'var(--color-background-info)', color:'var(--color-text-info)', fontSize:13, fontWeight:500, textDecoration:'none' }}>שדרג תוכנית →</a>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
