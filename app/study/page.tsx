// FILE: app/study/page.tsx
'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

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

  const score = mcqs.length > 0
    ? Object.entries(selected).filter(([i, j]) => mcqs[+i].correct === j).length
    : 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">🧠 AI Study Buddy</h1>
          <p className="text-muted-foreground mt-1 text-sm">Paste your lecture notes. Get flashcards and a quiz instantly.</p>
        </div>

        {/* Input Card */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <textarea
            placeholder="Paste your lecture notes here... (e.g. OSI model has 7 layers: Physical, Data Link, Network...)"
            className="w-full min-h-[140px] resize-none bg-background border border-input rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div className="flex gap-3 mt-4 flex-wrap">
            <button
              onClick={generateFlashcards}
              disabled={loading || !notes.trim()}
              className="btn-glow text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : '🃏 Generate Flashcards'}
            </button>
            <button
              onClick={generateMCQ}
              disabled={loadingMCQ || !notes.trim()}
              className="text-sm font-medium px-5 py-2 rounded-lg border border-border hover:bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingMCQ ? (
                <><span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" /> Generating...</>
              ) : '❓ Generate MCQ Quiz'}
            </button>
          </div>
          {error && <p className="text-sm text-red-500 mt-3 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Tab switcher */}
        {(flashcards.length > 0 || mcqs.length > 0) && (
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTab('flash')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'flash' ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border hover:bg-accent'
              }`}
            >
              🃏 Flashcards
              {flashcards.length > 0 && <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{flashcards.length}</span>}
            </button>
            <button
              onClick={() => setTab('mcq')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'mcq' ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border hover:bg-accent'
              }`}
            >
              ❓ Quiz
              {mcqs.length > 0 && <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{mcqs.length}</span>}
            </button>
          </div>
        )}

        {/* Flashcards grid */}
        {tab === 'flash' && flashcards.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-4">💡 Click any card to reveal the answer</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {flashcards.map((card, i) => (
                <div
                  key={i}
                  className="flip-card h-44"
                  onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}
                >
                  <div className={`flip-card-inner ${flipped[i] ? 'flipped' : ''}`}>
                    <div className="flip-card-front bg-card border border-border rounded-xl shadow-sm">
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Question</span>
                        <p className="text-sm font-medium leading-relaxed">{card.question}</p>
                      </div>
                    </div>
                    <div className="flip-card-back rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #a855f7 100%)' }}>
                      <div className="text-center text-white">
                        <span className="text-xs opacity-70 uppercase tracking-widest mb-2 block">Answer</span>
                        <p className="text-sm font-medium leading-relaxed">{card.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MCQ Quiz */}
        {tab === 'mcq' && mcqs.length > 0 && (
          <>
            {Object.keys(selected).length === mcqs.length && (
              <div className="mb-5 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-sm font-medium">
                🎉 Score: {score}/{mcqs.length} — {Math.round(score / mcqs.length * 100)}%
              </div>
            )}
            <div className="flex flex-col gap-4">
              {mcqs.map((q, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-muted/30">
                    <p className="text-sm font-semibold">Q{i + 1}. {q.question}</p>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {q.options.map((opt, j) => {
                      const isSelected = selected[i] === j
                      const isCorrect = selected[i] !== undefined && j === q.correct
                      const isWrong = isSelected && j !== q.correct
                      return (
                        <button
                          key={j}
                          onClick={() => setSelected(s => ({ ...s, [i]: j }))}
                          disabled={selected[i] !== undefined}
                          className={`text-left px-4 py-2.5 rounded-lg text-sm transition-all border
                            ${isCorrect ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-medium' : ''}
                            ${isWrong ? 'border-red-500 bg-red-500/10 text-red-500' : ''}
                            ${!isCorrect && !isWrong ? 'border-border hover:bg-accent hover:border-primary/40' : ''}
                          `}
                        >
                          <span className="font-mono mr-2 text-xs opacity-60">{String.fromCharCode(65 + j)}.</span>
                          {opt}
                          {isCorrect && ' ✓'}
                          {isWrong && ' ✗'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
