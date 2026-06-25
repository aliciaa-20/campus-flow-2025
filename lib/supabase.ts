// FILE: lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nnbwptvluikbxgxfryer.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uYndwdHZsdWlrYnhneGZyeWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNTYwMjUsImV4cCI6MjA5NzkzMjAyNX0.iPF3WdgBiAuRvTF6KrgNC1wiDSlmnhASjBTKMYk7zp0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
