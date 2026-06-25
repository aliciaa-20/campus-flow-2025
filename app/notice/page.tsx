// FILE: app/notice/page.tsx
'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

export default function NoticePage() {
  const [noticeText, setNoticeText] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [phones, setPhones] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSent(false); setSummary('')

    const phoneList = phones.split(',').map(p => p.trim()).filter(Boolean)

    try {
      const res = await fetch('/api/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noticeText, eventTitle, eventDate, phoneList }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSummary(data.summary)
      setSent(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">📣 Notice Summarizer</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Paste a college notice → AI creates a 3-bullet summary → broadcasts on WhatsApp.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Notice Text */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Notice Text</label>
              <textarea
                placeholder="Paste the full notice text here..."
                className="w-full min-h-[140px] resize-none bg-background border border-input rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                value={noticeText}
                onChange={e => setNoticeText(e.target.value)}
                required
              />
            </div>

            {/* Event Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Event / Notice Title</label>
              <input
                type="text"
                placeholder="e.g. Mid-Semester Exam Schedule"
                className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                required
              />
            </div>

            {/* Event Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Event Date & Time</label>
              <input
                type="datetime-local"
                className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                required
              />
            </div>

            {/* Phone Numbers */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">WhatsApp Numbers</label>
              <input
                type="text"
                placeholder="9876543210, 9123456789"
                className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                value={phones}
                onChange={e => setPhones(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">India numbers only, without +91. Comma-separated.</p>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-glow text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Summarising & Broadcasting...</>
              ) : '📲 Summarise & Broadcast'}
            </button>
          </form>
        </div>

        {/* Result */}
        {sent && summary && (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/20 bg-emerald-500/10">
              <span className="text-sm font-semibold text-emerald-600">✅ AI Summary</span>
              <span className="text-xs font-medium bg-emerald-500 text-white px-2.5 py-1 rounded-full">
                Broadcast sent ✓
              </span>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm whitespace-pre-line leading-relaxed">{summary}</p>
              <p className="text-xs text-muted-foreground mt-4">
                📅 Calendar event created · 📲 WhatsApp sent to {phones.split(',').filter(Boolean).length} number{phones.split(',').filter(Boolean).length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
