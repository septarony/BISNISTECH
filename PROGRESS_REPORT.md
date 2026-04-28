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
- [ ] Verify new Vercel deployment is live (latest commit)

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

## Monitoring Checklist (Post-Push)
1. GitHub commit exists with these files changed
2. Vercel auto-deploy triggered from latest commit
3. Root URL opens without 404
4. Simulasi page opens at `/simulasi/`
5. Browser DevTools Network confirms smaller icon assets

## Next Action
- Push commit to `main` and observe Vercel deployment status.

## Incremental Update (Katalog 404)
- Incident: `https://bisnistech.vercel.app/katalog-antrian.html` returned 404
- Root cause: `katalog-antrian.html` was not included in Vite `rollupOptions.input`
- Fix: add `katalog: resolve(__dirname, 'katalog-antrian.html')` in build input
- Validation: local build now outputs `dist/katalog-antrian.html`
