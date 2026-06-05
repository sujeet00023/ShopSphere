/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState, useRef } from 'react'
import apiClient from '../../../utils/api'
import ProductGrid from '../../../components/ProductGrid'
import toast from 'react-hot-toast'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price-low',  label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Top Rated' },
]

export default function ProductPage() {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [category,   setCategory]   = useState('')
  const [sortBy,     setSortBy]     = useState('newest')
  const [search,     setSearch]     = useState('')
  const [searchInput,setSearchInput]= useState('')
  const [page,       setPage]       = useState(1)
  const [pagination, setPagination] = useState(null)
  const [sidebarOpen,setSidebarOpen]= useState(false)
  const searchRef = useRef(null)

  /* read ?category= from URL on mount */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setCategory(p.get('category') || '')
    fetchCategories()
  }, [])

  useEffect(() => { fetchProducts() }, [category, sortBy, page, search])

  async function fetchProducts() {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 12,
        ...(category && { categoryId: category }),
        ...(sortBy   && { sortBy }),
        ...(search   && { search }),
      }
      const { data } = await apiClient.get('/products', { params })
      setProducts(data.data)
      setPagination(data.pagination)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await apiClient.get('/categories')
      setCategories(data.data)
    } catch {
      console.error('Failed to load categories')
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function handleCategory(val) {
    setCategory(val)
    setPage(1)
    setSidebarOpen(false)
  }

  function handleReset() {
    setCategory('')
    setSortBy('newest')
    setSearch('')
    setSearchInput('')
    setPage(1)
  }

  const activeFilters = [
    category && categories.find(c => c.id === category)?.name,
    sortBy !== 'newest' && SORT_OPTIONS.find(s => s.value === sortBy)?.label,
    search && `"${search}"`,
  ].filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>

      {/* ── Page hero header ── */}
      <div style={{ borderBottom: '1.5px solid var(--stone)', padding: 'clamp(32px,5vw,56px) 24px clamp(24px,4vw,40px)', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div className="divider" style={{ marginBottom: 14 }} />
              <h1 className="serif" style={{ fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 10 }}>
                All Products
              </h1>
              <p style={{ color: 'var(--fog)', fontSize: 16 }}>
                {pagination
                  ? `${pagination.total ?? products.length} products · Page ${pagination.page} of ${pagination.pages}`
                  : `${products.length} products`}
              </p>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch}
              style={{ display: 'flex', border: '1.5px solid var(--stone)', borderRadius: 10, overflow: 'hidden', background: 'var(--paper)', transition: 'border-color 0.2s', flex: '0 1 400px', minWidth: 240 }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--ink)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--stone)'}
            >
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{ flex: 1, padding: '13px 18px', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', background: 'transparent', color: 'var(--ink)' }}
              />
              <button type="submit"
                style={{ padding: '0 20px', background: 'var(--ink)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#333'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
              >
                ⌕
              </button>
            </form>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fog)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active:</span>
              {activeFilters.map(f => (
                <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--ink)', color: '#fff', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  {f}
                </span>
              ))}
              <button onClick={handleReset}
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--ember)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', textDecoration: 'underline' }}>
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(24px,4vw,48px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, alignItems: 'start' }}
          className="products-layout">

          {/* ── Sidebar (desktop) ── */}
          <aside style={{ position: 'sticky', top: 88 }} className="products-sidebar">
            <SidebarContent
              categories={categories}
              category={category}
              sortBy={sortBy}
              onCategory={handleCategory}
              onSort={v => { setSortBy(v); setPage(1) }}
              onReset={handleReset}
            />
          </aside>

          {/* ── Mobile filter bar ── */}
          <div className="mobile-filter-bar" style={{ display: 'none', gridColumn: '1/-1' }}>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: '1.5px solid var(--stone)', borderRadius: 8, background: 'var(--paper)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', color: 'var(--ink)' }}>
                ⊟ Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
              </button>
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => { setSortBy(opt.value); setPage(1) }}
                  style={{ padding: '10px 16px', border: '1.5px solid var(--stone)', borderRadius: 8, background: sortBy === opt.value ? 'var(--ink)' : 'var(--paper)', color: sortBy === opt.value ? '#fff' : 'var(--ink)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Product area ── */}
          <div>
            {/* Sort bar (desktop only) */}
            <div className="desktop-sort-bar"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottom: '1.5px solid var(--stone)', gap: 12, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 14, color: 'var(--fog)', fontWeight: 500 }}>
                {loading ? 'Loading…' : `${products.length} result${products.length !== 1 ? 's' : ''}`}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => { setSortBy(opt.value); setPage(1) }}
                    className="filter-pill"
                    style={{ padding: '7px 16px', fontSize: 13 }}
                    data-active={sortBy === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <ProductGrid products={products} loading={loading} />

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 48, flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={page === 1}
                  style={{ padding: '10px 18px', border: '1.5px solid var(--stone)', borderRadius: 8, background: 'var(--paper)', fontWeight: 600, fontSize: 14, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit', color: 'var(--ink)', transition: 'all 0.15s' }}>
                  ← Prev
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '…' ? (
                      <span key={`ellipsis-${idx}`} style={{ padding: '10px 4px', color: 'var(--fog)', fontSize: 14 }}>…</span>
                    ) : (
                      <button key={p}
                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        style={{ width: 42, height: 42, borderRadius: 8, border: '1.5px solid', borderColor: page === p ? 'var(--ink)' : 'var(--stone)', background: page === p ? 'var(--ink)' : 'var(--paper)', color: page === p ? '#fff' : 'var(--ink)', fontWeight: page === p ? 700 : 500, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => { setPage(p => Math.min(pagination.pages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={page === pagination.pages}
                  style={{ padding: '10px 18px', border: '1.5px solid var(--stone)', borderRadius: 8, background: 'var(--paper)', fontWeight: 600, fontSize: 14, cursor: page === pagination.pages ? 'not-allowed' : 'pointer', opacity: page === pagination.pages ? 0.4 : 1, fontFamily: 'inherit', color: 'var(--ink)', transition: 'all 0.15s' }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sidebar drawer ── */}
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 300, background: 'var(--paper)', zIndex: 50, padding: 28, overflowY: 'auto', boxShadow: '8px 0 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span className="serif" style={{ fontSize: 22, fontWeight: 900 }}>Filters</span>
              <button onClick={() => setSidebarOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--fog)', fontFamily: 'inherit', lineHeight: 1 }}>✕</button>
            </div>
            <SidebarContent
              categories={categories}
              category={category}
              sortBy={sortBy}
              onCategory={handleCategory}
              onSort={v => { setSortBy(v); setPage(1) }}
              onReset={handleReset}
            />
          </div>
        </>
      )}

      {/* Responsive overrides */}
      <style>{`
        .filter-pill[data-active="true"] { background: var(--ink) !important; color: #fff !important; border-color: var(--ink) !important; }
        @media (max-width: 900px) {
          .products-layout { grid-template-columns: 1fr !important; }
          .products-sidebar { display: none !important; }
          .mobile-filter-bar { display: block !important; }
          .desktop-sort-bar { display: none !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Sidebar content (shared between desktop + mobile drawer) ── */
function SidebarContent({ categories, category, sortBy, onCategory, onSort, onReset }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Categories */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fog)', marginBottom: 14 }}>
          Category
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ id: '', name: 'All Products' }, ...categories].map(cat => (
            <button key={cat.id}
              onClick={() => onCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, fontWeight: category === cat.id ? 700 : 500,
                background: category === cat.id ? 'var(--ink)' : 'transparent',
                color: category === cat.id ? '#fff' : 'var(--ink)',
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (category !== cat.id) e.currentTarget.style.background = 'var(--mist)' }}
              onMouseLeave={e => { if (category !== cat.id) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{cat.name}</span>
              {category === cat.id && <span style={{ fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1.5px', background: 'var(--stone)' }} />

      {/* Sort */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fog)', marginBottom: 14 }}>
          Sort By
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value}
              onClick={() => onSort(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, fontWeight: sortBy === opt.value ? 700 : 500,
                background: sortBy === opt.value ? 'var(--mist)' : 'transparent',
                color: 'var(--ink)', transition: 'all 0.15s', textAlign: 'left',
                borderLeft: sortBy === opt.value ? '3px solid var(--ember)' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (sortBy !== opt.value) e.currentTarget.style.background = 'var(--mist)' }}
              onMouseLeave={e => { if (sortBy !== opt.value) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{opt.label}</span>
              {sortBy === opt.value && <span style={{ fontSize: 12, color: 'var(--ember)' }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1.5px', background: 'var(--stone)' }} />

      {/* Reset */}
      <button onClick={onReset}
        style={{ padding: '12px', border: '1.5px solid var(--stone)', borderRadius: 10, background: 'transparent', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--fog)', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--stone)'; e.currentTarget.style.color = 'var(--fog)' }}
      >
        Reset All Filters
      </button>
    </div>
  )
}