import { createClient } from '@supabase/supabase-js'

// Ganti kedua nilai di bawah ini dengan milik Anda dari:
// Supabase Dashboard → Project Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const missingSupabaseVars = [
  !SUPABASE_URL && 'VITE_SUPABASE_URL',
  !SUPABASE_ANON_KEY && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean)

export const isSupabaseConfigured = missingSupabaseVars.length === 0

if (!isSupabaseConfigured) {
  console.error(
    `Konfigurasi Supabase belum lengkap. Variabel yang belum diisi: ${missingSupabaseVars.join(', ')}`
  )
}

export const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
