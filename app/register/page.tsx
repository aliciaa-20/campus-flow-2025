'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const BRANCHES  = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD', 'Other']
const YEARS     = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const SUBJECT_SUGGESTIONS = [
  'DBMS', 'OS', 'Computer Networks', 'DSA', 'Machine Learning',
  'AI', 'Web Dev', 'Cryptography', 'Cloud Computing', 'Software Engineering',
  'Mathematics', 'Physics', 'Microprocessors', 'VLSI', 'Embedded Systems',
  'Control Systems', 'Signal Processing', 'Digital Electronics', 'Python', 'Java',
]

export default function RegisterPage() {
  const [step,     setStep]     = useState<'auth' | 'profile'>('auth')
  const [userId,   setUserId]   = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [form, setForm] = useState({
    name: '', branch: '', year: '', phone: '',
  })
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [customSubject,    setCustomSubject]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('students').select('id').eq('user_id', user.id).single().then(({ data }) => {
        if (data) { window.location.href = '/dashboard' }
        else { setUserId(user.id); setStep('profile') }
      })
    })
  }, [])

  const toggleSubject = (s: string) => {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const addCustomSubject = () => {
    const trimmed = customSubject.trim()
    if (!trimmed || selectedSubjects.includes(trimmed)) { setCustomSubject(''); return }
    setSelectedSubjects(prev => [...prev, trimmed])
    setCustomSubject('')
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    if (password !== confirm) { setError('Passwords do not match.'); setLoading(false); return }
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) throw new Error(err.message)
      if (!data.user) throw new Error('Sign up failed — please try again.')
      setUserId(data.user.id)
      setStep('profile')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Sign up failed') }
    finally { setLoading(false) }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim())        { setError('Full name is required.'); return }
    if (!form.branch)             { setError('Please select your branch.'); return }
    if (!form.year)               { setError('Please select your year.'); return }
    if (selectedSubjects.length === 0) { setError('Please add at least one subject.'); return }
    if (!form.phone || form.phone.length < 10) { setError('Enter a valid 10-digit WhatsApp number.'); return }
    setLoading(true); setError('')
    try {
      const { error: insertError } = await supabase.from('students').insert({
        user_id:  userId,
        name:     form.name.trim(),
        branch:   form.branch,
        year:     parseInt(form.year.charAt(0)),
        subjects: selectedSubjects.join(', '),
        phone:    form.phone.trim(),
      })
      if (insertError) throw new Error(insertError.message)
      document.cookie = 'cf_session=1; path=/; max-age=86400; SameSite=Lax'
      window.location.href = '/dashboard'
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not save profile') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 13px', borderRadius: 8, fontSize: 13.5,
    background: '#111217', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.92)', outline: 'none', fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const sel: React.CSSProperties = { ...inp, appearance: 'none', cursor: 'pointer' }
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#7C5CFF'
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(124,92,255,0.12)'
  }
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
    e.currentTarget.style.boxShadow   = 'none'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: '#7C5CFF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 15L10 4L16 15H4Z" fill="white" fillOpacity="0.92"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>CampusFlow</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            {step === 'auth' ? 'Create your account — 60 seconds.' : 'Set up your student profile.'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {['Account', 'Profile'].map((s, i) => {
            const active = (i === 0 && step === 'auth') || (i === 1 && step === 'profile')
            const done   = i === 0 && step === 'profile'
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  background: done ? '#18C964' : active ? '#7C5CFF' : 'rgba(255,255,255,0.07)',
                  color: '#fff',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, color: active ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{s}</span>
                {i === 0 && <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.08)' }} />}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div style={{ background: '#151821', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>

          {/* ── STEP 1: Auth ── */}
          {step === 'auth' && (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Step 1 — Create account</p>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>College Email *</label>
                <input style={inp} type="email" placeholder="yourname@college.edu" value={email} onChange={e => setEmail(e.target.value)} required onFocus={focus} onBlur={blur} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Password *</label>
                <input style={inp} type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} onFocus={focus} onBlur={blur} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Confirm Password *</label>
                <input style={inp} type="password" placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} onFocus={focus} onBlur={blur} />
              </div>

              {error && <p style={{ fontSize: 12, color: '#FF5A5F', margin: 0, padding: '8px 12px', background: 'rgba(255,90,95,0.08)', borderRadius: 8, border: '1px solid rgba(255,90,95,0.2)' }}>{error}</p>}

              <button type="submit" disabled={loading} style={{ background: '#7C5CFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, width: '100%', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Creating…</> : 'Continue →'}
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#7C5CFF', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
              </p>
            </form>
          )}

          {/* ── STEP 2: Profile ── */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Step 2 — Student profile</p>

              {/* Full Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input style={inp} placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required onFocus={focus} onBlur={blur} />
              </div>

              {/* Branch + Year */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Branch *</label>
                  <select style={sel} value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} required onFocus={focus} onBlur={blur}>
                    <option value="">Select</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Year *</label>
                  <select style={sel} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required onFocus={focus} onBlur={blur}>
                    <option value="">Select</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Subjects — chip picker */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  Subjects *
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 400, marginLeft: 6 }}>
                    {selectedSubjects.length > 0 ? `${selectedSubjects.length} selected` : 'pick at least one'}
                  </span>
                </label>
                {/* Chip grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {SUBJECT_SUGGESTIONS.map(s => {
                    const on = selectedSubjects.includes(s)
                    return (
                      <button key={s} type="button" onClick={() => toggleSubject(s)} style={{
                        padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.14s',
                        border: on ? '1.5px solid #7C5CFF' : '1px solid rgba(255,255,255,0.1)',
                        background: on ? 'rgba(124,92,255,0.18)' : 'rgba(255,255,255,0.03)',
                        color: on ? '#7C5CFF' : 'rgba(255,255,255,0.45)',
                      }}>
                        {on && <span style={{ marginRight: 4 }}>✓</span>}{s}
                      </button>
                    )
                  })}
                </div>
                {/* Custom subject input */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Add custom subject…" value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSubject() } }}
                    onFocus={focus} onBlur={blur} />
                  <button type="button" onClick={addCustomSubject} style={{ padding: '0 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(124,92,255,0.12)', color: '#7C5CFF', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: "'Inter', sans-serif" }}>
                    Add
                  </button>
                </div>
                {/* Selected subjects pill list */}
                {selectedSubjects.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                    {selectedSubjects.map(s => (
                      <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.25)', fontSize: 11.5, color: '#7C5CFF', fontWeight: 500 }}>
                        {s}
                        <button type="button" onClick={() => setSelectedSubjects(p => p.filter(x => x !== s))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(124,92,255,0.6)', padding: 0, display: 'flex', lineHeight: 1, fontSize: 13 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  WhatsApp Number *
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 400, marginLeft: 6 }}>India only</span>
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', fontSize: 13, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>+91</span>
                  <input style={{ ...inp, flex: 1 }} type="tel" placeholder="9876543210" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    maxLength={10} required onFocus={focus} onBlur={blur} />
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '5px 0 0' }}>You'll receive deadline reminders on WhatsApp</p>
              </div>

              {error && <p style={{ fontSize: 12, color: '#FF5A5F', margin: 0, padding: '8px 12px', background: 'rgba(255,90,95,0.08)', borderRadius: 8, border: '1px solid rgba(255,90,95,0.2)' }}>{error}</p>}

              <button type="submit" disabled={loading} style={{ background: '#7C5CFF', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, width: '100%', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading
                  ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Setting up…</>
                  : 'Go to Dashboard →'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>
          CampusFlow · Built for students, by students
        </p>
      </div>
    </div>
  )
}