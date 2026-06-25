'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

interface Notice {
  id: number; title: string; department: string; date: string; unread: boolean; pinned: boolean; summary?: string
}

const SAMPLE_NOTICES: Notice[] = [
  { id: 1, title: 'Mid-Semester Examination Schedule — July 2026', department: 'Examination Cell',   date: '2026-06-24', unread: true,  pinned: true  },
  { id: 2, title: 'Fee Payment Deadline Extended to 30th June',   department: 'Finance Office',      date: '2026-06-23', unread: true,  pinned: false },
  { id: 3, title: 'Workshop on AI & ML — Registration Open',      department: 'CSE Department',      date: '2026-06-22', unread: false, pinned: false },
  { id: 4, title: 'Library Timings Updated for Exam Season',      department: 'Central Library',     date: '2026-06-21', unread: false, pinned: false },
  { id: 5, title: 'Sports Day Registration — Last Date July 1',   department: 'Sports Committee',    date: '2026-06-20', unread: false, pinned: false },
]

export default function NoticePage() {
  const [noticeText, setNoticeText] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate,  setEventDate]  = useState('')
  const [phones,     setPhones]     = useState('')
  const [summary,    setSummary]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [sent,       setSent]       = useState(false)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState<'all' | 'unread' | 'pinned'>('all')
  const [notices,    setNotices]    = useState<Notice[]>(SAMPLE_NOTICES)
  const [selected,   setSelected]   = useState<Notice | null>(null)
  const [compose,    setCompose]    = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setSent(false); setSummary('')
    const phoneList = phones.split(',').map(p => p.trim()).filter(Boolean)
    try {
      const res  = await fetch('/api/notice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noticeText, eventTitle, eventDate, phoneList }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSummary(data.summary); setSent(true)
      if (selected) {
        setNotices(ns => ns.map(n => n.id === selected.id ? { ...n, summary: data.summary, unread: false } : n))
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Something went wrong') }
    finally { setLoading(false) }
  }

  const markRead = (id: number) => setNotices(ns => ns.map(n => n.id === id ? { ...n, unread: false } : n))
  const pin      = (id: number) => setNotices(ns => ns.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))

  const filtered = notices
    .filter(n => filter === 'unread' ? n.unread : filter === 'pinned' ? n.pinned : true)
    .filter(n => search === '' || n.title.toLowerCase().includes(search.toLowerCase()) || n.department.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main className="page-enter" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-1)', margin: 0 }}>Notice Board</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Summarize and broadcast college notices with AI</p>
          </div>
          <button className="cf-btn-primary" onClick={() => { setCompose(true); setSelected(null) }} style={{ fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Notice
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>

          {/* LEFT — Inbox list */}
          <div className="cf-card" style={{ overflow: 'hidden' }}>
            {/* Search */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input className="cf-input" placeholder="Search notices…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 30, fontSize: 12.5 }} />
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {(['all', 'unread', 'pinned'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{
                    flex: 1, padding: '9px 0', fontSize: 11.5, fontWeight: 500, border: 'none', background: 'transparent',
                    cursor: 'pointer', color: filter === f ? 'var(--text-1)' : 'var(--text-3)',
                    borderBottom: filter === f ? '2px solid var(--accent)' : '2px solid transparent',
                    marginBottom: -1, textTransform: 'capitalize', transition: 'color 0.15s',
                  }}>
                  {f} {f === 'unread' && notices.filter(n => n.unread).length > 0 && <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, padding: '1px 5px', borderRadius: 99, marginLeft: 4 }}>{notices.filter(n => n.unread).length}</span>}
                </button>
              ))}
            </div>

            {/* Notice list */}
            <div>
              {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-3)', fontSize: 13 }}>No notices found.</p>
              ) : (
                filtered.map((n, idx) => (
                  <div key={n.id}
                    onClick={() => { setSelected(n); setCompose(false); markRead(n.id); setSent(false); setSummary(''); setError(''); setNoticeText(''); setEventTitle(''); setEventDate(''); setPhones('') }}
                    style={{
                      padding: '13px 16px',
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer', transition: 'background 0.15s',
                      background: selected?.id === n.id ? 'rgba(124,92,255,0.08)' : 'transparent',
                      borderLeft: selected?.id === n.id ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                    onMouseEnter={e => { if (selected?.id !== n.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { if (selected?.id !== n.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      {n.unread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 5 }} />}
                      {!n.unread && <div style={{ width: 6, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          {n.pinned && <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--accent)" stroke="none"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>}
                          <p style={{ fontSize: 12.5, fontWeight: n.unread ? 600 : 400, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.title}
                          </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{n.department}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — Detail / Compose */}
          <div>
            {/* Compose mode */}
            {compose && (
              <div className="cf-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Summarise & Broadcast</h2>
                  <button className="cf-btn-secondary" onClick={() => setCompose(false)} style={{ fontSize: 11, padding: '4px 10px' }}>Cancel</button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label className="cf-label">Notice Title</label>
                      <input className="cf-input" placeholder="e.g. Mid-Semester Exam Schedule" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label className="cf-label">Event Date & Time</label>
                      <input type="datetime-local" className="cf-input" value={eventDate} onChange={e => setEventDate(e.target.value)} required style={{ colorScheme: 'dark' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="cf-label">Full Notice Text</label>
                    <textarea className="cf-input" placeholder="Paste the full notice text here…" rows={5} style={{ resize: 'none' }} value={noticeText} onChange={e => setNoticeText(e.target.value)} required />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label className="cf-label">WhatsApp Numbers <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(comma separated)</span></label>
                    <input className="cf-input" placeholder="9876543210, 9123456789" value={phones} onChange={e => setPhones(e.target.value)} required />
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>India numbers only, no +91.</p>
                  </div>

                  {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,90,95,0.1)', border: '1px solid rgba(255,90,95,0.2)', fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

                  <button type="submit" className="cf-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 13, fontWeight: 600, borderRadius: 10 }}>
                    {loading
                      ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Summarising…</>
                      : 'Summarise & Broadcast'}
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </button>

                  {sent && summary && (
                    <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: 'rgba(24,201,100,0.06)', border: '1px solid rgba(24,201,100,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>AI Summary</span>
                        <span style={{ fontSize: 10, background: 'rgba(24,201,100,0.15)', color: 'var(--success)', padding: '2px 8px', borderRadius: 99 }}>Broadcast sent</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{summary}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>Sent to {phones.split(',').filter(Boolean).length} number{phones.split(',').filter(Boolean).length !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Notice detail view */}
            {selected && !compose && (
              <div className="cf-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 6px', lineHeight: 1.4 }}>{selected.title}</h2>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{selected.department}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="cf-btn-secondary" onClick={() => pin(selected.id)} style={{ fontSize: 11, padding: '4px 10px' }}>
                        {selected.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button className="cf-btn-primary" onClick={() => setCompose(true)} style={{ fontSize: 11, padding: '4px 12px' }}>
                        Summarise with AI
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '24px 20px' }}>
                  {selected.summary ? (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>AI Summary</p>
                      <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selected.summary}</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 8px' }}>No summary yet</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>Click "Summarise with AI" to generate a 3-bullet summary and broadcast it.</p>
                      <button className="cf-btn-primary" onClick={() => setCompose(true)} style={{ fontSize: 12 }}>
                        Summarise & Broadcast
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!selected && !compose && (
              <div className="cf-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5"><path d="M4 4h16v12H4z"/><path d="M4 4l8 8 8-8"/></svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 8px' }}>Select a notice</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Choose a notice from the left to view details, or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
