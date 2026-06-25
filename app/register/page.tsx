'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD', 'Other']
const YEARS    = ['1st Year', '2nd Year', '3rd Year', '4th Year']

export default function RegisterPage() {
  const [step,   setStep]   = useState<'auth' | 'profile'>('auth')
  const [userId, setUserId] = useState('')
  const [email,  setEmail]  = useState('')
  const [password, setPassword] = useState('')
  const [form, setForm] = useState({ name: '', branch: '', year: '', subjects: '', phone: '' })
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
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
    if (!form.name || !form.branch || !form.year || !form.phone) {
      setError('Please fill in all required fields.'); return
    }
    setLoading(true); setError('')
    try {
      const { error: insertError } = await supabase.from('students').insert({
        user_id: userId,
        name:    form.name.trim(),
        branch:  form.branch,
        year:    parseInt(form.year.charAt(0)),
        phone:   form.phone.trim(),
      })
      if (insertError) throw new Error(insertError.message)
      document.cookie = 'cf_session=1; path=/; max-age=86400; SameSite=Lax'
      window.location.href = '/dashboard'
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not save profile') }
    finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 13px', borderRadius: 8, fontSize: 13.5,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-1)', outline: 'none', fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', cursor: 'pointer' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 15L10 4L16 15H4Z" fill="white" fillOpacity="0.92"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>CampusFlow</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>Create your account — takes 60 seconds.</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, justifyContent: 'center' }}>
          {['Account', 'Profile'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (i === 0 && step === 'auth') || (i === 1 && step === 'profile') ? 'var(--accent)' : i === 0 && step === 'profile' ? 'var(--success)' : 'rgba(255,255,255,0.08)', color: (i === 0 && step === 'auth') || (i === 1 && step === 'profile') ? '#fff' : i === 0 ? '#fff' : 'var(--text-3)', transition: 'all 0.2s' }}>
                {i === 0 && step === 'profile' ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, color: (i === 0 && step === 'auth') || (i === 1 && step === 'profile') ? 'var(--text-1)' : 'var(--text-3)', fontWeight: 500 }}>{s}</span>
              {i === 0 && <div style={{ width: 24, height: 1, background: 'var(--border)' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 24px', overflow: 'hidden' }}>

          {/* STEP 1 — Auth */}
          {step === 'auth' && (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Step 1 — Create account</p>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>College Email</label>
                <input style={inputStyle} type="email" placeholder="yourname@college.edu" value={email} onChange={e => setEmail(e.target.value)} required
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,255,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Password</label>
                <input style={inputStyle} type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,255,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              {error && <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0, padding: '8px 12px', background: 'rgba(255,90,95,0.08)', borderRadius: 8, border: '1px solid rgba(255,90,95,0.2)' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, width: '100%', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Creating account…</> : 'Continue →'}
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
              </p>
            </form>
          )}

          {/* STEP 2 — Profile */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Step 2 — Your profile</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>This personalises your deadline reminders.</p>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input style={inputStyle} placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,255,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Branch *</label>
                  <select style={selectStyle} value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} required>
                    <option value="">Select</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Year *</label>
                  <select style={selectStyle} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required>
                    <option value="">Select</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Subjects <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                <input style={inputStyle} placeholder="e.g. DBMS, OS, CN, DSA" value={form.subjects} onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,255,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }} />
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '5px 0 0' }}>Comma separated</p>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>WhatsApp Number *</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'var(--text-3)', flexShrink: 0 }}>+91</span>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} maxLength={10} required
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,255,0.12)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '5px 0 0' }}>You'll receive deadline reminders here</p>
              </div>
              {error && <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0, padding: '8px 12px', background: 'rgba(255,90,95,0.08)', borderRadius: 8, border: '1px solid rgba(255,90,95,0.2)' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, width: '100%', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Saving…</> : 'Go to Dashboard →'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 20 }}>
          CampusFlow · Built for students, by students
        </p>
      </div>
    </div>
  )
}