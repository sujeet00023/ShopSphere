/* eslint-disable react-hooks/immutability */
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../../../store/authStore'
import apiClient from '../../../../utils/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

/* ── Field outside component to avoid focus-loss bug ── */
function Field({ label, hint, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fog)' }}>
        {label} {required && <span style={{ color: 'var(--ember)' }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 12, color: 'var(--fog)' }}>{hint}</span>}
    </div>
  )
}

const inputSt = (focused, name) => ({
  padding: '12px 14px',
  border: `1.5px solid ${focused === name ? 'var(--ink)' : 'var(--stone)'}`,
  borderRadius: 8, fontSize: 15, fontFamily: 'inherit',
  color: 'var(--ink)', background: 'var(--paper)', outline: 'none', width: '100%',
  boxShadow: focused === name ? '0 0 0 3px rgba(10,10,10,0.06)' : 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
})

const BLANK = { name: '', description: '', image: '', slug: '' }

export default function CategoriesPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(null)   // id being deleted
  const [search,     setSearch]     = useState('')
  const [focused,    setFocused]    = useState('')
  const [imgError,   setImgError]   = useState(false)

  // form mode: 'create' | 'edit'
  const [mode,       setMode]       = useState('create')
  const [editId,     setEditId]     = useState(null)
  const [form,       setForm]       = useState(BLANK)
  const [showForm,   setShowForm]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)  // id waiting confirm

  const formRef = useRef(null)

  useEffect(() => {
    if (!user) { router.push('/pages/auth/login'); return }
    if (user.role !== 'ADMIN') { router.push('/'); return }
    fetchCategories()
  }, [user])

  async function fetchCategories() {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/categories')
      setCategories(data.data)
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  /* Auto-generate slug from name */
  function handleNameChange(val) {
    const slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setForm(f => ({ ...f, name: val, slug: mode === 'create' ? slug : f.slug }))
  }

  function openCreate() {
    setMode('create')
    setEditId(null)
    setForm(BLANK)
    setImgError(false)
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function openEdit(cat) {
    setMode('edit')
    setEditId(cat.id)
    setForm({ name: cat.name, description: cat.description || '', image: cat.image || '', slug: cat.slug || '' })
    setImgError(false)
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function cancelForm() {
    setShowForm(false)
    setMode('create')
    setEditId(null)
    setForm(BLANK)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Category name is required'); return }
    setSaving(true)
    try {
      if (mode === 'create') {
        const { data } = await apiClient.post('/categories', form)
        setCategories(prev => [data.data, ...prev])
        toast.success(`"${data.data.name}" created!`)
      } else {
        const { data } = await apiClient.patch(`/categories/${editId}`, form)
        setCategories(prev => prev.map(c => c.id === editId ? data.data : c))
        toast.success(`"${data.data.name}" updated!`)
      }
      cancelForm()
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${mode} category`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (confirmDel !== id) { setConfirmDel(id); return }   // first click → confirm
    setDeleting(id)
    setConfirmDel(null)
    try {
      await apiClient.delete(`/categories/${id}`)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success(`"${name}" deleted`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  )

  /* ── Guard ── */
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>

      {/* ── Top bar ── */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/pages/admin" className="back-link">← Admin</Link>
          <div style={{ width: 1, height: 18, background: 'var(--stone)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fog)' }}>Categories</span>
        </div>
        <button
          onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#333'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
        >
          + New Category
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px,5vw,56px) 24px' }}>

        {/* ── Page heading ── */}
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <div className="divider" style={{ marginBottom: 14 }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="serif" style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Categories
              </h1>
              <p style={{ color: 'var(--fog)', fontSize: 15, marginTop: 6 }}>
                {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} · used in product listings
              </p>
            </div>
            {/* Stats pills */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ padding: '8px 16px', background: 'var(--mist)', borderRadius: 8, border: '1.5px solid var(--stone)', textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: 22, fontWeight: 900 }}>{categories.length}</div>
                <div style={{ fontSize: 11, color: 'var(--fog)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
              </div>
              <div style={{ padding: '8px 16px', background: 'var(--mist)', borderRadius: 8, border: '1.5px solid var(--stone)', textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: 22, fontWeight: 900 }}>{categories.filter(c => c.image).length}</div>
                <div style={{ fontSize: 11, color: 'var(--fog)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>With Image</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Create / Edit Form ── */}
        {showForm && (
          <div ref={formRef} className="card fade-up" style={{ marginBottom: 32, border: `1.5px solid ${mode === 'edit' ? 'var(--sky)' : 'var(--stone)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: mode === 'edit' ? 'var(--sky)' : 'var(--ember)', marginBottom: 4 }}>
                  {mode === 'edit' ? '✎ Editing Category' : '✦ New Category'}
                </div>
                <h2 className="serif" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>
                  {mode === 'edit' ? `Edit "${form.name || '…'}"` : 'Create Category'}
                </h2>
              </div>
              <button onClick={cancelForm}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--fog)', lineHeight: 1, padding: 4 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }} className="form-2col">

                <Field label="Category Name" required>
                  <input
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g., Electronics"
                    required
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused('')}
                    style={inputSt(focused, 'name')}
                  />
                </Field>

                <Field label="Slug" hint="Auto-generated from name. Edit if needed.">
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="electronics"
                    onFocus={() => setFocused('slug')}
                    onBlur={() => setFocused('')}
                    style={inputSt(focused, 'slug')}
                  />
                </Field>

                <Field label="Description" hint="Optional — shown on category pages.">
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="A brief description of this category…"
                    rows={3}
                    onFocus={() => setFocused('desc')}
                    onBlur={() => setFocused('')}
                    style={{ ...inputSt(focused, 'desc'), resize: 'vertical', minHeight: 80, gridColumn: 'span 1' }}
                  />
                </Field>

                <Field label="Image URL" hint="Shown in category grid on homepage.">
                  <input
                    value={form.image}
                    onChange={e => { setForm(f => ({ ...f, image: e.target.value })); setImgError(false) }}
                    placeholder="https://example.com/category.jpg"
                    onFocus={() => setFocused('image')}
                    onBlur={() => setFocused('')}
                    style={inputSt(focused, 'image')}
                  />
                  {/* Inline image preview */}
                  {form.image && !imgError && (
                    <img
                      src={form.image}
                      alt="preview"
                      onError={() => setImgError(true)}
                      style={{ marginTop: 8, width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--stone)' }}
                    />
                  )}
                  {form.image && imgError && (
                    <div style={{ marginTop: 8, padding: '10px', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626' }}>
                      ⚠️ Could not load image — check the URL
                    </div>
                  )}
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button type="submit" disabled={saving}
                  style={{ padding: '13px 28px', background: saving ? 'var(--stone)' : 'var(--ink)', color: saving ? 'var(--fog)' : '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}>
                  {saving
                    ? <><span className="spinner-sm" />{mode === 'edit' ? 'Updating…' : 'Creating…'}</>
                    : mode === 'edit' ? '✓ Update Category' : '✦ Create Category'
                  }
                </button>
                <button type="button" onClick={cancelForm}
                  style={{ padding: '13px 24px', border: '1.5px solid var(--stone)', borderRadius: 8, background: 'transparent', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--stone)'}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Search bar ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220, display: 'flex', border: '1.5px solid var(--stone)', borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.2s' }}
            onFocus={() => {}} onBlur={() => {}}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search categories…"
              style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', background: 'var(--paper)', color: 'var(--ink)' }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ padding: '0 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--fog)' }}>
                ✕
              </button>
            )}
          </div>
          <span style={{ fontSize: 14, color: 'var(--fog)', whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Table header ── */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr 120px 140px', gap: 12, padding: '0 16px', marginBottom: 10 }}
            className="cat-table-header">
            {['', 'Name', 'Description', 'Slug', 'Actions'].map((h, i) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fog)', textAlign: i === 4 ? 'right' : 'left' }}>
                {h}
              </div>
            ))}
          </div>
        )}

        {/* ── Category rows ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--fog)', fontSize: 15 }}>Loading categories…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', border: '1.5px dashed var(--stone)', borderRadius: 16 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📂</div>
            <h2 className="serif" style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>
              {search ? 'No results found' : 'No categories yet'}
            </h2>
            <p style={{ color: 'var(--fog)', marginBottom: 24, fontSize: 15 }}>
              {search ? `No category matches "${search}"` : 'Create your first category to get started.'}
            </p>
            {!search && (
              <button onClick={openCreate}
                style={{ padding: '13px 28px', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Create First Category
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((cat, idx) => (
              <div key={cat.id}
                style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr 120px 140px', gap: 12, alignItems: 'center', padding: '14px 16px', border: '1.5px solid var(--stone)', borderRadius: 12, background: 'var(--paper)', animation: `fadeUp 0.35s ease ${idx * 0.04}s both`, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                className="cat-row"
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--stone)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Thumbnail */}
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--mist)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {cat.image
                    ? <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                    : '📁'
                  }
                </div>

                {/* Name */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fog)', marginTop: 2 }}>
                    {cat._count?.products ?? cat.productCount ?? 0} products
                  </div>
                </div>

                {/* Description */}
                <div style={{ fontSize: 13, color: 'var(--fog)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.description || <em style={{ opacity: 0.5 }}>No description</em>}
                </div>

                {/* Slug */}
                <div>
                  <code style={{ fontSize: 12, background: 'var(--mist)', padding: '3px 8px', borderRadius: 4, color: 'var(--fog)', fontFamily: 'DM Mono, monospace', border: '1px solid var(--stone)' }}>
                    {cat.slug || '—'}
                  </code>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => openEdit(cat)}
                    style={{ padding: '7px 14px', border: '1.5px solid var(--stone)', borderRadius: 7, background: 'var(--paper)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.background = 'var(--mist)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--stone)'; e.currentTarget.style.background = 'var(--paper)' }}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    disabled={deleting === cat.id}
                    style={{ padding: '7px 14px', border: `1.5px solid ${confirmDel === cat.id ? '#dc2626' : '#fca5a5'}`, borderRadius: 7, background: confirmDel === cat.id ? '#dc2626' : 'transparent', fontWeight: 700, fontSize: 13, cursor: deleting === cat.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: confirmDel === cat.id ? '#fff' : '#dc2626', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                    title={confirmDel === cat.id ? 'Click again to confirm delete' : 'Delete category'}
                  >
                    {deleting === cat.id ? '…' : confirmDel === cat.id ? 'Confirm?' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Quick bulk-add tip ── */}
        {categories.length === 0 && !loading && !showForm && (
          <div style={{ marginTop: 32, padding: '20px 24px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 8 }}>💡 Quick Start</div>
            <p style={{ fontSize: 13, color: '#3b5fc0', lineHeight: 1.7, marginBottom: 14 }}>
              Start by creating a few common categories like <strong>Electronics</strong>, <strong>Clothing</strong>, <strong>Home & Kitchen</strong> so your sellers can list products immediately.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books', 'Beauty'].map(name => (
                <button key={name}
                  onClick={async () => {
                    setSaving(true)
                    try {
                      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                      const { data } = await apiClient.post('/categories', { name, slug, description: '', image: '' })
                      setCategories(prev => [...prev, data.data])
                      toast.success(`"${name}" created!`)
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to create')
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  style={{ padding: '7px 14px', background: '#fff', border: '1.5px solid #bfdbfe', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#1e40af', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 768px) {
          .cat-table-header { display: none !important; }
          .cat-row { grid-template-columns: 44px 1fr auto !important; }
          .cat-row > div:nth-child(3),
          .cat-row > div:nth-child(4) { display: none !important; }
          .form-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}