# Progress Report - Deployment & Optimization

Date: 2026-04-29

## Current Status
- [x] Root 404 on Vercel diagnosed
- [x] Vite build fixed to output root page and simulasi page
- [x] Vite build fixed to output katalog page (`/katalog-antrian.html`)
- [x] Production link cleanup (removed localhost URL)
- [x] Vercel config added
- [x] Asset optimization pass completed
- [x] Commit and push to GitHub
- [x] Verify live deployment endpoint health

## What Was Changed
1. Build configuration for multi-page output:
   - Added root entry (`index.html`), katalog (`katalog-antrian.html`), and `simulasi/index.html`
2. Deployment configuration:
   - Added `vercel.json` with build and output settings
3. URL fix:
   - Changed simulasi link from localhost to `/simulasi/`
4. Frontend asset optimization:
   - Replaced heavy icon usage with optimized files:
     - `favicon-64.png`
     - `apple-touch-icon.png`
     - `logo-256.png`

## Optimization Metrics
Before:
- Main icon asset in build: 1331.52 kB (`icon 512x512`)

After:
- `logo-256`: 111.94 kB
- `apple-touch-icon`: 56.74 kB
- `favicon-64`: 8.45 kB

Estimated reduction for icon-related first-load assets:
- From 1331.52 kB to 177.13 kB
- Reduction: 1154.39 kB (~86.7%)

## Build Verification
- Command: `npm run build`
- Result: success
- Output includes:
  - `dist/index.html`
  - `dist/katalog-antrian.html`
  - `dist/simulasi/index.html`

## Live Endpoint Health Check
- Checked: `https://bisnistech.vercel.app/`
- Checked: `https://bisnistech.vercel.app/index.html`
- Checked: `https://bisnistech.vercel.app/katalog-antrian.html`
- Checked: `https://bisnistech.vercel.app/simulasi/`
- Checked: `https://bisnistech.vercel.app/simulasi/index.html`
- Result: all endpoints return page content (no `404: NOT_FOUND`)

## Monitoring Checklist (Post-Push)
1. GitHub commit exists with these files changed
2. Vercel auto-deploy triggered from latest commit
3. Root URL opens without 404
4. Katalog URL opens at `/katalog-antrian.html`
5. Simulasi page opens at `/simulasi/`
6. Browser DevTools Network confirms smaller icon assets

## Next Action
- Continue passive monitoring after next content update/deploy.

## Incremental Update (Katalog 404)
- Incident: `https://bisnistech.vercel.app/katalog-antrian.html` returned 404
- Root cause: `katalog-antrian.html` was not included in Vite `rollupOptions.input`
- Fix: add `katalog: resolve(__dirname, 'katalog-antrian.html')` in build input
- Validation: local build now outputs `dist/katalog-antrian.html`

---

# Progress Report - Sitemap & Code Cleanup

Date: 2026-05-04

## Current Status
- [x] Sitemap.xml diperbarui sesuai halaman yang benar-benar ada
- [x] Dead CSS dihapus dari style.css
- [x] Bug sectionMeta keys di script.js diperbaiki
- [x] Komentar developer tidak perlu dihapus dari index.html

---

## Sitemap Update

Kedua file sitemap (`sitemap.xml` dan `public/sitemap.xml`) diperbarui:

| URL | Priority | Keterangan |
|-----|----------|------------|
| `/` | 1.0 | Halaman utama |
| `/katalog/mesin-antrian` | 0.9 | katalog-antrian.html via rewrite |
| `/edukasi` | 0.8 | edukasi/index.html |
| `/simulasi` | 0.7 | simulasi/index.html |
| `/layanan/mesin-antrian` | 0.8 | Anchor redirect ke homepage |
| `/layanan/security` | 0.8 | Anchor redirect ke homepage |
| `/layanan/ppob` | 0.7 | Anchor redirect ke homepage |
| `/layanan/kontak` | 0.7 | Anchor redirect ke homepage |

Halaman `/admin` tidak diikutkan agar tidak terindeks mesin pencari.
`lastmod` diperbarui ke `2026-05-04`.

---

## Code Cleanup

### style.css — Hapus ~50 baris CSS tidak terpakai

**Dead CSS dihapus:**
- `.name-grid`, `.name-card`, `.name-card:hover`, `.name-card.active-name`
- `.name-label`, `.name-card h3`, `.name-card p`, `.name-note`
- `.product-dev-notice`, `.dev-icon`, `.soon-badge`, `.coming-price`
- Responsive rule `.product-dev-notice` di `@media (max-width: 640px)`

Tidak ada elemen HTML di halaman manapun yang menggunakan class-class tersebut.

### script.js — Perbaiki `sectionMeta` keys

| Sebelum | Sesudah | Alasan |
|---------|---------|--------|
| `hero` | `home` | Section ID di HTML adalah `id="home"` |
| `'mesin-antrian'` | `antrian` | Section ID di HTML adalah `id="antrian"` |
| `security` | *(dihapus)* | Tidak ada `<section id="security">`, hanya div tersembunyi |

Bug ini menyebabkan dynamic meta tag tidak pernah aktif untuk section home dan antrian.

### index.html — 2 pembersihan minor

- Hapus class `antrian-cards-grid` dari div (tidak ada CSS-nya, class mubazir)
- Hapus komentar developer `<!-- UPDATE: Ganti src ... -->` di dalam iframe peta

---

## File Tidak Terpakai Teridentifikasi

- `index-vite.html` — entry point React lama, tidak dirujuk oleh vercel.json, vite.config.js, maupun halaman manapun. **Dihapus (2026-05-04).**
