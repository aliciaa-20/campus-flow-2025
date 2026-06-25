// FILE: app/api/ai/flashcards/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json()
    if (!notes?.trim()) {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 })
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a study assistant. Given these lecture notes, return ONLY a JSON array of 5 flashcards. No preamble, no markdown fences, just raw JSON.
Format: [{"question":"...","answer":"..."}]
Notes: ${notes}`,
      }],
      max_tokens: 800,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const flashcards = JSON.parse(cleaned)

    return NextResponse.json({ flashcards })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate flashcards'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}