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

export default function NewTask() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', subject: '', description: '', priority: 'medium',
    category: 'Assignment', deadline: '', phone: '', addToCalendar: true, reminder: true,
  })
  const [studentId, setStudentId]   = useState('demo-student-id')
  const [studentName, setStudentName] = useState('Aarush')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    const isDemo = document.cookie.includes('demo_bypass=true')
    if (isDemo) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('students').select('id,name,phone').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data) { setStudentId(data.id); setStudentName(data.name); setForm(f => ({ ...f, phone: data.phone || '' })) }
        })
    })
  }, [router])

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, studentId, studentName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create task')
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const deadlineDate = form.deadline ? new Date(form.deadline) : null
  const daysUntil = deadlineDate ? Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000) : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main className="page-enter" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 16, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-1)', margin: 0 }}>New Task</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Add a deadline with a WhatsApp reminder</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

            {/* LEFT — Task Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="cf-card" style={{ padding: '20px 22px' }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 18px', letterSpacing: '-0.01em' }}>Task Information</h2>

                {/* Title */}
                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Title</label>
                  <input className="cf-input" placeholder="e.g. ER Diagram Assignment" value={form.title}
                    onChange={e => set('title', e.target.value)} required />
                </div>

                {/* Subject */}
                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Subject</label>
                  <input className="cf-input" placeholder="e.g. DBMS" value={form.subject}
                    onChange={e => set('subject', e.target.value)} required />
                </div>

                {/* Description */}
                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Description <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
                  <textarea className="cf-input" placeholder="Additional notes about this task…"
                    rows={3} style={{ resize: 'none' }} value={form.description}
                    onChange={e => set('description', e.target.value)} />
                </div>

                {/* Priority */}
                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Priority</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {priorities.map(p => (
                      <button key={p.value} type="button"
                        onClick={() => set('priority', p.value)}
                        style={{
                          flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          border: form.priority === p.value ? `1.5px solid ${p.color}` : '1px solid var(--border)',
                          background: form.priority === p.value ? `${p.color}18` : 'transparent',
                          color: form.priority === p.value ? p.color : 'var(--text-3)',
                          transition: 'all 0.15s',
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
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          border: form.category === c ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                          background: form.category === c ? 'var(--accent-muted)' : 'transparent',
                          color: form.category === c ? 'var(--accent)' : 'var(--text-3)',
                          transition: 'all 0.15s',
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Deadline + Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Deadline */}
              <div className="cf-card" style={{ padding: '20px 22px' }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 16px' }}>Deadline</h2>

                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">Date & Time</label>
                  <input type="datetime-local" className="cf-input" value={form.deadline}
                    onChange={e => set('deadline', e.target.value)} required
                    style={{ colorScheme: 'dark' }} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="cf-label">WhatsApp Number</label>
                  <input className="cf-input" placeholder="9876543210" value={form.phone}
                    onChange={e => set('phone', e.target.value)} required />
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>India only. No +91.</p>
                </div>

                {/* Toggles */}
                {[
                  { key: 'addToCalendar', label: 'Add to Google Calendar' },
                  { key: 'reminder',      label: 'WhatsApp reminder (24h before)' },
                ].map(tog => (
                  <div key={tog.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{tog.label}</span>
                    <button type="button" onClick={() => set(tog.key, !(form as Record<string, boolean | string>)[tog.key])}
                      style={{
                        width: 36, height: 20, borderRadius: 99, border: 'none', cursor: 'pointer',
                        background: (form as Record<string, boolean | string>)[tog.key] ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                      }}>
                      <div style={{
                        position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s',
                        left: (form as Record<string, boolean | string>)[tog.key] ? 18 : 2,
                      }} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Preview card */}
              {form.title && (
                <div className="cf-card" style={{ padding: '16px 18px' }}>
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
                  ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Saving task…</>
                  : 'Save Task'}
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
