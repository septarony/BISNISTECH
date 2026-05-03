import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured, missingSupabaseVars } from '../supabaseClient'

// ─── Konstanta ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Mesin Antrian', 'Security System', 'PPOB', 'Tips Umum']
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

const EMPTY_FORM = { title: '', content: '', category: CATEGORIES[0], image_url: '' }

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

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ session }) {
  const [articles, setArticles]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editId, setEditId]       = useState(null)   // null = mode create
  const [formOpen, setFormOpen]   = useState(false)
  const [deleteId, setDeleteId]   = useState(null)
  const [toast, setToast]         = useState(null)   // { type: 'success'|'error', msg }
  const [saving, setSaving]       = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchArticles = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, content, category, image_url, created_at')
      .order('created_at', { ascending: false })

    if (error) showToast('error', error.message)
    else setArticles(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchArticles() }, [fetchArticles])

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
    if (!form.title.trim() || !form.content.trim()) {
      showToast('error', 'Judul dan isi artikel wajib diisi.')
      return
    }
    setSaving(true)

    const payload = {
      title:     form.title.trim(),
      content:   form.content.trim(),
      category:  form.category,
      image_url: form.image_url.trim() || null,
    }

    let data
    let error
    if (editId) {
      ;({ data, error } = await supabase
        .from('articles')
        .update(payload)
        .eq('id', editId)
        .select('id, title, content, category, image_url, created_at')
        .single())
    } else {
      ;({ data, error } = await supabase
        .from('articles')
        .insert(payload)
        .select('id, title, content, category, image_url, created_at')
        .single())
    }

    setSaving(false)
    if (error) return showToast('error', error.message)

    if (editId) {
      setArticles(current => current.map(article => article.id === editId ? data : article))
    } else {
      setArticles(current => [data, ...current])
    }

    showToast('success', editId ? 'Artikel berhasil diperbarui.' : 'Artikel berhasil ditambahkan.')
    setFormOpen(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    const currentDeleteId = deleteId
    const { data, error } = await supabase
      .from('articles')
      .delete()
      .eq('id', currentDeleteId)
      .select('id')
      .maybeSingle()

    setDeleteId(null)
    if (error) return showToast('error', error.message)
    if (!data) return showToast('error', 'Artikel gagal dihapus atau sudah tidak tersedia.')

    setArticles(current => current.filter(article => article.id !== currentDeleteId))
    showToast('success', 'Artikel berhasil dihapus.')
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // ── Category badge color ───────────────────────────────────────────────────
  const categoryColor = {
    'Mesin Antrian':  'bg-indigo-900/60 text-indigo-300',
    'Security System':'bg-cyan-900/60  text-cyan-300',
    'PPOB':           'bg-amber-900/60 text-amber-300',
    'Tips Umum':      'bg-gray-700/60  text-gray-300',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── Topbar ── */}
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">S</div>
          <span className="font-semibold text-sm">SEPTA CMS</span>
          <span className="hidden sm:block text-gray-600 text-xs ml-2">{session.user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition"
        >
          Keluar
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page title + CTA ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Manajemen Artikel</h1>
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
      </main>

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

              {/* Isi Artikel */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Isi Artikel <span className="text-red-400">*</span></label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  required
                  rows={10}
                  placeholder="Tulis isi artikel di sini..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-y"
                />
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
