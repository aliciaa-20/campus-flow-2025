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

export async function POST(req: NextRequest) {
  try {
    const { title, subject, deadline, phone, studentId, studentName, priority, category } = await req.json()

    if (!title || !subject || !deadline || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const deadlineDate  = new Date(deadline)
    const reminderTime  = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000)
    const deadlineFmt   = deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    // 1. Save to Supabase
    const { data: task, error: dbError } = await supabaseAdmin
      .from('tasks')
      .insert({
        student_id:     studentId,
        title,
        subject,
        deadline:       deadlineDate.toISOString(),
        reminder_time:  reminderTime.toISOString(),
        add_to_calendar: true,
      })
      .select()
      .single()

    if (dbError) throw new Error(dbError.message)

    const payload = {
      studentName,
      phone,
      subject,
      deadline:   deadlineDate.toISOString(),
      taskTitle:  title,
      reminder_time: reminderTime.toISOString(),
      priority:   priority || 'medium',
      category:   category || 'Assignment',
    }

    // 2. Fire n8n (handles Google Calendar + 24h reminder)
    const n8nUrl = process.env.N8N_DEADLINE_WEBHOOK
    let n8nResult = 'skipped'
    if (n8nUrl) {
      try {
        const n8nRes = await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        n8nResult = n8nRes.ok ? 'ok' : `error-${n8nRes.status}`
      } catch { n8nResult = 'fetch-error' }
    }

    // 3. Send immediate WhatsApp confirmation via Twilio directly
    let whatsappResult = 'skipped'
    if (phone) {
      const msg = `✅ *Task Added — CampusFlow*\n\nHey ${studentName}! Your task has been saved.\n\n📚 *${title}*\n📖 Subject: ${subject}\n⏰ Due: ${deadlineFmt}\n\nWe'll remind you 24 hours before the deadline. Good luck! 🎓`
      const twResult = await sendWhatsApp(phone, msg)
      whatsappResult = twResult.ok ? `sent:${twResult.sid}` : `error:${twResult.error}`
    }

    return NextResponse.json({
      task,
      whatsapp: whatsappResult,
      n8n: n8nResult,
    }, { status: 201 })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
