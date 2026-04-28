# Simulasi Sistem Antrian SEPTA

Sistem simulasi antrian real-time menggunakan React + Vite + Tailwind CSS.

## Fitur

- 🎫 Kiosk: Ambil tiket antrean
- 📊 Monitor Display: Lihat nomor yang sedang dilayani
- 📈 Statistik real-time: Jumlah yang sudah dilayani dan menunggu
- 🔄 Reset simulasi untuk percobaan baru

## Persyaratan

- Node.js 16+ (download dari https://nodejs.org/)
- npm atau yarn

## Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Server (Port 5173)
```bash
npm run dev
```
Buka browser di: `http://localhost:5173`

### 3. Build untuk Production
```bash
npm run build
```
Output di folder `dist/` siap untuk deployment.

## Struktur Folder

```
/src
  ├── components/
  │   └── QueueSystem.jsx    (Komponen utama simulasi)
  ├── App.jsx                (Root component)
  ├── main.jsx               (Entry point)
  └── index.css              (Tailwind styles)
/dist                         (Output build production)
vite.config.js               (Config Vite)
tailwind.config.js           (Config Tailwind)
postcss.config.js            (Config PostCSS)
package.json                 (Dependencies & scripts)
```

## Optimasi untuk RAM 4GB

✅ Menggunakan **React 18 + React-DOM 18** (ringan)
✅ **Vite** untuk bundling cepat & efficient
✅ **Tailwind CSS** minimal build (hanya class yang digunakan)
✅ **terser minification** untuk production
✅ **vendor splitting** agar caching lebih baik
✅ **useCallback hooks** untuk optimize re-render
✅ Console log dihilangkan di production build

Footprint:
- Development: ~50-80 MB node_modules
- Build production: ~150-200 KB minified

## Cara Menggunakan Simulasi

1. **Ambil Tiket (Kiosk - Sisi Kiri)**
   - Tekan tombol "Ambil Tiket"
   - Nomor baru ditambahkan ke daftar antrean
   - Lihat preview daftar menunggu di bawah

2. **Panggil Nomor (Monitor Display - Sisi Kanan)**
   - Tekan "Panggil Nomor Berikutnya"
   - Nomor pertama dari antrean ditampilkan di monitor
   - Update statistik: +1 dilayani, -1 menunggu

3. **Reset Simulasi**
   - Tekan tombol "Reset Simulasi" untuk mulai dari awal

## Integrasi ke Website Utama

Untuk menghubungkan ke website SEPTA utama:

**Option 1: Standalone Server**
- Run dev server Vite di port 5173
- Link di katalog: `<a href="http://localhost:5173">Coba Simulasi</a>`

**Option 2: Build & Embed**
- Build: `npm run build`
- Copy folder `dist/` ke server utama
- Akses via `https://yourdomain.com/simulasi/`

## Support

Untuk pertanyaan atau feedback, hubungi tim SEPTA.
