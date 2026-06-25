'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

interface Flashcard { question: string; answer: string }
interface MCQ { question: string; options: string[]; correct: number }

type ResultTab = 'flashcards' | 'mcq' | 'summary' | 'topics'

export default function StudyPage() {
  const [notes, setNotes]           = useState('')
  const [wordCount, setWordCount]   = useState(0)
  const [autoSave, setAutoSave]     = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [mcqs, setMcqs]             = useState<MCQ[]>([])
  const [tab, setTab]               = useState<ResultTab>('flashcards')
  const [cardIdx, setCardIdx]       = useState(0)
  const [flipped, setFlipped]       = useState(false)
  const [selected, setSelected]     = useState<Record<number, number>>({})
  const [loading, setLoading]       = useState<'flash' | 'mcq' | null>(null)
  const [error, setError]           = useState('')
  const [hasResults, setHasResults] = useState(false)

  const handleNotesChange = (val: string) => {
    setNotes(val)
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0)
    setAutoSave('unsaved')
    clearTimeout((window as Window & { _saveTimer?: ReturnType<typeof setTimeout> })._saveTimer)
    ;(window as Window & { _saveTimer?: ReturnType<typeof setTimeout> })._saveTimer = setTimeout(() => setAutoSave('saved'), 1500)
  }

  const generate = async (type: 'flash' | 'mcq') => {
    if (!notes.trim()) return
    setLoading(type); setError('')
    try {
      const endpoint = type === 'flash' ? '/api/ai/flashcards' : '/api/ai/mcq'
      const res  = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (type === 'flash') { setFlashcards(data.flashcards); setCardIdx(0); setFlipped(false); setTab('flashcards') }
      else                  { setMcqs(data.mcqs); setSelected({}); setTab('mcq') }
      setHasResults(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally { setLoading(null) }
  }

  const score    = mcqs.length > 0 ? Object.entries(selected).filter(([i, j]) => mcqs[+i].correct === +j).length : 0
  const allDone  = mcqs.length > 0 && Object.keys(selected).length === mcqs.length

  const resultTabs: { key: ResultTab; label: string; count?: number }[] = [
    { key: 'flashcards', label: 'Flashcards', count: flashcards.length || undefined },
    { key: 'mcq',        label: 'Quiz',        count: mcqs.length || undefined },
    { key: 'summary',    label: 'Summary' },
    { key: 'topics',     label: 'Key Topics' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main className="page-enter" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-1)', margin: 0 }}>Study Buddy</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Paste lecture notes — get flashcards, quizzes, and summaries instantly.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }}>

          {/* LEFT — Notes editor */}
          <div className="cf-card" style={{ overflow: 'hidden' }}>
            {/* Editor toolbar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Notes</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{wordCount} words</span>
                <span style={{ fontSize: 11, color: autoSave === 'saved' ? 'var(--success)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {autoSave === 'saved'   && <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Saved</>}
                  {autoSave === 'unsaved' && 'Editing…'}
                </span>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder={`Paste your lecture notes here…\n\nExample:\nThe OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application. TCP is connection-oriented while UDP is connectionless. IP addresses are 32-bit in IPv4…`}
              style={{
                width: '100%', minHeight: 380, resize: 'vertical',
                background: 'transparent', border: 'none', outline: 'none',
                padding: '18px 20px', fontSize: 13.5, lineHeight: 1.75,
                color: 'var(--text-1)', fontFamily: "'Inter', sans-serif",
              }}
            />

            {/* Action bar */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="cf-btn-primary" onClick={() => generate('flash')}
                disabled={loading !== null || !notes.trim()}
                style={{ fontSize: 12 }}>
                {loading === 'flash'
                  ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Generating…</>
                  : 'Generate Flashcards'}
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </button>
              <button className="cf-btn-secondary" onClick={() => generate('mcq')}
                disabled={loading !== null || !notes.trim()}
                style={{ fontSize: 12 }}>
                {loading === 'mcq'
                  ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--text-2)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Generating…</>
                  : 'Generate Quiz'}
              </button>
              {notes && (
                <button className="cf-btn-secondary" onClick={() => { setNotes(''); setWordCount(0); setFlashcards([]); setMcqs([]); setHasResults(false) }}
                  style={{ fontSize: 12, marginLeft: 'auto' }}>
                  Clear
                </button>
              )}
            </div>

            {error && (
              <div style={{ margin: '0 16px 16px', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,90,95,0.1)', border: '1px solid rgba(255,90,95,0.2)', fontSize: 12, color: '#FF5A5F' }}>
                {error}
              </div>
            )}
          </div>

          {/* RIGHT — Results panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {!hasResults ? (
              <div className="cf-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 8px' }}>Ready to study</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>Paste your notes on the left and generate flashcards or a quiz to get started.</p>
              </div>
            ) : (
              <div className="cf-card" style={{ overflow: 'hidden' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
                  {resultTabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                      style={{
                        padding: '12px 14px', fontSize: 12, fontWeight: 500, border: 'none', background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        color: tab === t.key ? 'var(--text-1)' : 'var(--text-3)',
                        borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: -1, transition: 'color 0.15s',
                      }}>
                      {t.label}
                      {t.count != null && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', color: 'var(--text-2)', padding: '1px 6px', borderRadius: 99 }}>{t.count}</span>}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '20px' }}>

                  {/* ── Flashcards (Anki-style) ── */}
                  {tab === 'flashcards' && (
                    flashcards.length === 0 ? (
                      <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Click "Generate Flashcards" to start.</p>
                    ) : (
                      <div>
                        {/* Progress */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Card {cardIdx + 1} of {flashcards.length}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {flashcards.map((_, i) => (
                              <div key={i} onClick={() => { setCardIdx(i); setFlipped(false) }}
                                style={{ width: 20, height: 3, borderRadius: 99, background: i === cardIdx ? 'var(--accent)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.2s' }} />
                            ))}
                          </div>
                        </div>

                        {/* Stacked flip card */}
                        <div className="flip-card" style={{ height: 200 }} onClick={() => setFlipped(f => !f)}>
                          <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
                            <div className="flip-card-front cf-card" style={{ flexDirection: 'column', textAlign: 'center', gap: 12 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Question</span>
                              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', margin: 0, lineHeight: 1.6 }}>{flashcards[cardIdx].question}</p>
                              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Click to reveal answer</span>
                            </div>
                            <div className="flip-card-back" style={{ background: 'var(--accent)', flexDirection: 'column', textAlign: 'center', gap: 12 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Answer</span>
                              <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', margin: 0, lineHeight: 1.6 }}>{flashcards[cardIdx].answer}</p>
                            </div>
                          </div>
                        </div>

                        {/* Navigation */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <button className="cf-btn-secondary" onClick={() => { setCardIdx(i => Math.max(0, i - 1)); setFlipped(false) }}
                            disabled={cardIdx === 0} style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                            Previous
                          </button>
                          <button className="cf-btn-secondary" onClick={() => { setCardIdx(i => Math.min(flashcards.length - 1, i + 1)); setFlipped(false) }}
                            disabled={cardIdx === flashcards.length - 1} style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                            Next
                          </button>
                        </div>
                      </div>
                    )
                  )}

                  {/* ── MCQ Quiz ── */}
                  {tab === 'mcq' && (
                    mcqs.length === 0 ? (
                      <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Click "Generate Quiz" to start.</p>
                    ) : (
                      <div>
                        {/* Score bar */}
                        {allDone && (
                          <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 10, background: 'rgba(24,201,100,0.08)', border: '1px solid rgba(24,201,100,0.2)' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', margin: 0 }}>
                              {score}/{mcqs.length} correct — {Math.round(score / mcqs.length * 100)}%
                            </p>
                          </div>
                        )}

                        {/* Progress indicator */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{Object.keys(selected).length}/{mcqs.length} answered</span>
                          </div>
                          <div className="cf-progress-track">
                            <div className="cf-progress-fill" style={{ width: `${(Object.keys(selected).length / mcqs.length) * 100}%`, background: 'var(--accent)' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {mcqs.map((q, i) => (
                            <div key={i}>
                              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', margin: '0 0 10px', lineHeight: 1.5 }}>
                                <span style={{ color: 'var(--text-3)', marginRight: 6, fontSize: 11 }}>Q{i + 1}.</span>
                                {q.question}
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {q.options.map((opt, j) => {
                                  const isSelected = selected[i] === j
                                  const isCorrect  = selected[i] !== undefined && j === q.correct
                                  const isWrong    = isSelected && j !== q.correct
                                  return (
                                    <button key={j}
                                      onClick={() => selected[i] === undefined && setSelected(s => ({ ...s, [i]: j }))}
                                      disabled={selected[i] !== undefined}
                                      style={{
                                        textAlign: 'left', padding: '9px 13px', borderRadius: 8, fontSize: 12.5,
                                        border: isCorrect ? '1.5px solid var(--success)' : isWrong ? '1.5px solid var(--danger)' : '1px solid var(--border)',
                                        background: isCorrect ? 'rgba(24,201,100,0.08)' : isWrong ? 'rgba(255,90,95,0.08)' : 'rgba(255,255,255,0.02)',
                                        color: isCorrect ? 'var(--success)' : isWrong ? 'var(--danger)' : 'var(--text-2)',
                                        cursor: selected[i] !== undefined ? 'default' : 'pointer',
                                        transition: 'all 0.15s', fontFamily: "'Inter', sans-serif",
                                      }}>
                                      <span style={{ fontFamily: 'monospace', marginRight: 8, opacity: 0.5 }}>{String.fromCharCode(65 + j)}.</span>
                                      {opt}
                                      {isCorrect && ' ✓'}
                                      {isWrong   && ' ✗'}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {/* ── Summary / Topics ── */}
                  {(tab === 'summary' || tab === 'topics') && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                        {tab === 'summary' ? 'Generate flashcards first to unlock the summary.' : 'Key topic extraction — coming soon.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
