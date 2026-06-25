'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const priorities = [
  { value: 'high',   label: 'High',   color: '#FF5A5F' },
  { value: 'medium', label: 'Medium', color: '#FFB224' },
  { value: 'low',    label: 'Low',    color: '#18C964' },
]
const categories = ['Assignment', 'Exam', 'Lab', 'Project', 'Viva', 'Other']
const reminderOptions = [
  { label: '1 hour before',  value: 1  },
  { label: '6 hours before', value: 6  },
  { label: '12 hours before',value: 12 },
  { label: '24 hours before',value: 24 },
  { label: '2 days before',  value: 48 },
]

interface SubmitResult {
  whatsapp: { status: string; sid: string }
  n8n:      string
  calendar: string
}

export default function NewTask() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', subject: '', description: '', priority: 'medium',
    category: 'Assignment', deadline: '', phone: '',
    addToCalendar: true, reminder: true, reminderOffset: 24,
  })
  const [studentId,   setStudentId]   = useState('demo-student-id')
  const [studentName, setStudentName] = useState('Student')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [result,   setResult]   = useState<SubmitResult | null>(null)

  useEffect(() => {
    const isDemo = typeof document !== 'undefined' && document.cookie.includes('demo_bypass=true')
    if (isDemo) { setStudentId('3ac18521-7b35-440b-8d89-c5b808f235c0'); setStudentName('Aarush'); setForm(f => ({ ...f, phone: '7259950257' })); return }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('students').select('id,name,phone').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data) { setStudentId(data.id); setStudentName(data.name); setForm(f => ({ ...f, phone: data.phone || '' })) }
        })
    })
  }, [router])

  const set = (k: string, v: string | boolean | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null)
    try {
      const res  = await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          studentId, studentName,
          reminderOffset: form.reminder ? form.reminderOffset : 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create task')
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const deadlineDate = form.deadline ? new Date(form.deadline) : null
  const daysUntil    = deadlineDate ? Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000) : null

  // Success screen
  if (result) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 500, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        {/* Success icon */}
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(24,201,100,0.1)', border: '2px solid rgba(24,201,100,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>Task saved!</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 28px' }}>{form.title} has been added to your deadlines.</p>

        {/* Status chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {/* WhatsApp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: result.whatsapp.status === 'sent' ? 'rgba(24,201,100,0.06)' : 'rgba(255,90,95,0.06)', border: `1px solid ${result.whatsapp.status === 'sent' ? 'rgba(24,201,100,0.2)' : 'rgba(255,90,95,0.2)'}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={result.whatsapp.status === 'sent' ? 'var(--success)' : 'var(--danger)'} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>WhatsApp</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
                {result.whatsapp.status === 'sent' ? `Confirmation sent to +91 ${form.phone}` : 'Delivery pending — check Twilio sandbox'}
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: result.whatsapp.status === 'sent' ? 'var(--success)' : 'var(--danger)' }}>
              {result.whatsapp.status === 'sent' ? '✓ Sent' : '! Failed'}
            </span>
          </div>

          {/* Calendar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: result.n8n === 'ok' ? 'rgba(24,201,100,0.06)' : 'rgba(255,178,36,0.06)', border: `1px solid ${result.n8n === 'ok' ? 'rgba(24,201,100,0.2)' : 'rgba(255,178,36,0.2)'}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={result.n8n === 'ok' ? 'var(--success)' : 'var(--warning)'} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Google Calendar</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
                {result.n8n === 'ok' ? 'Event created via n8n workflow' : 'n8n not configured — set N8N_DEADLINE_WEBHOOK'}
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: result.n8n === 'ok' ? 'var(--success)' : 'var(--warning)' }}>
              {result.n8n === 'ok' ? '✓ Done' : '~ Skip'}
            </span>
          </div>

          {/* Reminder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Reminder scheduled</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
                {reminderOptions.find(r => r.value === form.reminderOffset)?.label || '24 hours before'} deadline
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>✓ Set</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="cf-btn-secondary" onClick={() => { setResult(null); setForm(f => ({ ...f, title: '', subject: '', description: '', deadline: '' })) }} style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>
            Add Another
          </button>
          <button className="cf-btn-primary" onClick={() => { window.location.href = '/dashboard' }} style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>
            Go to Dashboard
          </button>
        </div>
      </main>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main className="page-enter" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 16, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-1)', margin: 0 }}>New Task</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Set a deadline — get a WhatsApp reminder + Google Calendar event automatically.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

            {/* LEFT — Task details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="cf-card" style={{ padding: '20px 22px' }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 18px' }}>Task Details</h2>

                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Title *</label>
                  <input className="cf-input" placeholder="e.g. ER Diagram Assignment" value={form.title} onChange={e => set('title', e.target.value)} required />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Subject *</label>
                  <input className="cf-input" placeholder="e.g. DBMS" value={form.subject} onChange={e => set('subject', e.target.value)} required />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Description <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
                  <textarea className="cf-input" placeholder="Additional notes…" rows={3} style={{ resize: 'none' }} value={form.description} onChange={e => set('description', e.target.value)} />
                </div>

                {/* Priority */}
                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Priority</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {priorities.map(p => (
                      <button key={p.value} type="button" onClick={() => set('priority', p.value)}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                          border: form.priority === p.value ? `1.5px solid ${p.color}` : '1px solid var(--border)',
                          background: form.priority === p.value ? `${p.color}18` : 'transparent',
                          color: form.priority === p.value ? p.color : 'var(--text-3)',
                        }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="cf-label">Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {categories.map(c => (
                      <button key={c} type="button" onClick={() => set('category', c)}
                        style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                          border: form.category === c ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                          background: form.category === c ? 'var(--accent-muted)' : 'transparent',
                          color: form.category === c ? 'var(--accent)' : 'var(--text-3)',
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Scheduling */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cf-card" style={{ padding: '20px 22px' }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 16px' }}>Scheduling</h2>

                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Deadline *</label>
                  <input type="datetime-local" className="cf-input" value={form.deadline} onChange={e => set('deadline', e.target.value)} required style={{ colorScheme: 'dark' }} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">WhatsApp Number</label>
                  <input className="cf-input" placeholder="9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>Auto-filled from your profile. India only, no +91.</p>
                </div>

                {/* Reminder Time Selector */}
                <div style={{ marginBottom: 6 }}>
                  <label className="cf-label">Reminder Time</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {reminderOptions.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => set('reminderOffset', opt.value)}
                        style={{
                          padding: '8px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          border: form.reminderOffset === opt.value ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                          background: form.reminderOffset === opt.value ? 'var(--accent-muted)' : 'transparent',
                          color: form.reminderOffset === opt.value ? 'var(--accent)' : 'var(--text-2)',
                          transition: 'all 0.15s', textAlign: 'left',
                        }}>
                        {opt.label}
                        {form.reminderOffset === opt.value && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                {[
                  { key: 'addToCalendar', label: 'Add to Google Calendar', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                  { key: 'reminder',      label: 'Send WhatsApp reminder',  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                ].map(tog => (
                  <div key={tog.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-3)' }}>{tog.icon}</span>
                      {tog.label}
                    </span>
                    <button type="button" onClick={() => set(tog.key, !(form as Record<string, boolean | string | number>)[tog.key])}
                      style={{ width: 36, height: 20, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                        background: (form as Record<string, boolean | string | number>)[tog.key] ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                      }}>
                      <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                        left: (form as Record<string, boolean | string | number>)[tog.key] ? 18 : 2,
                      }} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Live preview */}
              {form.title && (
                <div className="cf-card" style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Preview</p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorities.find(p => p.value === form.priority)?.color || '#7C5CFF', marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)', margin: 0 }}>{form.title}</p>
                      {form.subject && <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '3px 0 0' }}>{form.subject} · {form.category}</p>}
                      {deadlineDate && (
                        <p style={{ fontSize: 12, color: daysUntil !== null && daysUntil <= 1 ? '#FF5A5F' : 'var(--text-3)', margin: '3px 0 0' }}>
                          {daysUntil !== null && daysUntil >= 0 ? `${daysUntil}d left` : 'Overdue'} — {deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
                        {form.addToCalendar && <span style={{ fontSize: 10, background: 'rgba(24,201,100,0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: 99 }}>📅 Calendar</span>}
                        {form.reminder && <span style={{ fontSize: 10, background: 'rgba(124,92,255,0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99 }}>🔔 {reminderOptions.find(r => r.value === form.reminderOffset)?.label}</span>}
                        {form.phone && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--text-3)', padding: '2px 8px', borderRadius: 99 }}>💬 +91{form.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,90,95,0.1)', border: '1px solid rgba(255,90,95,0.2)', fontSize: 12, color: '#FF5A5F' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="cf-btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 13.5, fontWeight: 600, borderRadius: 12 }}>
                {loading
                  ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Saving & notifying…</>
                  : 'Save Task + Send WhatsApp'}
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
