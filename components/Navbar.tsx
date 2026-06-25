// FILE: components/Navbar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

const links = [
  { href: '/dashboard', label: '🏠 Dashboard' },
  { href: '/tasks/new', label: '➕ Add Task' },
  { href: '/study', label: '🧠 Study Buddy' },
  { href: '/notice', label: '📣 Notice' },
]

export default function Navbar() {
  const path = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <nav className="w-full border-b px-4 py-3 flex items-center gap-4 flex-wrap">
      <span className="font-bold text-base mr-2">CampusFlow 🎓</span>
      <div className="flex gap-1 flex-wrap flex-1">
        {links.map(l => (
          <Link key={l.href} href={l.href}>
            <Button
              variant={path === l.href ? 'default' : 'ghost'}
              size="sm"
              className="text-xs"
            >
              {l.label}
            </Button>
          </Link>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </Button>
    </nav>
  )
}
