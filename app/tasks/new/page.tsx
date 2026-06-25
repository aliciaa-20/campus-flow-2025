// FILE: app/tasks/new/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewTask() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', subject: '', deadline: '', phone: ''
  })
  const [studentId, setStudentId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('students')
        .select('id, name, phone')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setStudentId(data.id)
        setStudentName(data.name)
        setForm(f => ({ ...f, phone: data.phone || '' }))
      }
    }
    loadStudent()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          studentId,
          studentName,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create task')

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>➕ New Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Task Title</Label>
                <Input id="title" placeholder="e.g. ER Diagram Assignment"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="e.g. DBMS"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="datetime-local"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">WhatsApp Number (for reminder)</Label>
                <Input id="phone" placeholder="9876543210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required />
                <p className="text-xs text-muted-foreground">India numbers only. Don't include +91.</p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving & notifying n8n...' : 'Save & Set Reminder 🔔'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
