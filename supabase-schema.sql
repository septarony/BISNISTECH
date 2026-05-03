-- ============================================================
-- SQL Schema untuk Supabase: Tabel articles
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Buat tabel articles
CREATE TABLE IF NOT EXISTS public.articles (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'Tips Umum',
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index untuk pencarian cepat berdasarkan kategori
CREATE INDEX IF NOT EXISTS articles_category_idx ON public.articles (category);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 4. Reset policy agar skrip aman dijalankan berulang kali
DROP POLICY IF EXISTS "Public read access" ON public.articles;
DROP POLICY IF EXISTS "Authenticated insert" ON public.articles;
DROP POLICY IF EXISTS "Authenticated update" ON public.articles;
DROP POLICY IF EXISTS "Authenticated delete" ON public.articles;

-- 5. Policy: semua orang bisa membaca (untuk halaman publik /edukasi)
CREATE POLICY "Public read access"
  ON public.articles
  FOR SELECT
  USING (true);

-- 6. Policy: user login (authenticated) bisa insert/update/delete
CREATE POLICY "Authenticated insert"
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update"
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated delete"
  ON public.articles
  FOR DELETE
  TO authenticated
  USING (true);

-- 7. Grant privilege tabel + sequence
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.articles_id_seq TO authenticated;

-- ============================================================
-- Langkah selanjutnya:
-- 1. Jalankan SQL di atas di Supabase SQL Editor
-- 2. Buat user admin di: Authentication → Users → Add User
--    Gunakan email Anda sendiri sebagai admin
-- 3. Salin .env.example → .env dan isi URL + ANON_KEY
-- 4. Jalankan: npm install @supabase/supabase-js
-- ============================================================
