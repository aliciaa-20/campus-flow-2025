// FILE: app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  subject: string
  deadline: string
  add_to_calendar: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // get student row
      const { data: student } = await supabase
        .from('students')
        .select('name, id')
        .eq('user_id', user.id)
        .single()

      if (student) {
        setUserName(student.name)
        // get tasks
        const { data: taskData } = await supabase
          .from('tasks')
          .select('*')
          .eq('student_id', student.id)
          .order('deadline', { ascending: true })
        setTasks(taskData || [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDeadline = (dt: string) => {
    const d = new Date(dt)
    const now = new Date()
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: 'Overdue', color: 'destructive' as const }
    if (diff === 0) return { label: 'Due Today!', color: 'destructive' as const }
    if (diff === 1) return { label: 'Due Tomorrow', color: 'secondary' as const }
    return { label: `${diff} days left`, color: 'default' as const }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Hey {userName || 'there'} 👋</h1>
            <p className="text-muted-foreground mt-1">Here's what's coming up.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>Sign out</Button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Link href="/tasks/new">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center py-4 gap-1">
                <span className="text-2xl">➕</span>
                <span className="text-xs text-muted-foreground font-medium">Add Task</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/study">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center py-4 gap-1">
                <span className="text-2xl">🧠</span>
                <span className="text-xs text-muted-foreground font-medium">Study Buddy</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/notice">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center py-4 gap-1">
                <span className="text-2xl">📣</span>
                <span className="text-xs text-muted-foreground font-medium">Notice Board</span>
              </CardContent>
            </Card>
          </Link>
          <Card className="h-full opacity-50">
            <CardContent className="flex flex-col items-center justify-center py-4 gap-1">
              <span className="text-2xl">📊</span>
              <span className="text-xs text-muted-foreground font-medium">Attendance</span>
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Deadlines</CardTitle>
            <Link href="/tasks/new">
              <Button size="sm">+ Add Task</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-4xl mb-3">📭</p>
                <p>No deadlines yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map(task => {
                  const due = formatDeadline(task.deadline)
                  return (
                    <div key={task.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{task.subject} · {new Date(task.deadline).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.add_to_calendar && <span title="Added to Calendar">📅</span>}
                        <Badge variant={due.color}>{due.label}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
