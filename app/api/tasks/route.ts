// FILE: app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key on server side to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nnbwptvluikbxgxfryer.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uYndwdHZsdWlrYnhneGZyeWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNTYwMjUsImV4cCI6MjA5NzkzMjAyNX0.iPF3WdgBiAuRvTF6KrgNC1wiDSlmnhASjBTKMYk7zp0'
)

export async function POST(req: NextRequest) {
  try {
    const { title, subject, deadline, phone, studentId, studentName } = await req.json()

    if (!title || !subject || !deadline || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const deadlineDate = new Date(deadline)
    const reminderTime = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000)

    const { data: task, error: dbError } = await supabaseAdmin
      .from('tasks')
      .insert({
        student_id: studentId,
        title,
        subject,
        deadline: deadlineDate.toISOString(),
        reminder_time: reminderTime.toISOString(),
        add_to_calendar: true,
      })
      .select()
      .single()

    if (dbError) throw new Error(dbError.message)

    // Fire n8n Workflow 1 — Deadline Reminder (optional, won't fail if not set)
    const webhookUrl = process.env.N8N_DEADLINE_WEBHOOK
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, phone, subject, deadline: deadlineDate.toISOString(), taskTitle: title, reminder_time: reminderTime.toISOString() }),
      }).catch(() => {}) // silently ignore n8n errors
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
