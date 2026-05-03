import { createClient } from '@supabase/supabase-js'

// Ganti kedua nilai di bawah ini dengan milik Anda dari:
// Supabase Dashboard → Project Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diisi di file .env')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
