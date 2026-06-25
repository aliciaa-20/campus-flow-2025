// FILE: app/notice/page.tsx
'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export default function NoticePage() {
  const [noticeText, setNoticeText] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [phones, setPhones] = useState('') // comma separated
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold">📣 Notice Summarizer</h1>
          <p className="text-muted-foreground mt-1">Paste a college notice → AI creates a 3-bullet summary and broadcasts it on WhatsApp.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label>Notice Text</Label>
                <Textarea
                  placeholder="Paste the full notice text here..."
                  className="min-h-[140px] resize-none"
                  value={noticeText}
                  onChange={e => setNoticeText(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Event / Notice Title</Label>
                <Input placeholder="e.g. Mid-Semester Exam Schedule"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Event Date</Label>
                <Input type="datetime-local"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>WhatsApp Numbers (comma separated)</Label>
                <Input placeholder="9876543210, 9123456789"
                  value={phones}
                  onChange={e => setPhones(e.target.value)}
                  required />
                <p className="text-xs text-muted-foreground">India numbers, without +91</p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={loading}>
                {loading ? 'Summarising & Broadcasting...' : '📲 Summarise & Broadcast'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Summary result */}
        {sent && summary && (
          <Card className="mt-6 border-green-500">
            <CardHeader className="flex flex-row items-center gap-2">
              <CardTitle className="text-base">AI Summary</CardTitle>
              <Badge className="bg-green-500 text-white">Broadcast sent ✓</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line leading-relaxed">{summary}</p>
              <p className="text-xs text-muted-foreground mt-3">
                📅 Calendar event created · 📲 WhatsApp sent to {phones.split(',').length} number(s)
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
