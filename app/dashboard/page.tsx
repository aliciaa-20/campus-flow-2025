'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Task {
  id: string; title: string; subject: string; deadline: string; add_to_calendar: boolean
}

const DEMO_TASKS: Task[] = [
  { id: '1', title: 'ER Diagram Assignment',        subject: 'DBMS',              deadline: new Date(Date.now() + 1 * 86400000).toISOString(), add_to_calendar: true  },
  { id: '2', title: 'OS Process Scheduling Report', subject: 'Operating Systems', deadline: new Date(Date.now() + 3 * 86400000).toISOString(), add_to_calendar: false },
  { id: '3', title: 'TCP/IP Subnet Design',         subject: 'Computer Networks', deadline: new Date(Date.now() + 7 * 86400000).toISOString(), add_to_calendar: true  },
  { id: '4', title: 'ML Linear Regression Project', subject: 'Machine Learning',  deadline: new Date(Date.now() - 1 * 86400000).toISOString(), add_to_calendar: true  },
]

function getDeadlineInfo(dt: string) {
  const diff = Math.ceil((new Date(dt).getTime() - Date.now()) / 86400000)
  if (diff < 0)   return { label: 'Overdue',     color: '#FF5A5F', pct: 100 }
  if (diff === 0) return { label: 'Due today',   color: '#FF5A5F', pct: 95  }
  if (diff === 1) return { label: 'Due tomorrow',color: '#FFB224', pct: 80  }
  if (diff <= 3)  return { label: `${diff}d left`,color: '#FFB224', pct: 60 }
  return               { label: `${diff}d left`, color: '#18C964', pct: Math.max(10, 100 - diff * 8) }
}

const quickActions = [
  { href: '/tasks/new', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>, label: 'New Task' },
  { href: '/notice',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H4z"/><path d="M4 4l8 8 8-8"/></svg>,       label: 'Import Notice' },
  { href: '/study',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>, label: 'Flashcards' },
  { href: '#',          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: 'Calendar' },
  { href: '/study',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Study Session' },
]

const statCards = [
  { label: "Today's Deadlines", getValue: (tasks: Task[]) => tasks.filter(t => { const d = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000); return d >= 0 && d <= 0 }).length, color: '#FF5A5F', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { label: 'Upcoming Exams',    getValue: (tasks: Task[]) => tasks.filter(t => new Date(t.deadline) > new Date()).length, color: '#7C5CFF', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'Study Hours',       getValue: () => 4,  color: '#18C964', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { label: 'Streak',            getValue: () => 7,  color: '#FFB224', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
]

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks]       = useState<Task[]>([])
  const [userName, setUserName] = useState('there')
  const [loading, setLoading]   = useState(true)
  const [isDemo, setIsDemo]     = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: student } = await supabase.from('students').select('name, id').eq('user_id', user.id).single()
        if (student) {
          setUserName(student.name)
          const { data: td } = await supabase.from('tasks').select('*').eq('student_id', student.id).order('deadline', { ascending: true })
          setTasks(td || [])
        } else {
          setUserName(user.email?.split('@')[0] || 'there')
        }
        setLoading(false); return
      }
      if (document.cookie.includes('demo_bypass=true')) {
        setIsDemo(true); setUserName('Aarush'); setTasks(DEMO_TASKS); setLoading(false); return
      }
      router.push('/login')
    }
    load()
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(124,92,255,0.3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading your workspace…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const upcomingTasks = tasks.filter(t => new Date(t.deadline) > new Date())
  const overdueTasks  = tasks.filter(t => new Date(t.deadline) < new Date())

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main className="page-enter" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Top header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <p style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>{today}</p>
            {isDemo && <span className="cf-badge cf-badge-accent" style={{ fontSize: 10 }}>Demo Mode</span>}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-1)', margin: 0 }}>
            {greeting}, {userName}.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
            {upcomingTasks.length > 0
              ? `You have ${upcomingTasks.length} upcoming deadline${upcomingTasks.length !== 1 ? 's' : ''}${overdueTasks.length > 0 ? ` and ${overdueTasks.length} overdue` : ''}.`
              : 'You\'re all caught up. Great work!'}
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {statCards.map((s, i) => (
            <div key={i} className="cf-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</span>
                <span style={{ color: s.color, opacity: 0.8 }}>{s.icon}</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>
                {s.getValue(tasks)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* LEFT — 70% */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Upcoming deadlines */}
            <div className="cf-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Upcoming Deadlines</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{tasks.length} tasks tracked</p>
                </div>
                <Link href="/tasks/new" style={{ textDecoration: 'none' }}>
                  <button className="cf-btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Task
                  </button>
                </Link>
              </div>

              {tasks.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>No deadlines yet. Add one to get started.</p>
                </div>
              ) : (
                <div>
                  {tasks.map((task, idx) => {
                    const info = getDeadlineInfo(task.deadline)
                    return (
                      <div
                        key={task.id}
                        style={{
                          padding: '14px 20px',
                          borderBottom: idx < tasks.length - 1 ? '1px solid var(--border)' : 'none',
                          display: 'flex', alignItems: 'center', gap: 16,
                          transition: 'background 0.15s', cursor: 'default',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        {/* Priority dot */}
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, flexShrink: 0 }} />

                        {/* Task info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.title}
                            </p>
                            <span className="cf-badge cf-badge-muted" style={{ flexShrink: 0 }}>{task.subject}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="cf-progress-track" style={{ width: '100%', maxWidth: 200 }}>
                            <div className="cf-progress-fill" style={{ width: `${info.pct}%`, background: info.color }} />
                          </div>
                        </div>

                        {/* Due time */}
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: info.color, margin: 0 }}>{info.label}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
                            {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>

                        {/* Three-dot */}
                        <button style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent notices placeholder */}
            <div className="cf-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Recent Notices</h2>
                <Link href="/notice" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all</Link>
              </div>
              <Link href="/notice" style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M4 4h16v12H4z"/><path d="M4 4l8 8 8-8"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', margin: 0 }}>Open Notice Board</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>Broadcast and summarize college notices with AI</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>
            </div>
          </div>

          {/* RIGHT — 30% */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* AI Suggestion */}
            <div className="cf-card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>Today's Focus</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                {upcomingTasks.length > 0
                  ? `Start with "${upcomingTasks[0].title}" — it's due soonest. Consider generating flashcards for ${upcomingTasks[0].subject} to review while working.`
                  : 'No urgent deadlines. Great time to get ahead — generate flashcards for a subject you want to master.'}
              </p>
              <Link href="/study" style={{ textDecoration: 'none' }}>
                <button className="cf-btn-secondary" style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontSize: 12 }}>
                  Open Study Buddy
                </button>
              </Link>
            </div>

            {/* Study progress */}
            <div className="cf-card" style={{ padding: '16px 18px' }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 14px' }}>Study Progress</h3>
              {[
                { subject: 'DBMS', pct: 72, color: '#7C5CFF' },
                { subject: 'Networks', pct: 48, color: '#18C964' },
                { subject: 'OS', pct: 30, color: '#FFB224' },
              ].map(s => (
                <div key={s.subject} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.subject}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.pct}%</span>
                  </div>
                  <div className="cf-progress-track">
                    <div className="cf-progress-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="cf-card" style={{ padding: '16px 18px' }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 10px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {quickActions.map((a, i) => (
                  <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <span style={{ color: 'var(--text-3)', display: 'flex', flexShrink: 0 }}>{a.icon}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{a.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
