'use client'
import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router   = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        document.cookie = `cf_session=1; path=/; max-age=86400; SameSite=Lax`
        router.push('/dashboard')
      }
      if (event === 'SIGNED_OUT') {
        document.cookie = 'cf_session=; max-age=0; path=/'
        document.cookie = 'demo_bypass=; max-age=0; path=/'
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  const handleAdminBypass = () => {
    document.cookie = 'demo_bypass=true; path=/; max-age=86400; SameSite=Lax'
    router.push('/dashboard')
  }

  if (!mounted) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40,
            background: 'var(--accent)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 15L10 4L16 15H4Z" fill="white" fillOpacity="0.92"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
            CampusFlow
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
            Never miss a deadline again.
          </p>
        </div>

        {/* Auth card */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          padding: '24px',
        }}>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand:              '#7C5CFF',
                    brandAccent:        '#6B4EE6',
                    brandButtonText:    'white',
                    defaultButtonBackground: 'rgba(255,255,255,0.05)',
                    defaultButtonBackgroundHover: 'rgba(255,255,255,0.09)',
                    inputBackground:    '#111217',
                    inputBorder:        'rgba(255,255,255,0.08)',
                    inputBorderFocus:   '#7C5CFF',
                    inputText:          'rgba(255,255,255,0.92)',
                    inputPlaceholder:   'rgba(255,255,255,0.28)',
                    messageText:        'rgba(255,255,255,0.6)',
                    anchorTextColor:    '#7C5CFF',
                    dividerBackground:  'rgba(255,255,255,0.08)',
                  },
                  radii: {
                    borderRadiusButton: '10px',
                    buttonBorderRadius: '10px',
                    inputBorderRadius:  '8px',
                  },
                  fontSizes: { baseInputSize: '13.5px', baseLabelSize: '12px' },
                  fonts: { bodyFontFamily: `'Inter', sans-serif`, buttonFontFamily: `'Inter', sans-serif`, inputFontFamily: `'Inter', sans-serif`, labelFontFamily: `'Inter', sans-serif` },
                },
              },
              style: {
                button: { fontWeight: '500' },
                input:  { fontWeight: '400' },
                label:  { color: 'rgba(255,255,255,0.55)', marginBottom: '6px' },
                anchor: { fontWeight: '500' },
              },
            }}
            providers={[]}
            view="sign_in"
            showLinks={true}
          />

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Admin Bypass */}
          <button
            id="admin-bypass-btn"
            onClick={handleAdminBypass}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.55)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s, transform 0.12s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLElement
              b.style.background = 'rgba(255,255,255,0.07)'
              b.style.color = 'rgba(255,255,255,0.8)'
              b.style.borderColor = 'rgba(255,255,255,0.18)'
              b.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLElement
              b.style.background = 'rgba(255,255,255,0.04)'
              b.style.color = 'rgba(255,255,255,0.55)'
              b.style.borderColor = 'rgba(255,255,255,0.1)'
              b.style.transform = 'translateY(0)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Admin Bypass
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 20 }}>
          CampusFlow · Built for students, by students
        </p>
      </div>
    </div>
  )
}
