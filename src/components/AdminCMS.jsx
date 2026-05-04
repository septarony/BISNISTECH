import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TipTapImage from '@tiptap/extension-image'
import { supabase, isSupabaseConfigured, missingSupabaseVars } from '../supabaseClient'

// ─── Konstanta ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Mesin Antrian', 'Security System', 'PPOB', 'Tips Umum']
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

const EMPTY_FORM = { title: '', content: '<p></p>', category: CATEGORIES[0], image_url: '' }

// ─── Toolbar editor ──────────────────────────────────────────────────────────
function RichToolbar({ editor }) {
  const [linkUrl, setLinkUrl]       = useState('')
  const [showLinkBox, setShowLinkBox] = useState(false)
  const fileRef = useRef(null)

  if (!editor) return null

  function toggleBold()   { editor.chain().focus().toggleBold().run() }
  function toggleItalic() { editor.chain().focus().toggleItalic().run() }
  function toggleStrike() { editor.chain().focus().toggleStrike().run() }
  function toggleBullet() { editor.chain().focus().toggleBulletList().run() }
  function toggleOrdered(){ editor.chain().focus().toggleOrderedList().run() }
  function toggleHeading(level){ editor.chain().focus().toggleHeading({ level }).run() }

  function applyLink() {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run()
    } else {
      const href = /^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : 'https://' + linkUrl.trim()
      editor.chain().focus().setLink({ href, target: '_blank' }).run()
    }
    setLinkUrl('')
    setShowLinkBox(false)
  }

  function insertImageFromFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE_BYTES) { alert('Ukuran gambar maksimal 2 MB.'); e.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = () => {
      editor.chain().focus().setImage({ src: String(reader.result) }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const btn = (active, title, onClick, children) => (
    <button
      key={title}
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm font-medium transition ${
        active ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
      }`}
    >{children}</button>
  )

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-gray-700 bg-gray-900/60">
      {btn(editor.isActive('bold'),           'Bold',          toggleBold,          <b>B</b>)}
      {btn(editor.isActive('italic'),         'Italic',        toggleItalic,        <em>I</em>)}
      {btn(editor.isActive('strike'),         'Coret',         toggleStrike,        <s>S</s>)}
      <span className="w-px h-5 bg-gray-700 mx-1" />
      {btn(editor.isActive('heading',{level:2}), 'Heading 2', ()=>toggleHeading(2), 'H2')}
      {btn(editor.isActive('heading',{level:3}), 'Heading 3', ()=>toggleHeading(3), 'H3')}
      <span className="w-px h-5 bg-gray-700 mx-1" />
      {btn(editor.isActive('bulletList'),     'Daftar Bullet', toggleBullet,        '• List')}
      {btn(editor.isActive('orderedList'),    'Daftar Angka',  toggleOrdered,       '1. List')}
      <span className="w-px h-5 bg-gray-700 mx-1" />
      {/* Link */}
      <div className="relative">
        {btn(editor.isActive('link'), 'Tambah Link', () => {
          if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return }
          setLinkUrl(editor.getAttributes('link').href || '')
          setShowLinkBox(v => !v)
        }, '🔗 Link')}
        {showLinkBox && (
          <div className="absolute top-8 left-0 z-20 bg-gray-900 border border-gray-700 rounded-lg p-2 flex gap-2 shadow-xl w-72">
            <input
              autoFocus
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyLink() } if (e.key === 'Escape') setShowLinkBox(false) }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button type="button" onClick={applyLink} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1 rounded-md">OK</button>
            <button type="button" onClick={() => setShowLinkBox(false)} className="text-gray-400 hover:text-white text-xs px-1.5">✕</button>
          </div>
        )}
      </div>
      <span className="w-px h-5 bg-gray-700 mx-1" />
      {/* Gambar inline */}
      <button
        type="button"
        title="Sisipkan Gambar"
        onClick={() => fileRef.current?.click()}
        className="px-2 py-1 rounded text-sm text-gray-300 hover:bg-gray-700 transition"
      >🖼 Gambar</button>
      <input ref={fileRef} type="file" accept="image/*" onChange={insertImageFromFile} className="hidden" />
    </div>
  )
}

// ─── Nav config ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',          icon: '🏠' },
  { id: 'cms',        label: 'Manajemen Konten',    icon: '📝' },
  { id: 'keuangan',   label: 'Keuangan & PPOB',     icon: '💰' },
  { id: 'settings',   label: 'Pengaturan Sistem',   icon: '⚙️' },
]

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function AdminCMS() {
  const [session, setSession]       = useState(null)
  const [loading, setLoading]       = useState(true)

  // Cek session saat mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <LoadingScreen />
  if (!isSupabaseConfigured) return <ConfigErrorPage missingVars={missingSupabaseVars} />
  if (!ADMIN_EMAIL) return <ConfigErrorPage missingVars={['VITE_ADMIN_EMAIL']} />
  if (!session) return <LoginPage />
  if (session.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
    return <UnauthorizedPage email={session.user?.email || '-'} />
  }
  return <Dashboard session={session} />
}

function ConfigErrorPage({ missingVars = [] }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 border border-amber-800 rounded-2xl p-6">
        <h2 className="text-amber-300 font-semibold mb-2">Konfigurasi belum lengkap</h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          Tambahkan variabel berikut di file <span className="font-mono">.env</span>:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-amber-200">
          {missingVars.map(name => (
            <li key={name} className="font-mono">{name}</li>
          ))}
        </ul>
        <p className="text-gray-400 text-xs leading-relaxed mt-3">
          Setelah deploy ke Vercel, pastikan semua variabel yang sama juga diisi pada Environment Variables project.
        </p>
      </div>
    </div>
  )
}

function UnauthorizedPage({ email }) {
  async function handleBackToLogin() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 border border-red-800 rounded-2xl p-6">
        <h2 className="text-red-300 font-semibold mb-2">Akses ditolak</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Email <span className="font-mono">{email}</span> tidak terdaftar sebagai admin CMS.
        </p>
        <button
          onClick={handleBackToLogin}
          className="bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 text-sm transition"
        >
          Keluar
        </button>
      </div>
    </div>
  )
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="text-white font-bold text-xl tracking-tight">SEPTA Admin</span>
          </div>
          <p className="text-gray-400 text-sm">Masuk ke panel manajemen konten</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@email.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg px-3.5 py-2.5 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition"
          >
            {busy ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Dashboard (shell with sidebar navigation) ───────────────────────────────
function Dashboard({ session }) {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // shared article state — lifted so CMS section can use it
  const [articles, setArticles]   = useState([])
  const [articlesLoading, setArticlesLoading] = useState(true)

  const fetchArticles = useCallback(async () => {
    setArticlesLoading(true)
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, content, category, image_url, created_at')
      .order('created_at', { ascending: false })
    if (!error) setArticles(data || [])
    setArticlesLoading(false)
  }, [])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  async function handleLogout() { await supabase.auth.signOut() }

  const navLabel = NAV_ITEMS.find(n => n.id === activeMenu)?.label || ''

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">

      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto lg:flex`}>
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
          <div>
            <div className="font-bold text-sm text-white leading-tight">SEPTA Admin</div>
            <div className="text-[11px] text-gray-500 truncate max-w-[140px]">{session.user.email}</div>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveMenu(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left
                ${activeMenu === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-900/40 hover:text-red-300 transition text-left"
          >
            <span className="text-base w-5 text-center">🚪</span> Keluar
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Buka menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-sm flex-1">{navLabel}</h1>
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto">
          {activeMenu === 'dashboard' && <SectionDashboard articles={articles} articlesLoading={articlesLoading} />}
          {activeMenu === 'cms'       && <SectionCMS articles={articles} articlesLoading={articlesLoading} fetchArticles={fetchArticles} />}
          {activeMenu === 'keuangan'  && <SectionKeuangan />}
          {activeMenu === 'settings'  && <SectionSettings session={session} />}
        </main>
      </div>
    </div>
  )
}

// ─── Section: Dashboard Utama ─────────────────────────────────────────────────
function SectionDashboard({ articles, articlesLoading }) {
  const totalArticles = articles.length
  const latestArticle = articles[0]

  const stats = [
    { label: 'Total Artikel', value: articlesLoading ? '...' : totalArticles, icon: '📄', color: 'indigo' },
    { label: 'Pengunjung Bulan Ini', value: '—', icon: '👥', color: 'cyan', note: 'Pasang analytics untuk data ini' },
    { label: 'Transaksi PPOB', value: '—', icon: '⚡', color: 'amber', note: 'Integrasi gateway diperlukan' },
    { label: 'Pendapatan Bulan Ini', value: '—', icon: '💵', color: 'emerald', note: 'Hubungkan ke laporan keuangan' },
  ]

  const notifications = [
    { type: 'info',    msg: 'Konfigurasi variabel lingkungan Supabase sudah aktif.' },
    { type: 'warning', msg: 'Belum ada integrasi payment gateway. Konfigurasikan di menu Pengaturan.' },
    { type: 'warning', msg: 'WhatsApp CRM belum terhubung. Tambahkan API key di Pengaturan.' },
    { type: 'success', msg: latestArticle ? `Artikel terbaru: "${latestArticle.title}"` : 'Belum ada artikel. Buat artikel pertama di menu CMS.' },
  ]

  const colorMap = {
    indigo:  { card: 'border-indigo-800/60 bg-indigo-950/40', icon: 'bg-indigo-700/40 text-indigo-300', val: 'text-indigo-200' },
    cyan:    { card: 'border-cyan-800/60 bg-cyan-950/40',     icon: 'bg-cyan-700/40 text-cyan-300',     val: 'text-cyan-200' },
    amber:   { card: 'border-amber-800/60 bg-amber-950/40',   icon: 'bg-amber-700/40 text-amber-300',   val: 'text-amber-200' },
    emerald: { card: 'border-emerald-800/60 bg-emerald-950/40', icon: 'bg-emerald-700/40 text-emerald-300', val: 'text-emerald-200' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h2 className="text-lg font-bold mb-1">Ringkasan Statistik</h2>
        <p className="text-gray-400 text-sm">Gambaran operasional bisnis saat ini.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const c = colorMap[s.color]
          return (
            <div key={s.label} className={`border rounded-2xl p-4 ${c.card}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3 ${c.icon}`}>{s.icon}</div>
              <div className={`text-2xl font-bold mb-0.5 ${c.val}`}>{s.value}</div>
              <div className="text-xs font-medium text-gray-300">{s.label}</div>
              {s.note && <div className="text-[10px] text-gray-500 mt-1 leading-tight">{s.note}</div>}
            </div>
          )
        })}
      </div>

      {/* Notifications */}
      <div>
        <h2 className="text-base font-bold mb-3">Notifikasi Penting</h2>
        <div className="space-y-2.5">
          {notifications.map((n, i) => {
            const styles = {
              info:    'bg-blue-950/50 border-blue-800/60 text-blue-200',
              warning: 'bg-amber-950/50 border-amber-800/60 text-amber-200',
              success: 'bg-emerald-950/50 border-emerald-800/60 text-emerald-200',
            }
            const icons = { info: 'ℹ️', warning: '⚠️', success: '✅' }
            return (
              <div key={i} className={`flex items-start gap-3 border rounded-xl px-4 py-3 text-sm ${styles[n.type]}`}>
                <span className="flex-shrink-0 mt-0.5">{icons[n.type]}</span>
                <span>{n.msg}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent articles mini-table */}
      <div>
        <h2 className="text-base font-bold mb-3">Artikel Terbaru</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {articlesLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">Belum ada artikel.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Judul</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Kategori</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {articles.slice(0, 5).map(a => (
                  <tr key={a.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-5 py-3 font-medium text-white line-clamp-1 max-w-xs">{a.title}</td>
                    <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">{a.category}</td>
                    <td className="px-5 py-3 text-gray-400 hidden md:table-cell">
                      {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Section: Manajemen Konten (CMS) ─────────────────────────────────────────
function SectionCMS({ articles, articlesLoading, fetchArticles }) {
  const [cmsTab, setCmsTab] = useState('artikel') // 'artikel' | 'media'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Tab bar */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {[{ id: 'artikel', label: '📄 Editor Artikel' }, { id: 'media', label: '🖼️ Media Library' }].map(t => (
          <button
            key={t.id}
            onClick={() => setCmsTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              cmsTab === t.id ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {cmsTab === 'artikel' && (
        <ArticleManager articles={articles} loading={articlesLoading} fetchArticles={fetchArticles} />
      )}
      {cmsTab === 'media' && (
        <MediaLibrary articles={articles} />
      )}
    </div>
  )
}

// ─── Media Library ────────────────────────────────────────────────────────────
function MediaLibrary({ articles }) {
  // Extract all image_url from articles as a simple media library
  const images = articles
    .filter(a => a.image_url && a.image_url.trim())
    .map(a => ({ src: a.image_url, title: a.title, id: a.id }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold">Media Library</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {images.length} aset visual dari artikel. Gambar dikelola langsung via editor artikel.
          </p>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-gray-700 rounded-2xl text-gray-500 text-sm">
          <span className="text-3xl mb-2">🖼️</span>
          <p>Belum ada gambar tersimpan.</p>
          <p className="text-xs text-gray-600 mt-1">Upload gambar melalui editor artikel di tab "Editor Artikel".</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((img, i) => (
            <div key={`${img.id}-${i}`} className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <img
                src={img.src}
                alt={img.title}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 p-2">
                <p className="text-white text-[11px] text-center leading-tight line-clamp-3">{img.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-400">
        <strong className="text-gray-300">Tips optimasi:</strong> Kompres gambar di bawah 2 MB sebelum upload. Gunakan format WebP untuk performa terbaik. Gambar disimpan sebagai Base64 bersama konten artikel.
      </div>
    </div>
  )
}

// ─── Section: Keuangan & PPOB ─────────────────────────────────────────────────
const MOCK_TRANSACTIONS = [
  { id: 'TRX-001', date: '2026-05-04', type: 'Pulsa', product: 'Pulsa 50.000 – Telkomsel', customer: '0812-xxxx-3421', amount: 51500, margin: 1500, status: 'Sukses' },
  { id: 'TRX-002', date: '2026-05-04', type: 'Token Listrik', product: 'Token PLN 100.000', customer: '08xx-xxxx-7812', amount: 101500, margin: 1500, status: 'Sukses' },
  { id: 'TRX-003', date: '2026-05-03', type: 'Pulsa', product: 'Pulsa 20.000 – Indosat', customer: '0856-xxxx-0034', amount: 21000, margin: 1000, status: 'Sukses' },
  { id: 'TRX-004', date: '2026-05-03', type: 'BPJS', product: 'BPJS Kesehatan 1 Bulan', customer: '0878-xxxx-5510', amount: 42500, margin: 2500, status: 'Pending' },
  { id: 'TRX-005', date: '2026-05-02', type: 'Token Listrik', product: 'Token PLN 200.000', customer: '0813-xxxx-9921', amount: 202000, margin: 2000, status: 'Sukses' },
  { id: 'TRX-006', date: '2026-05-01', type: 'Pulsa', product: 'Pulsa 100.000 – Telkomsel', customer: '0812-xxxx-4400', amount: 102000, margin: 2000, status: 'Gagal' },
]

function SectionKeuangan() {
  const [keuTab, setKeuTab] = useState('log') // 'log' | 'laporan'

  const sukses    = MOCK_TRANSACTIONS.filter(t => t.status === 'Sukses')
  const totalRev  = sukses.reduce((a, t) => a + t.amount, 0)
  const totalMargin = sukses.reduce((a, t) => a + t.margin, 0)
  const totalCost = totalRev - totalMargin

  const fmt = (n) => 'Rp ' + n.toLocaleString('id-ID')

  const statusBadge = {
    Sukses:  'bg-emerald-900/50 text-emerald-300 border-emerald-800',
    Pending: 'bg-amber-900/50 text-amber-300 border-amber-800',
    Gagal:   'bg-red-900/50 text-red-300 border-red-800',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-4 bg-amber-950/40 border border-amber-800/60 rounded-xl px-4 py-3 text-xs text-amber-300">
        ⚠️ Data transaksi di bawah adalah contoh statis (mock data). Hubungkan ke API payment gateway WISEP untuk data real-time.
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {[{ id: 'log', label: '📋 Log Transaksi WISEP' }, { id: 'laporan', label: '📊 Laporan Laba/Rugi' }].map(t => (
          <button key={t.id} onClick={() => setKeuTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${keuTab === t.id ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {keuTab === 'log' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">{MOCK_TRANSACTIONS.length} transaksi tercatat</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  {['ID', 'Tanggal', 'Jenis', 'Produk', 'Pelanggan', 'Nominal', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {MOCK_TRANSACTIONS.map(t => (
                  <tr key={t.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.id}</td>
                    <td className="px-4 py-3 text-gray-300">{t.date}</td>
                    <td className="px-4 py-3 text-gray-300">{t.type}</td>
                    <td className="px-4 py-3 text-white">{t.product}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.customer}</td>
                    <td className="px-4 py-3 text-white font-medium">{fmt(t.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge[t.status]}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {keuTab === 'laporan' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Pendapatan (Bruto)', val: fmt(totalRev), color: 'indigo', icon: '💵' },
              { label: 'Total Modal / HPP', val: fmt(totalCost), color: 'gray', icon: '📦' },
              { label: 'Total Margin Keuntungan', val: fmt(totalMargin), color: 'emerald', icon: '📈' },
            ].map(c => (
              <div key={c.label} className={`border rounded-2xl p-5 ${c.color === 'emerald' ? 'border-emerald-800/60 bg-emerald-950/40' : c.color === 'indigo' ? 'border-indigo-800/60 bg-indigo-950/40' : 'border-gray-700 bg-gray-900'}`}>
                <div className="text-xl mb-2">{c.icon}</div>
                <div className={`text-xl font-bold mb-0.5 ${c.color === 'emerald' ? 'text-emerald-300' : c.color === 'indigo' ? 'text-indigo-300' : 'text-gray-200'}`}>{c.val}</div>
                <div className="text-xs text-gray-400">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Breakdown per type */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Rincian per Jenis Layanan</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">Jenis</th>
                    <th className="text-left px-5 py-3 font-medium">Transaksi Sukses</th>
                    <th className="text-left px-5 py-3 font-medium">Pendapatan</th>
                    <th className="text-left px-5 py-3 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {['Pulsa', 'Token Listrik', 'BPJS'].map(type => {
                    const rows = sukses.filter(t => t.type === type)
                    const rev = rows.reduce((a, t) => a + t.amount, 0)
                    const mar = rows.reduce((a, t) => a + t.margin, 0)
                    return (
                      <tr key={type} className="hover:bg-gray-800/40 transition">
                        <td className="px-5 py-3 font-medium text-white">{type}</td>
                        <td className="px-5 py-3 text-gray-300">{rows.length} transaksi</td>
                        <td className="px-5 py-3 text-white">{fmt(rev)}</td>
                        <td className="px-5 py-3 text-emerald-300 font-medium">{fmt(mar)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-600">* Data diatas adalah contoh. Laporan final akan tersedia setelah integrasi payment gateway aktif.</p>
        </div>
      )}
    </div>
  )
}

// ─── Section: Pengaturan Sistem ───────────────────────────────────────────────
function SectionSettings({ session }) {
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
  const labelCls = "block text-xs font-medium text-gray-400 mb-1.5"

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Konfigurasi PWA & Vercel ── */}
      <section>
        <h2 className="text-base font-bold mb-1">Konfigurasi PWA & Vercel</h2>
        <p className="text-gray-400 text-sm mb-4">Pengaturan teknis deployment dan integrasi layanan eksternal.</p>
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Supabase URL</label>
              <input type="url" placeholder="https://xxxx.supabase.co" className={inputCls} defaultValue={import.meta.env.VITE_SUPABASE_URL || ''} readOnly />
              <p className="text-[11px] text-gray-500 mt-1">Dari environment variable VITE_SUPABASE_URL.</p>
            </div>
            <div>
              <label className={labelCls}>Supabase Anon Key</label>
              <input type="password" placeholder="••••••••••••••••" className={inputCls} defaultValue={import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••••••' : ''} readOnly />
              <p className="text-[11px] text-gray-500 mt-1">Dari environment variable VITE_SUPABASE_ANON_KEY.</p>
            </div>
          </div>

          <div>
            <label className={labelCls}>API Key Payment Gateway (WISEP / PPOB)</label>
            <input type="password" placeholder="Masukkan API key..." className={inputCls} />
            <p className="text-[11px] text-gray-500 mt-1">Simpan via Vercel Environment Variables, bukan di kode sumber.</p>
          </div>

          <div>
            <label className={labelCls}>WhatsApp CRM – API Key / Token</label>
            <input type="password" placeholder="Token WhatsApp Business API..." className={inputCls} />
            <p className="text-[11px] text-gray-500 mt-1">Gunakan WhatsApp Cloud API atau penyedia pihak ketiga (Fonnte, Wablas, dll).</p>
          </div>

          <div>
            <label className={labelCls}>Nomor WhatsApp Bisnis</label>
            <input type="tel" placeholder="628xxxxxxxxxx" className={inputCls} />
          </div>

          <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3 text-xs text-amber-300">
            ⚠️ Pengaturan di form ini bersifat referensi. Semua API key dan secret harus disimpan sebagai <strong>Environment Variables di Vercel</strong>, bukan di dalam database atau kode sumber.
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition">
              Simpan Catatan
            </button>
            {saved && <span className="text-emerald-400 text-sm">✅ Tersimpan</span>}
          </div>
        </form>
      </section>

      {/* ── Manajemen User Admin ── */}
      <section>
        <h2 className="text-base font-bold mb-1">Manajemen User Admin</h2>
        <p className="text-gray-400 text-sm mb-4">Daftar akun yang memiliki akses ke panel admin ini.</p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-gray-800/40 transition">
                <td className="px-5 py-3 font-medium text-white">{session.user.email}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-800">Super Admin</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-800">Aktif</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-400">
          Untuk menambah admin baru, buat user baru di <strong className="text-gray-300">Supabase Authentication</strong> dan tambahkan email-nya ke environment variable <span className="font-mono">VITE_ADMIN_EMAIL</span>. Multi-admin (role-based) dapat diimplementasikan dengan tabel <span className="font-mono">admin_users</span> di Supabase.
        </div>
      </section>
    </div>
  )
}

// ─── Article Manager (dipindah dari Dashboard langsung) ───────────────────────
function ArticleManager({ articles, loading, fetchArticles }) {
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editId, setEditId]       = useState(null)
  const [formOpen, setFormOpen]   = useState(false)
  const [deleteId, setDeleteId]   = useState(null)
  const [toast, setToast]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      TipTapImage.configure({ inline: true, allowBase64: true }),
    ],
    content: EMPTY_FORM.content,
    onUpdate: ({ editor: e }) => setForm(current => ({ ...current, content: e.getHTML() })),
    editorProps: {
      attributes: {
        class: 'min-h-[240px] px-4 py-3 focus:outline-none text-gray-100 text-sm leading-relaxed',
      },
    },
  })

  // Sync konten editor setiap kali form dibuka (edit/create)
  const formOpenRef = useRef(false)
  useEffect(() => {
    if (formOpen && !formOpenRef.current) {
      formOpenRef.current = true
      if (editor && !editor.isDestroyed) {
        editor.commands.setContent(form.content || '<p></p>', false)
      }
    } else if (!formOpen) {
      formOpenRef.current = false
    }
  }, [formOpen, editor]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast helper ───────────────────────────────────────────────────────────
  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Buka form create ───────────────────────────────────────────────────────
  function openCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  // ── Buka form edit ─────────────────────────────────────────────────────────
  async function openEdit(id) {
    const data = articles.find(article => article.id === id)
    if (!data) {
      showToast('error', 'Data artikel tidak ditemukan. Silakan refresh halaman.')
      return
    }

    setEditId(id)
    setForm({ title: data.title, content: data.content, category: data.category, image_url: data.image_url || '' })
    setFormOpen(true)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('error', 'File harus berupa gambar.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast('error', 'Ukuran gambar maksimal 2 MB.')
      e.target.value = ''
      return
    }

    setUploadingImage(true)

    try {
      const imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Gagal membaca file gambar.'))
        reader.readAsDataURL(file)
      })

      setForm(current => ({ ...current, image_url: imageUrl }))
      showToast('success', 'Gambar berhasil dimuat ke artikel.')
    } catch (error) {
      showToast('error', error.message || 'Gagal memproses gambar.')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  // ── Submit form (create / update) ──────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    const htmlContent = editor ? editor.getHTML() : form.content
    const textContent = (editor ? editor.getText() : form.content).trim()
    if (!form.title.trim() || !textContent) {
      showToast('error', 'Judul dan isi artikel wajib diisi.')
      return
    }
    setSaving(true)

    const payload = {
      title:     form.title.trim(),
      content:   htmlContent,
      category:  form.category,
      image_url: form.image_url.trim() || null,
    }

    let count
    let error
    if (editId) {
      ;({ count, error } = await supabase
        .from('articles')
        .update(payload, { count: 'exact' })
        .eq('id', editId))
    } else {
      ;({ count, error } = await supabase
        .from('articles')
        .insert(payload, { count: 'exact' }))
    }

    setSaving(false)
    if (error) return showToast('error', error.message)

    if (editId && (!count || count < 1)) {
      return showToast('error', 'Perubahan tidak tersimpan. Kemungkinan policy database (RLS) menolak update.')
    }
    if (!editId && (!count || count < 1)) {
      return showToast('error', 'Artikel baru gagal disimpan. Periksa policy database atau sesi login admin.')
    }

    showToast('success', editId ? 'Artikel berhasil diperbarui.' : 'Artikel berhasil ditambahkan.')
    setFormOpen(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    fetchArticles()
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    const currentDeleteId = deleteId
    const { count, error } = await supabase
      .from('articles')
      .delete({ count: 'exact' })
      .eq('id', currentDeleteId)

    setDeleteId(null)
    if (error) return showToast('error', error.message)
    if (!count || count < 1) {
      return showToast('error', 'Artikel gagal dihapus. Kemungkinan policy database (RLS) menolak delete.')
    }

    showToast('success', 'Artikel berhasil dihapus.')
    fetchArticles()
  }

  // ── Category badge color ───────────────────────────────────────────────────
  const categoryColor = {
    'Mesin Antrian':  'bg-indigo-900/60 text-indigo-300',
    'Security System':'bg-cyan-900/60  text-cyan-300',
    'PPOB':           'bg-amber-900/60 text-amber-300',
    'Tips Umum':      'bg-gray-700/60  text-gray-300',
  }

  return (
    <div>
        {/* ── Page title + CTA ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Editor Artikel</h1>
            <p className="text-gray-400 text-sm mt-0.5">{articles.length} artikel tersimpan</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition"
          >
            <span className="text-lg leading-none">+</span> Artikel Baru
          </button>
        </div>

        {/* ── Table ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-3xl mb-3">📝</p>
              <p className="text-sm">Belum ada artikel. Mulai dengan membuat artikel baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3.5 font-medium">Judul</th>
                    <th className="text-left px-5 py-3.5 font-medium">Kategori</th>
                    <th className="text-left px-5 py-3.5 font-medium hidden md:table-cell">Dibuat</th>
                    <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {articles.map(a => (
                    <tr key={a.id} className="hover:bg-gray-800/50 transition">
                      <td className="px-5 py-4">
                        <div className="font-medium text-white line-clamp-1 max-w-xs">{a.title}</div>
                        {a.image_url && (
                          <div className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{a.image_url}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor[a.category] || 'bg-gray-700 text-gray-300'}`}>
                          {a.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 hidden md:table-cell">
                        {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(a.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:border-indigo-600 rounded-lg px-3 py-1.5 transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(a.id)}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 rounded-lg px-3 py-1.5 transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* ── Modal Form (Create / Edit) ── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm pt-12 px-4 pb-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-bold text-base">{editId ? 'Edit Artikel' : 'Artikel Baru'}</h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none transition">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Judul */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Judul Artikel <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="Masukkan judul artikel..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Kategori <span className="text-red-400">*</span></label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* URL Gambar */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">URL Gambar <span className="text-gray-600">(opsional)</span></label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://example.com/gambar.jpg"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <p className="text-[11px] text-gray-500 mt-1.5">Bisa isi URL eksternal, atau pilih file gambar langsung dari komputer di bawah.</p>
              </div>

              {/* Upload Gambar */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Upload Gambar Langsung</label>
                <label className="flex items-center justify-center w-full min-h-28 border border-dashed border-gray-700 rounded-xl bg-gray-800/50 px-4 py-5 text-center cursor-pointer hover:border-indigo-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-200">{uploadingImage ? 'Memproses gambar...' : 'Klik untuk pilih gambar'}</p>
                    <p className="text-xs text-gray-500 mt-1">Format bebas, maksimal 2 MB. Gambar akan langsung disimpan bersama artikel.</p>
                  </div>
                </label>
                {form.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
                    <img src={form.image_url} alt="Preview artikel" className="w-full max-h-56 object-cover" />
                    <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-gray-800">
                      <span className="text-[11px] text-gray-500 truncate">Preview gambar artikel</span>
                      <button
                        type="button"
                        onClick={() => setForm(current => ({ ...current, image_url: '' }))}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Hapus gambar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Isi Artikel - Rich Text Editor */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Isi Artikel <span className="text-red-400">*</span></label>
                <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition">
                  <RichToolbar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">Pilih teks lalu klik toolbar untuk format. Gambar bisa disisipkan langsung di dalam teks.</p>
              </div>

              {/* Tombol */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition"
                >
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Publikasikan Artikel'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg py-2.5 text-sm transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Delete ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-2xl mb-3">🗑️</div>
            <h3 className="font-bold text-base mb-2">Hapus Artikel?</h3>
            <p className="text-gray-400 text-sm mb-6">Tindakan ini tidak dapat dibatalkan. Artikel akan dihapus permanen dari database.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg py-2.5 text-sm transition"
              >
                Ya, Hapus
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg py-2.5 text-sm transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border transition-all
          ${toast.type === 'success'
            ? 'bg-green-900/90 border-green-700 text-green-200'
            : 'bg-red-900/90 border-red-700 text-red-200'}`}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

