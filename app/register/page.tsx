// FILE: app/register/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD', 'Other']
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'auth' | 'profile'>('auth')
  const [userId, setUserId] = useState('')

  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Profile fields
  const [form, setForm] = useState({
    name: '',
    branch: '',
    year: '',
    subjects: '',
    phone: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If already logged in but no student row, go to profile step
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (student) {
        router.push('/dashboard')
      } else {
        setUserId(user.id)
        setStep('profile')
      }
    }
    check()
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw new Error(signUpError.message)
      if (!data.user) throw new Error('Sign up failed — please try again.')
      setUserId(data.user.id)
      setStep('profile')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.branch || !form.year || !form.phone) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('students').insert({
        user_id: userId,
        name: form.name.trim(),
        branch: form.branch,
        year: parseInt(form.year.charAt(0)),
        subjects: form.subjects.trim(),
        phone: form.phone.trim(),
      })
      if (insertError) throw new Error(insertError.message)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">CampusFlow 🎓</h1>
          <p className="text-muted-foreground">Never miss a deadline again.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`h-2 w-16 rounded-full transition-colors ${step === 'auth' ? 'bg-primary' : 'bg-primary'}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${step === 'profile' ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {step === 'auth' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Create your account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">College Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="yourname@college.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating account...' : 'Continue →'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <a href="/login" className="text-primary underline underline-offset-2">Sign in</a>
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'profile' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Complete your profile</CardTitle>
              <p className="text-sm text-muted-foreground">This lets CampusFlow personalise your reminders.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="branch">Branch *</Label>
                    <select
                      id="branch"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={form.branch}
                      onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                      required
                    >
                      <option value="">Select</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="year">Year *</Label>
                    <select
                      id="year"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={form.year}
                      onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                      required
                    >
                      <option value="">Select</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="subjects">Subjects</Label>
                  <Input
                    id="subjects"
                    placeholder="e.g. DBMS, OS, CN, DSA"
                    value={form.subjects}
                    onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Comma separated</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">WhatsApp Number *</Label>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground font-medium px-3 py-2 border rounded-md bg-muted">+91</span>
                    <Input
                      id="phone"
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">You'll receive deadline reminders here</p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Saving...' : '🚀 Go to Dashboard'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}