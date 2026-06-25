// FILE: app/login/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Set a cookie so middleware knows user is authenticated
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

  // DEMO BYPASS: set a cookie so middleware lets us through
  const handleDemoLogin = () => {
    document.cookie = 'demo_bypass=true; path=/; max-age=86400; SameSite=Lax'
    router.push('/dashboard')
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">CampusFlow 🎓</h1>
          <p className="text-muted-foreground">Never miss a deadline again.</p>
        </div>
        <div className="border rounded-xl p-6 bg-card shadow-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            view="sign_in"
            showLinks={true}
          />
          {/* DEMO BYPASS BUTTON */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground mb-2">— For demo / testing —</p>
            <button
              onClick={handleDemoLogin}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              🚀 Enter Demo (Skip Login)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
