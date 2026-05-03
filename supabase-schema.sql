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

-- 4. Policy: semua orang bisa membaca (untuk halaman publik /edukasi)
CREATE POLICY "Public read access"
  ON public.articles
  FOR SELECT
  USING (true);

-- 5. Policy: hanya user yang sudah login (authenticated) bisa insert/update/delete
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

-- ============================================================
-- Langkah selanjutnya:
-- 1. Jalankan SQL di atas di Supabase SQL Editor
-- 2. Buat user admin di: Authentication → Users → Add User
--    Gunakan email Anda sendiri sebagai admin
-- 3. Salin .env.example → .env dan isi URL + ANON_KEY
-- 4. Jalankan: npm install @supabase/supabase-js
-- ============================================================
