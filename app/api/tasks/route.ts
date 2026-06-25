// FILE: app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { title, subject, deadline, phone, studentId, studentName } = await req.json()

    if (!title || !subject || !deadline || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Compute reminder_time = deadline - 24 hours
    const deadlineDate = new Date(deadline)
    const reminderTime = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000)

    // Insert task into Supabase
    const { data: task, error: dbError } = await supabase
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

    // Fire n8n Workflow 1 — Deadline Reminder
    const webhookUrl = process.env.N8N_DEADLINE_WEBHOOK
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          phone,
          subject,
          deadline: deadlineDate.toISOString(),
          taskTitle: title,
          reminder_time: reminderTime.toISOString(),
        }),
      })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
