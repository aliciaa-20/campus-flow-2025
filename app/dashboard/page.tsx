// FILE: app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  subject: string
  deadline: string
  add_to_calendar: boolean
}

// Demo tasks shown only in pure demo bypass mode with no real user
const DEMO_TASKS: Task[] = [
  { id: '1', title: 'ER Diagram Assignment',         subject: 'DBMS',              deadline: new Date(Date.now() + 1 * 86400000).toISOString(), add_to_calendar: true  },
  { id: '2', title: 'OS Process Scheduling Report',  subject: 'Operating Systems', deadline: new Date(Date.now() + 3 * 86400000).toISOString(), add_to_calendar: false },
  { id: '3', title: 'TCP/IP Lab Viva',               subject: 'Computer Networks', deadline: new Date(Date.now() + 7 * 86400000).toISOString(), add_to_calendar: true  },
  { id: '4', title: 'ML Mini Project Submission',    subject: 'Machine Learning',  deadline: new Date(Date.now() - 1 * 86400000).toISOString(), add_to_calendar: true  },
]

const quickActions = [
  { href: '/tasks/new', icon: '➕', label: 'Add Task',     desc: 'New deadline',      color: 'from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border-blue-500/30'   },
  { href: '/study',     icon: '🧠', label: 'Study Buddy',  desc: 'AI flashcards',     color: 'from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border-purple-500/30'  },
  { href: '/notice',    icon: '📣', label: 'Notice Board', desc: 'Broadcast alerts',  color: 'from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/30' },
  { href: '#',          icon: '📊', label: 'Attendance',   desc: 'Coming soon',       color: 'from-slate-500/10 to-slate-500/10 border-slate-500/20 opacity-50 cursor-not-allowed'                   },
]

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks]       = useState<Task[]>([])
  const [userName, setUserName] = useState('there')
  const [loading, setLoading]   = useState(true)
  const [isDemo, setIsDemo]     = useState(false)

  useEffect(() => {
    const load = async () => {
      // 1. Try real Supabase session first
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Real logged-in user — fetch from Supabase
        const { data: student } = await supabase
          .from('students')
          .select('name, id')
          .eq('user_id', user.id)
          .single()

        if (student) {
          setUserName(student.name)
          const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .eq('student_id', student.id)
            .order('deadline', { ascending: true })
          setTasks(taskData || [])
        } else {
          // User exists in auth but no student profile yet — use their email name
          setUserName(user.email?.split('@')[0] || 'there')
          setTasks([])
        }
        setLoading(false)
        return
      }

      // 2. Fall back to demo bypass cookie
      const isBypass = document.cookie.includes('demo_bypass=true')
      if (isBypass) {
        setIsDemo(true)
        setUserName('Aarush')
        setTasks(DEMO_TASKS)
        setLoading(false)
        return
      }

      // 3. No session at all — redirect to login
      router.push('/login')
    }

    load()
  }, [router])

  const handleSignOut = async () => {
    document.cookie = 'cf_session=; max-age=0; path=/'
    document.cookie = 'demo_bypass=; max-age=0; path=/'
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDeadline = (dt: string) => {
    const diff = Math.ceil((new Date(dt).getTime() - Date.now()) / 86400000)
    if (diff < 0)  return { label: '⚠️ Overdue',        cls: 'bg-red-500/15 text-red-500 border-red-500/30'     }
    if (diff === 0) return { label: '🔥 Due Today!',     cls: 'bg-red-500/15 text-red-500 border-red-500/30'     }
    if (diff === 1) return { label: '⏰ Due Tomorrow',   cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' }
    if (diff <= 3)  return { label: `${diff} days left`, cls: 'bg-amber-500/10 text-amber-500 border-amber-500/30' }
    return               { label: `${diff} days left`,  cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    </div>
  )

  const upcoming = tasks.filter(t => new Date(t.deadline) > new Date()).length

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hey {userName} 👋</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isDemo && (
                <span className="inline-flex items-center gap-1 mr-2 px-2 py-0.5 text-xs rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
                  🚀 Demo Mode
                </span>
              )}
              You have <strong className="text-foreground">{upcoming}</strong> upcoming deadline{upcoming !== 1 ? 's' : ''}.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 px-3 py-1.5 rounded-lg transition-all"
          >
            Sign out
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href}>
              <div className={`rounded-xl border bg-gradient-to-br ${a.color} p-4 transition-all hover:scale-[1.02] active:scale-[0.98]`}>
                <div className="text-2xl mb-1">{a.icon}</div>
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming deadlines */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="font-semibold text-base">Upcoming Deadlines</h2>
              <p className="text-xs text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
            </div>
            <Link href="/tasks/new">
              <button className="btn-glow text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                + Add Task
              </button>
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm">No deadlines yet.</p>
              <Link href="/tasks/new">
                <button className="mt-3 text-xs text-primary hover:underline">Add your first task →</button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tasks.map(task => {
                const due = formatDeadline(task.deadline)
                return (
                  <div key={task.id} className="flex items-center justify-between px-5 py-4 hover:bg-accent/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.subject} · {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {task.add_to_calendar && <span className="ml-2">📅</span>}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ml-3 ${due.cls}`}>
                      {due.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
