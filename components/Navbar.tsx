// FILE: components/Navbar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/tasks/new', label: 'Add Task', icon: '➕' },
  { href: '/study', label: 'Study Buddy', icon: '🧠' },
  { href: '/notice', label: 'Notice', icon: '📣' },
]

export default function Navbar() {
  const path = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <nav className="w-full border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-5xl flex items-center gap-4 h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-2 shrink-0">
          <span className="text-xl">🎓</span>
          <span className="font-bold text-sm tracking-tight hidden sm:block">CampusFlow</span>
        </Link>

        {/* Nav links */}
        <div className="flex gap-1 flex-1 flex-wrap">
          {links.map(l => {
            const active = path === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
              >
                <span>{l.icon}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Dark mode toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all shrink-0"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        )}
      </div>
    </nav>
  )
}
