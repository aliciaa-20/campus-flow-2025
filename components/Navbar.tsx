'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tasks/new', label: 'Tasks' },
  { href: '/study',     label: 'Study' },
  { href: '/notice',    label: 'Notice Board' },
]

export default function Navbar() {
  const path     = usePathname()
  const router   = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userInitial, setUserInitial] = useState('A')

  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserInitial(user.email[0].toUpperCase())
    })
  }, [])

  const handleSignOut = async () => {
    document.cookie = 'cf_session=; max-age=0; path=/'
    document.cookie = 'demo_bypass=; max-age=0; path=/'
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(9,9,11,0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 24px',
        height: 52,
        display: 'flex', alignItems: 'center', gap: 32,
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 24, height: 24,
            background: 'var(--accent)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 10L6.5 2L11 10H2Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            CampusFlow
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {navLinks.map(l => {
            const active = path === l.href || (l.href !== '/dashboard' && path.startsWith(l.href))
            return (
              <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'block',
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: active ? 'var(--text-1)' : 'var(--text-2)',
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  transition: 'background 0.15s, color 0.15s',
                  cursor: 'pointer',
                }}>
                  {l.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Notification bell */}
          <button
            aria-label="Notifications"
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', cursor: 'pointer', color: 'var(--text-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1.5a.5.5 0 0 1 .5.5v.55A4.5 4.5 0 0 1 12 7v2.5l1 1.5H2l1-1.5V7A4.5 4.5 0 0 1 7 2.55V2a.5.5 0 0 1 .5-.5ZM6 12.5h3a1.5 1.5 0 0 1-3 0Z" fill="currentColor"/>
            </svg>
          </button>

          {/* Dark mode toggle */}
          {mounted && (
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', cursor: 'pointer', color: 'var(--text-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              {theme === 'dark'
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
          )}

          {/* Profile avatar */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--accent)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#fff',
              transition: 'opacity 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            {userInitial}
          </button>
        </div>
      </div>
    </header>
  )
}
