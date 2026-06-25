'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Task {
  id: string; title: string; subject: string; deadline: string; add_to_calendar: boolean; reminder_time?: string
}
interface Student {
  id: string; name: string; branch?: string; year?: number; phone?: string; subjects?: string
}

const DEMO_TASKS: Task[] = [
  { id: '1', title: 'ER Diagram Assignment',        subject: 'DBMS',              deadline: new Date(Date.now() + 1  * 86400000).toISOString(), add_to_calendar: true  },
  { id: '2', title: 'OS Process Scheduling Report', subject: 'Operating Systems', deadline: new Date(Date.now() + 3  * 86400000).toISOString(), add_to_calendar: false },
  { id: '3', title: 'TCP/IP Subnet Design',         subject: 'Computer Networks', deadline: new Date(Date.now() + 7  * 86400000).toISOString(), add_to_calendar: true  },
  { id: '4', title: 'ML Linear Regression Project', subject: 'Machine Learning',  deadline: new Date(Date.now() - 1  * 86400000).toISOString(), add_to_calendar: true  },
  { id: '5', title: 'Cryptography Assignment',      subject: 'Network Security',  deadline: new Date(Date.now() + 0.3 * 86400000).toISOString(), add_to_calendar: true  },
]
const DEMO_STUDENT: Student = { id: 'demo', name: 'Aarush', branch: 'CSE', year: 3, phone: '7259950257', subjects: 'DBMS, OS, CN, ML' }

function getDeadlineInfo(dt: string) {
  const diff = (new Date(dt).getTime() - Date.now()) / 86400000
  if (diff < 0)   return { label: 'Overdue',       color: '#FF5A5F', pct: 100, urgent: true  }
  if (diff < 0.5) return { label: 'Due today',     color: '#FF5A5F', pct: 95,  urgent: true  }
  if (diff < 1)   return { label: 'Due tomorrow',  color: '#FFB224', pct: 80,  urgent: false }
  if (diff <= 3)  return { label: `${Math.ceil(diff)}d left`, color: '#FFB224', pct: 60, urgent: false }
  return               { label: `${Math.ceil(diff)}d left`,  color: '#18C964', pct: Math.max(10, 100 - diff * 8), urgent: false }
}

const AI_TIPS = [
  'Start with the hardest task when your energy is highest — usually morning.',
  'Use the Pomodoro method: 25 min focus, 5 min break. Try it with Study Buddy flashcards.',
  'Review your notes within 24 hours to retain 80% more. Generate flashcards now.',
  'Break your upcoming deadline into 3 daily milestones — it removes the overwhelm.',
  'Teaching a concept to someone else is the fastest way to master it.',
]

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks]       = useState<Task[]>([])
  const [student, setStudent]   = useState<Student | null>(null)
  const [loading, setLoading]   = useState(true)
  const [isDemo, setIsDemo]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [aiTip]                 = useState(() => AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today    = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: s } = await supabase.from('students').select('id,name,branch,year,phone,subjects').eq('user_id', user.id).single()
      if (s) {
        setStudent(s)
        const { data: td } = await supabase.from('tasks').select('*').eq('student_id', s.id).order('deadline', { ascending: true })
        setTasks(td || [])
      } else {
        // Logged in but no profile — send to register Step 2
        window.location.href = '/register'
        return
      }
      setLoading(false); return
    }
    if (typeof document !== 'undefined' && document.cookie.includes('demo_bypass=true')) {
      setIsDemo(true); setStudent(DEMO_STUDENT); setTasks(DEMO_TASKS); setLoading(false); return
    }
    router.push('/login')
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async (taskId: string) => {
    setDeleting(taskId)
    setTasks(t => t.filter(x => x.id !== taskId)) // optimistic
    try {
      await fetch(`/api/tasks?taskId=${taskId}`, { method: 'DELETE' })
    } catch { loadData() } // revert on fail
    finally { setDeleting(null) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(124,92,255,0.3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading your workspace…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const now           = new Date()
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd      = new Date(todayStart.getTime() + 86400000)
  const todayTasks    = tasks.filter(t => { const d = new Date(t.deadline); return d >= todayStart && d < todayEnd })
  const upcomingTasks = tasks.filter(t => new Date(t.deadline) > now)
  const overdueTasks  = tasks.filter(t => new Date(t.deadline) < now)

  // Derive subjects for Study Progress
  const subjectList = student?.subjects
    ? student.subjects.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4)
    : tasks.map(t => t.subject).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)
  const subjectColors = ['#7C5CFF', '#18C964', '#FFB224', '#FF5A5F']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main className="page-enter" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{today}</p>
            {isDemo && <span className="cf-badge cf-badge-accent" style={{ fontSize: 10 }}>Demo Mode</span>}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-1)', margin: 0 }}>
            {greeting}, {student?.name || 'there'}.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
            {upcomingTasks.length > 0
              ? `${upcomingTasks.length} upcoming deadline${upcomingTasks.length !== 1 ? 's' : ''}${overdueTasks.length > 0 ? ` · ${overdueTasks.length} overdue` : ''}.`
              : "You're all caught up. Great work!"}
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: "Today's Deadlines", value: todayTasks.length,    color: '#FF5A5F',
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Pending Tasks',     value: upcomingTasks.length, color: '#7C5CFF',
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
            { label: 'Overdue',           value: overdueTasks.length,  color: overdueTasks.length > 0 ? '#FF5A5F' : '#18C964',
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
            { label: 'Total Tracked',     value: tasks.length,         color: '#FFB224',
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
          ].map((s, i) => (
            <div key={i} className="cf-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</span>
                <span style={{ color: s.color, opacity: 0.8 }}>{s.icon}</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Today's Schedule */}
            {todayTasks.length > 0 && (
              <div className="cf-card" style={{ overflow: 'hidden', border: '1px solid rgba(255,90,95,0.2)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,90,95,0.15)', background: 'rgba(255,90,95,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5A5F', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <h2 style={{ fontSize: 13, fontWeight: 600, color: '#FF5A5F', margin: 0 }}>Due Today</h2>
                  <span style={{ fontSize: 11, background: 'rgba(255,90,95,0.15)', color: '#FF5A5F', padding: '2px 8px', borderRadius: 99 }}>{todayTasks.length}</span>
                  <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                </div>
                {todayTasks.map(task => (
                  <div key={task.id} style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5A5F', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{task.subject} · Due {new Date(task.deadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(255,90,95,0.12)', color: '#FF5A5F', padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>Today</span>
                  </div>
                ))}
              </div>
            )}

            {/* All Deadlines */}
            <div className="cf-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>All Deadlines</h2>
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
                  <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '0 0 14px' }}>No deadlines yet.</p>
                  <Link href="/tasks/new"><button className="cf-btn-primary" style={{ fontSize: 12 }}>Add your first task</button></Link>
                </div>
              ) : (
                <div>
                  {tasks.map((task, idx) => {
                    const info = getDeadlineInfo(task.deadline)
                    return (
                      <div key={task.id} style={{
                        padding: '14px 20px', borderBottom: idx < tasks.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.15s',
                        background: info.urgent ? 'rgba(255,90,95,0.03)' : 'transparent',
                      }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = info.urgent ? 'rgba(255,90,95,0.06)' : 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = info.urgent ? 'rgba(255,90,95,0.03)' : 'transparent'}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                            <span className="cf-badge cf-badge-muted" style={{ flexShrink: 0 }}>{task.subject}</span>
                            {task.add_to_calendar && (
                              <span title="Added to Calendar" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              </span>
                            )}
                          </div>
                          <div className="cf-progress-track" style={{ width: '100%', maxWidth: 180 }}>
                            <div className="cf-progress-fill" style={{ width: `${info.pct}%`, background: info.color }} />
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: info.color, margin: 0 }}>{info.label}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
                            {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={deleting === task.id}
                          title="Delete task"
                          style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: deleting === task.id ? 0.4 : 1, transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FF5A5F'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Notice Board link */}
            <div className="cf-card" style={{ padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Notice Board</h2>
                <Link href="/notice" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Open →</Link>
              </div>
              <Link href="/notice" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '11px 13px', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M4 4h16v12H4z"/><path d="M4 4l8 8 8-8"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', margin: 0 }}>Summarise & Broadcast</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>AI-powered notice summaries via WhatsApp</p>
                  </div>
                  <svg style={{ marginLeft: 'auto' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Student profile card */}
            {student && (
              <div className="cf-card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{student.name}</p>
                    {student.branch && student.year && (
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>{student.branch} · Year {student.year}</p>
                    )}
                  </div>
                </div>
                {student.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>WhatsApp: +91 {student.phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* AI Tip of the Day */}
            <div className="cf-card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>AI Tip of the Day</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, margin: '0 0 10px' }}>{aiTip}</p>
              {upcomingTasks.length > 0 && (
                <div style={{ padding: '9px 11px', borderRadius: 8, background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.15)' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Focus:</span>{' '}
                    "{upcomingTasks[0].title}" is due soonest. Tackle it first.
                  </p>
                </div>
              )}
              <Link href="/study" style={{ textDecoration: 'none' }}>
                <button className="cf-btn-secondary" style={{ marginTop: 10, width: '100%', justifyContent: 'center', fontSize: 12 }}>Open Study Buddy</button>
              </Link>
            </div>

            {/* Study Progress (from user's subjects) */}
            {subjectList.length > 0 && (
              <div className="cf-card" style={{ padding: '16px 18px' }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 14px' }}>Your Subjects</h3>
                {subjectList.map((sub, i) => {
                  // Derive % from task urgency for this subject
                  const subTasks = tasks.filter(t => t.subject.toLowerCase().includes(sub.toLowerCase()))
                  const pct = subTasks.length > 0
                    ? Math.min(95, Math.max(10, 100 - Math.ceil((new Date(subTasks[0].deadline).getTime() - Date.now()) / 86400000) * 5))
                    : 30 + i * 15
                  return (
                    <div key={sub} style={{ marginBottom: i < subjectList.length - 1 ? 12 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{sub}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{pct}%</span>
                      </div>
                      <div className="cf-progress-track">
                        <div className="cf-progress-fill" style={{ width: `${pct}%`, background: subjectColors[i % 4] }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="cf-card" style={{ padding: '16px 18px' }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 10px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { href: '/tasks/new', label: 'New Task',    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
                  { href: '/study',     label: 'Flashcards',  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
                  { href: '/notice',    label: 'Notice Board', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H4z"/><path d="M4 4l8 8 8-8"/></svg> },
                  { href: '/study',     label: 'Generate MCQ', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
                ].map((a, i) => (
                  <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '8px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
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
