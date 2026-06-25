// FILE: app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nnbwptvluikbxgxfryer.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function sendWhatsApp(to: string, message: string) {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
  if (!sid || !token) return { ok: false, error: 'Twilio not configured' }

  const toNumber = `whatsapp:+91${to.replace(/\D/g, '').slice(-10)}`
  const body = new URLSearchParams({ From: from, To: toNumber, Body: message })
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  )
  const data = await res.json()
  return { ok: res.ok, sid: data.sid, error: data.message }
}

// ── GET — fetch tasks for a student ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('student_id', studentId)
    .order('deadline', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data })
}

// ── POST — create task, fire WhatsApp + n8n ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const {
      title, subject, description, deadline, phone,
      studentId, studentName, priority, category,
      reminderOffset = 24,   // hours before deadline
      addToCalendar  = true,
    } = await req.json()

    if (!title || !subject || !deadline || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const deadlineDate = new Date(deadline)
    const reminderTime = new Date(deadlineDate.getTime() - reminderOffset * 60 * 60 * 1000)
    const deadlineFmt  = deadlineDate.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    // 1 — Save to Supabase
    const { data: task, error: dbError } = await supabaseAdmin
      .from('tasks')
      .insert({
        student_id:      studentId,
        title,
        subject,
        deadline:        deadlineDate.toISOString(),
        reminder_time:   reminderTime.toISOString(),
        add_to_calendar: addToCalendar,
      })
      .select()
      .single()

    if (dbError) throw new Error(dbError.message)

    const payload = {
      studentName, phone, subject,
      deadline:      deadlineDate.toISOString(),
      taskTitle:     title,
      description:   description || '',
      priority:      priority || 'medium',
      category:      category || 'Assignment',
      reminder_time: reminderTime.toISOString(),
      reminderOffset,
      addToCalendar,
    }

    // 2 — Fire n8n (Google Calendar + timed WhatsApp reminder)
    let n8nResult = 'skipped'
    const n8nUrl = process.env.N8N_DEADLINE_WEBHOOK
    if (n8nUrl && addToCalendar) {
      try {
        const r = await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        n8nResult = r.ok ? 'ok' : `error-${r.status}`
      } catch { n8nResult = 'fetch-error' }
    }

    // 3 — Send immediate WhatsApp confirmation via Twilio
    let whatsappResult = 'skipped'
    let whatsappSid    = ''
    if (phone) {
      const reminderLabel =
        reminderOffset >= 24 ? `${reminderOffset / 24}d` : `${reminderOffset}h`
      const msg =
        `✅ *Task Saved — CampusFlow*\n\n` +
        `Hey ${studentName}! Your deadline has been tracked.\n\n` +
        `📚 *${title}*\n` +
        `📖 ${subject}${category ? ' · ' + category : ''}\n` +
        `⏰ Due: ${deadlineFmt}\n` +
        `🔔 Reminder: ${reminderLabel} before\n` +
        (addToCalendar ? `📅 Added to Google Calendar\n` : '') +
        `\nGood luck! — CampusFlow 🎓`
      const r = await sendWhatsApp(phone, msg)
      whatsappResult = r.ok ? 'sent' : `error:${r.error}`
      whatsappSid    = r.sid || ''
    }

    return NextResponse.json({
      task,
      whatsapp: { status: whatsappResult, sid: whatsappSid },
      n8n:      n8nResult,
      calendar: addToCalendar ? n8nResult : 'skipped',
    }, { status: 201 })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── DELETE — delete a task ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', taskId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
