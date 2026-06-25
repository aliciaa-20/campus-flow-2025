// FILE: app/api/notice/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { noticeText, eventTitle, eventDate, phoneList } = await req.json()

    if (!noticeText || !eventTitle || !eventDate || !phoneList?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Step 1: Groq summarize
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `Summarize this college notice in exactly 3 bullet points. Be concise and clear. Use • for bullets.\n\nNotice:\n${noticeText}`,
      }],
      max_tokens: 300,
    })

    const summary = completion.choices[0]?.message?.content || 'Summary unavailable.'

    // Step 2: Fire n8n Workflow 2 — Notice Summarizer
    const webhookUrl = process.env.N8N_NOTICE_WEBHOOK
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noticeText,
          eventTitle,
          eventDate: new Date(eventDate).toISOString(),
          phoneList,
          aiSummary: summary,
        }),
      })
    }

    return NextResponse.json({ summary }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}