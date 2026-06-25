// FILE: app/study/page.tsx
'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Flashcard { question: string; answer: string }
interface MCQ { question: string; options: string[]; correct: number }

export default function StudyPage() {
  const [notes, setNotes] = useState('')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [mcqs, setMcqs] = useState<MCQ[]>([])
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [selected, setSelected] = useState<Record<number, number>>({})
  const [tab, setTab] = useState<'flash' | 'mcq'>('flash')
  const [loading, setLoading] = useState(false)
  const [loadingMCQ, setLoadingMCQ] = useState(false)
  const [error, setError] = useState('')

  const generateFlashcards = async () => {
    if (!notes.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFlashcards(data.flashcards)
      setFlipped({})
      setTab('flash')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate flashcards')
    } finally { setLoading(false) }
  }

  const generateMCQ = async () => {
    if (!notes.trim()) return
    setLoadingMCQ(true); setError('')
    try {
      const res = await fetch('/api/ai/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMcqs(data.mcqs)
      setSelected({})
      setTab('mcq')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate MCQs')
    } finally { setLoadingMCQ(false) }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">🧠 AI Study Buddy</h1>
          <p className="text-muted-foreground mt-1">Paste your lecture notes. Get flashcards and a quiz instantly.</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 flex flex-col gap-4">
            <Textarea
              placeholder="Paste your lecture notes here..."
              className="min-h-[150px] resize-none"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="flex gap-3 flex-wrap">
              <Button onClick={generateFlashcards} disabled={loading || !notes.trim()}>
                {loading ? 'Generating...' : '🃏 Generate Flashcards'}
              </Button>
              <Button variant="outline" onClick={generateMCQ} disabled={loadingMCQ || !notes.trim()}>
                {loadingMCQ ? 'Generating...' : '❓ Generate MCQ Quiz'}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {/* Tabs */}
        {(flashcards.length > 0 || mcqs.length > 0) && (
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={tab === 'flash' ? 'default' : 'outline'} onClick={() => setTab('flash')}>
              🃏 Flashcards {flashcards.length > 0 && <Badge className="ml-2">{flashcards.length}</Badge>}
            </Button>
            <Button size="sm" variant={tab === 'mcq' ? 'default' : 'outline'} onClick={() => setTab('mcq')}>
              ❓ Quiz {mcqs.length > 0 && <Badge className="ml-2">{mcqs.length}</Badge>}
            </Button>
          </div>
        )}

        {/* Flashcards grid */}
        {tab === 'flash' && flashcards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {flashcards.map((card, i) => (
              <div key={i} className="flip-card h-40 cursor-pointer" style={{ height: '160px' }}
                onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}
              >
                <div className={`flip-card-inner ${flipped[i] ? 'flipped' : ''}`}>
                  <div className="flip-card-front bg-card border rounded-xl flex items-center justify-center p-4">
                    <p className="text-sm font-medium text-center">{card.question}</p>
                  </div>
                  <div className="flip-card-back bg-primary text-primary-foreground rounded-xl flex items-center justify-center p-4">
                    <p className="text-sm text-center">{card.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MCQ Quiz */}
        {tab === 'mcq' && mcqs.length > 0 && (
          <div className="flex flex-col gap-4">
            {mcqs.map((q, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">Q{i + 1}. {q.question}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {q.options.map((opt, j) => {
                    const isSelected = selected[i] === j
                    const isCorrect = selected[i] !== undefined && j === q.correct
                    const isWrong = isSelected && j !== q.correct
                    return (
                      <button key={j}
                        onClick={() => setSelected(s => ({ ...s, [i]: j }))}
                        className={`text-left px-4 py-2 rounded-lg border text-sm transition-colors
                          ${isCorrect ? 'border-green-500 bg-green-500/10 text-green-600' : ''}
                          ${isWrong ? 'border-red-500 bg-red-500/10 text-red-600' : ''}
                          ${!isCorrect && !isWrong ? 'hover:bg-accent border-border' : ''}
                        `}>
                        {String.fromCharCode(65 + j)}. {opt}
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
