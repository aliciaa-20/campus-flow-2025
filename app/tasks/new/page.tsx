// FILE: app/tasks/new/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function NewTask() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', subject: '', deadline: '', phone: '' })
  const [studentId, setStudentId] = useState('demo-student-id')
  const [studentName, setStudentName] = useState('Aarush')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const isDemo = document.cookie.includes('demo_bypass=true')
    if (isDemo) return // use demo defaults above

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
        body: JSON.stringify({ ...form, studentId, studentName }),
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

  const fields = [
    { key: 'title', label: 'Task Title', placeholder: 'e.g. ER Diagram Assignment', type: 'text' },
    { key: 'subject', label: 'Subject', placeholder: 'e.g. DBMS', type: 'text' },
    { key: 'deadline', label: 'Deadline', placeholder: '', type: 'datetime-local' },
    { key: 'phone', label: 'WhatsApp Number (for reminder)', placeholder: '9876543210', type: 'text' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Back link */}
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors">
          ← Back to Dashboard
        </Link>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold tracking-tight">➕ New Deadline</h1>
            <p className="text-xs text-muted-foreground mt-1">Fill in the details — you'll get a WhatsApp reminder 24 hours before.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {fields.map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{f.label}</label>
                <input
                  id={f.key}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  required
                  className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
                {f.key === 'phone' && (
                  <p className="text-xs text-muted-foreground">India numbers only. Don't include +91.</p>
                )}
              </div>
            ))}

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
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : '🔔 Save & Set Reminder'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
