/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState, useRef } from 'react'
import apiClient from '../../../utils/api'
import ProductGrid from '../../../components/ProductGrid'
import toast from 'react-hot-toast'

// ── Design tokens (light theme) ──────────────────────────────────────────────
const T = {
  bg:        '#FFFFFF',
  surface:   '#F7F7FB',
  surfaceHov:'#F0EFFA',
  border:    '#E8E7F2',
  borderHov: '#C4B5FD',
  ink:       '#0F0E1A',
  muted:     '#6B6880',
  faint:     '#A09DB8',
  violet:    '#7C3AED',
  violetSoft:'#EDE9FE',
  violetMid: '#C4B5FD',
  amber:     '#D97706',
  amberSoft: '#FEF3C7',
  red:       '#DC2626',
  redSoft:   '#FEE2E2',
  green:     '#16A34A',
  greenSoft: '#DCFCE7',
  orange:    '#EA580C',
}

const SORT_OPTIONS = [
  { value: 'newest',       label: 'Newest',     icon: '✦' },
  { value: 'price-low',    label: 'Price ↑',    icon: '↑' },
  { value: 'price-high',   label: 'Price ↓',    icon: '↓' },
  { value: 'top-rated',    label: 'Top Rated',  icon: '★' },
  { value: 'most-popular', label: 'Popular',    icon: '🔥' },
]

export default function ProductPage() {
  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(false)
  const [category,    setCategory]    = useState('')
  const [sortBy,      setSortBy]      = useState('newest')
  const [search,      setSearch]      = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page,        setPage]        = useState(1)
  const [pagination,  setPagination]  = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode,    setViewMode]    = useState('grid')
  const [minPrice,    setMinPrice]    = useState('')
  const [maxPrice,    setMaxPrice]    = useState('')
  const [priceInput,  setPriceInput]  = useState({ min: '', max: '' })
  const [wishlist,    setWishlist]    = useState(new Set())
  const [quickView,   setQuickView]   = useState(null)
  const [animCount,   setAnimCount]   = useState(0)
  const searchRef = useRef(null)

  /* read ?category= from URL on mount */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setCategory(p.get('category') || '')
    fetchCategories()
  }, [])

  useEffect(() => { fetchProducts() }, [category, sortBy, page, search, minPrice, maxPrice])

  useEffect(() => {
    if (!pagination) return
    const target = pagination.total ?? products.length
    const start  = animCount
    const diff   = target - start
    if (diff === 0) return
    const steps = 20; let step = 0
    const timer = setInterval(() => {
      step++
      setAnimCount(Math.round(start + (diff * step) / steps))
      if (step >= steps) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [pagination])

  async function fetchProducts() {
    setLoading(true)
    try {
      const params = {
        page, limit: 12,
        ...(category && { categoryId: category }),
        ...(sortBy   && { sort: sortBy }),
        ...(search   && { search }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      }
      const { data } = await apiClient.get('/products', { params })
      setProducts(data.data)
      setPagination(data.pagination)
    } catch { toast.error('Failed to load products') }
    finally  { setLoading(false) }
  }

  async function fetchCategories() {
    try {
      const { data } = await apiClient.get('/categories')
      setCategories(data.data)
    } catch { console.error('Failed to load categories') }
  }

  function handleSearch(e) { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }
  function handleCategory(val) { setCategory(val); setPage(1); setSidebarOpen(false) }
  function handlePriceApply() { setMinPrice(priceInput.min); setMaxPrice(priceInput.max); setPage(1) }
  function handleReset() {
    setCategory(''); setSortBy('newest'); setSearch(''); setSearchInput('')
    setMinPrice(''); setMaxPrice(''); setPriceInput({ min: '', max: '' }); setPage(1)
  }
  function toggleWishlist(id) {
    setWishlist(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); toast('Removed from wishlist') }
      else               { next.add(id);   toast.success('Added to wishlist ♥') }
      return next
    })
  }

  const activeFilters = [
    category && categories.find(c => c.id === category)?.name,
    sortBy !== 'newest' && SORT_OPTIONS.find(s => s.value === sortBy)?.label,
    search && `"${search}"`,
    (minPrice || maxPrice) && `₹${minPrice || '0'} – ₹${maxPrice || '∞'}`,
  ].filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.ink, fontFamily: "'Inter', sans-serif" }}>

      {/* ── STICKY HEADER ── */}
      <div style={{ borderBottom: `1.5px solid ${T.border}`, padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px)', background: T.bg, position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 1px 16px rgba(124,58,237,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

            {/* Title + count */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h1 style={{ fontSize: 'clamp(1.3rem,2.5vw,1.75rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: T.ink }}>
                Explore Products
              </h1>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: T.violetSoft, border: `1px solid ${T.violetMid}`, color: T.violet }}>
                {animCount.toLocaleString()} items
              </span>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch}
              style={{ display: 'flex', flex: '0 1 420px', minWidth: 200, background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onFocus={e => { e.currentTarget.style.borderColor = T.violet; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.violetSoft}` }}
              onBlur={e  => { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.boxShadow = 'none' }}>
              <input ref={searchRef} type="text" placeholder="Search anything…"
                value={searchInput} onChange={e => setSearchInput(e.target.value)}
                style={{ flex: 1, padding: '11px 16px', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: T.ink, fontFamily: 'inherit' }} />
              <button type="submit"
                style={{ padding: '0 20px', background: `linear-gradient(135deg, ${T.violet}, #5B21B6)`, border: 'none', cursor: 'pointer', fontSize: 16, color: '#fff', transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>⌕</button>
            </form>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* View toggle */}
              <div style={{ display: 'flex', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                {['grid', 'list'].map(m => (
                  <button key={m} onClick={() => setViewMode(m)} title={m === 'grid' ? 'Grid view' : 'List view'}
                    style={{ padding: '8px 13px', border: 'none', cursor: 'pointer', fontSize: 15, background: viewMode === m ? T.violetSoft : 'transparent', color: viewMode === m ? T.violet : T.faint, transition: 'all 0.15s' }}>
                    {m === 'grid' ? '⊞' : '≡'}
                  </button>
                ))}
              </div>
              {/* Mobile filter btn */}
              <button onClick={() => setSidebarOpen(true)} className="mobile-only"
                style={{ display: 'none', alignItems: 'center', gap: 6, padding: '9px 14px', background: T.violetSoft, border: `1.5px solid ${T.violetMid}`, borderRadius: 10, color: T.violet, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ⊟ Filters {activeFilters.length > 0 && <span style={{ background: T.violet, color: '#fff', borderRadius: 999, padding: '0 6px', fontSize: 11 }}>{activeFilters.length}</span>}
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {activeFilters.map(f => (
                <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: T.violetSoft, border: `1px solid ${T.violetMid}`, color: T.violet, borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{f}</span>
              ))}
              <button onClick={handleReset}
                style={{ fontSize: 12, fontWeight: 700, color: T.red, background: T.redSoft, border: `1px solid #FECACA`, borderRadius: 999, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                ✕ Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(20px,3vw,40px) clamp(16px,3vw,32px)' }}>
        <div className="products-layout" style={{ display: 'grid', gridTemplateColumns: '256px 1fr', gap: 28, alignItems: 'start' }}>

          {/* ── SIDEBAR ── */}
          <aside className="products-sidebar" style={{ position: 'sticky', top: 100 }}>
            <SidebarContent
              categories={categories} category={category} sortBy={sortBy}
              priceInput={priceInput} setPriceInput={setPriceInput}
              onCategory={handleCategory}
              onSort={v => { setSortBy(v); setPage(1) }}
              onPriceApply={handlePriceApply}
              onReset={handleReset}
            />
          </aside>

          {/* ── PRODUCTS ── */}
          <div>
            {/* Desktop sort bar */}
            <div className="desktop-sort-bar"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 18, borderBottom: `1.5px solid ${T.border}`, gap: 12, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 13, color: T.muted, fontWeight: 500, margin: 0 }}>
                {loading ? 'Loading…' : `${products.length} result${products.length !== 1 ? 's' : ''}`}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setSortBy(opt.value); setPage(1) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${sortBy === opt.value ? T.violet : T.border}`, background: sortBy === opt.value ? T.violetSoft : T.surface, color: sortBy === opt.value ? T.violet : T.muted, fontWeight: sortBy === opt.value ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 11 }}>{opt.icon}</span>{opt.label}
                  </button>
                ))}
              </div>
            </div>

            <ProductGrid products={products} loading={loading} />


            {/* Mobile sort bar */}
            <div className="mobile-sort-bar" style={{ display: 'none', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => { setSortBy(opt.value); setPage(1) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${sortBy === opt.value ? T.violet : T.border}`, background: sortBy === opt.value ? T.violetSoft : T.surface, color: sortBy === opt.value ? T.violet : T.muted, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            {/* Grid / List */}
            {loading ? (
              <div className={viewMode === 'grid' ? 'product-grid' : 'product-list'}>
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} viewMode={viewMode} />)}
              </div>
            ) : products.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              <div className={viewMode === 'grid' ? 'product-grid' : 'product-list'}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode}
                    wishlisted={wishlist.has(product.id)}
                    onWishlist={() => toggleWishlist(product.id)}
                    onQuickView={() => setQuickView(product)} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 48, flexWrap: 'wrap' }}>
                <PagBtn onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} disabled={page === 1}>← Prev</PagBtn>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…'); acc.push(p); return acc }, [])
                  .map((p, idx) =>
                    p === '…'
                      ? <span key={`e${idx}`} style={{ color: T.faint, padding: '0 4px' }}>…</span>
                      : <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                          style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${page === p ? T.violet : T.border}`, background: page === p ? T.violet : T.surface, color: page === p ? '#fff' : T.muted, fontWeight: page === p ? 700 : 500, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{p}</button>
                  )}
                <PagBtn onClick={() => { setPage(p => Math.min(pagination.pages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} disabled={page === pagination.pages}>Next →</PagBtn>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,26,0.4)', zIndex: 40, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 300, background: T.bg, zIndex: 50, padding: 24, overflowY: 'auto', boxShadow: '8px 0 40px rgba(124,58,237,0.12)', borderRight: `1.5px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>Filters</span>
              <button onClick={() => setSidebarOpen(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: T.muted, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <SidebarContent
              categories={categories} category={category} sortBy={sortBy}
              priceInput={priceInput} setPriceInput={setPriceInput}
              onCategory={handleCategory}
              onSort={v => { setSortBy(v); setPage(1) }}
              onPriceApply={handlePriceApply}
              onReset={handleReset}
            />
          </div>
        </>
      )}

      {/* ── QUICK VIEW ── */}
      {quickView && (
        <QuickViewModal product={quickView} onClose={() => setQuickView(null)}
          wishlisted={wishlist.has(quickView.id)} onWishlist={() => toggleWishlist(quickView.id)} />
      )}

    </div>
  )
}

/* ── SIDEBAR ──────────────────────────────────────────────────────────────── */
function SidebarContent({ categories, category, sortBy, priceInput, setPriceInput, onCategory, onSort, onPriceApply, onReset }) {
  return (
    <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 20 }}>

      <Section title="Category">
        {[{ id: '', name: 'All Products' }, ...categories].map(cat => (
          <SidebarBtn key={cat.id} active={category === cat.id} onClick={() => onCategory(cat.id)}
            accentLeft={category === cat.id} accentColor={T.violet} activeBg={T.violetSoft} activeColor={T.violet}>
            <span>{cat.name}</span>
            {category === cat.id && <span style={{ fontSize: 10, background: T.violet, color: '#fff', borderRadius: 999, padding: '1px 6px' }}>✓</span>}
          </SidebarBtn>
        ))}
      </Section>

      <HR />

      <Section title="Sort By">
        {SORT_OPTIONS.map(opt => (
          <SidebarBtn key={opt.value} active={sortBy === opt.value} onClick={() => onSort(opt.value)}
            accentLeft={sortBy === opt.value} accentColor={T.amber} activeBg={T.amberSoft} activeColor={T.amber}>
            <span style={{ fontSize: 12, opacity: 0.6 }}>{opt.icon}</span>
            <span>{opt.label}</span>
          </SidebarBtn>
        ))}
      </Section>

      <HR />

      <Section title="Price Range">
        <div style={{
  display: 'flex',
  gap: 6,
  alignItems: 'center',
  marginBottom: 10
}}>
  <input
    type="number"
    placeholder="Min ₹"
    value={priceInput.min}
    onChange={e => setPriceInput(p => ({ ...p, min: e.target.value }))}
    style={{
      width: '95px',
      padding: '8px',
      background: T.bg,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      color: T.ink,
      fontSize: 13,
      outline: 'none'
    }}
  />

  <span style={{ color: T.faint }}>–</span>

  <input
    type="number"
    placeholder="Max ₹"
    value={priceInput.max}
    onChange={e => setPriceInput(p => ({ ...p, max: e.target.value }))}
    style={{
      width: '95px',
      padding: '8px',
      background: T.bg,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      color: T.ink,
      fontSize: 13,
      outline: 'none'
    }}
  />
</div>
        <button onClick={onPriceApply}
          style={{ width: '100%', padding: '9px', background: T.violetSoft, border: `1.5px solid ${T.violetMid}`, borderRadius: 9, color: T.violet, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = T.violet; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = T.violetSoft; e.currentTarget.style.color = T.violet }}>
          Apply Price Filter
        </button>
      </Section>

      <HR />

      <button onClick={onReset}
        style={{ width: '100%', padding: '10px', border: `1.5px solid #FECACA`, borderRadius: 10, background: T.redSoft, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: T.red, transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FCA5A5'; e.currentTarget.style.borderColor = T.red }}
        onMouseLeave={e => { e.currentTarget.style.background = T.redSoft;  e.currentTarget.style.borderColor = '#FECACA' }}>
        ✕ Reset All Filters
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.faint, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  )
}

function SidebarBtn({ active, onClick, accentColor, activeBg, activeColor, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 400, background: active ? activeBg : hov ? T.surfaceHov : 'transparent', color: active ? activeColor : T.muted, transition: 'all 0.15s', textAlign: 'left', borderLeft: `3px solid ${active ? accentColor : 'transparent'}` }}>
      {children}
    </button>
  )
}

function HR() { return <div style={{ height: 1.5, background: T.border, margin: '16px 0' }} /> }

/* ── PRODUCT CARD ─────────────────────────────────────────────────────────── */
function ProductCard({ product, viewMode, wishlisted, onWishlist, onQuickView }) {
  const [hov, setHov] = useState(false)
  const discount   = product.discountPct > 0
  const finalPrice = discount ? product.price * (1 - product.discountPct / 100) : product.price

  if (viewMode === 'list') {
    return (
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', gap: 0, background: T.bg, border: `1.5px solid ${hov ? T.violet : T.border}`, borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s', boxShadow: hov ? `0 4px 24px rgba(124,58,237,0.1)` : '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
        <div style={{ width: 140, minWidth: 140, height: 130, overflow: 'hidden', position: 'relative', background: T.surface }}>
          {product.thumbnail
            ? <img src={product.thumbnail} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: hov ? 'scale(1.07)' : 'scale(1)' }} />
            : <PlaceholderImg />}
          {discount && <Badge text={`-${Math.round(product.discountPct)}%`} />}
        </div>
        <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: T.violet, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{product.category?.name}</div>
            <h3 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.3 }}>{product.name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.desc}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
            <PriceBlock price={product.price} finalPrice={finalPrice} discount={discount} />
            <div style={{ display: 'flex', gap: 8 }}>
              <WishBtn active={wishlisted} onClick={onWishlist} />
              <QuickBtn onClick={onQuickView} />
              <ActionBtn disabled={product.stock === 0}>{product.stock === 0 ? 'Sold Out' : 'Add to Cart'}</ActionBtn>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.bg, border: `1.5px solid ${hov ? T.violet : T.border}`, borderRadius: 16, overflow: 'hidden', transition: 'all 0.22s', transform: hov ? 'translateY(-3px)' : 'none', boxShadow: hov ? '0 12px 32px rgba(124,58,237,0.12)' : '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer', position: 'relative' }}>

      {/* Image */}
      <div style={{ position: 'relative', height: 210, overflow: 'hidden', background: T.surface }}>
        {product.thumbnail
          ? <img src={product.thumbnail} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s', transform: hov ? 'scale(1.09)' : 'scale(1)' }} />
          : <PlaceholderImg />}

        {/* Hover overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,14,26,0.38)', opacity: hov ? 1 : 0, transition: 'opacity 0.22s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <OverlayWishBtn active={wishlisted} onClick={e => { e.stopPropagation(); onWishlist() }} />
          <OverlayQuickBtn onClick={e => { e.stopPropagation(); onQuickView() }} />
        </div>

        {discount && <Badge text={`-${Math.round(product.discountPct)}%`} />}
        {product.stock === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: T.red, color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 999 }}>OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 14px 16px' }}>
        <div style={{ fontSize: 10, color: T.violet, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{product.category?.name}</div>
        <h3 style={{ margin: '0 0 7px', fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</h3>

        {product.rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 9 }}>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 11, color: s <= Math.round(product.rating) ? T.amber : T.border }}>★</span>)}
            </div>
            <span style={{ fontSize: 11, color: T.faint, fontWeight: 500 }}>({product.reviewCount || 0})</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <PriceBlock price={product.price} finalPrice={finalPrice} discount={discount} />
          <ActionBtn disabled={product.stock === 0} small>
            {product.stock === 0 ? 'Sold Out' : '+ Cart'}
          </ActionBtn>
        </div>

        {product.stock > 0 && product.stock <= 10 && (
          <div style={{ marginTop: 8, fontSize: 11, color: T.orange, fontWeight: 700 }}>⚡ Only {product.stock} left</div>
        )}
      </div>
    </div>
  )
}

/* ── QUICK VIEW MODAL ─────────────────────────────────────────────────────── */
function QuickViewModal({ product, onClose, wishlisted, onWishlist }) {
  const discount   = product.discountPct > 0
  const finalPrice = discount ? product.price * (1 - product.discountPct / 100) : product.price
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,26,0.45)', zIndex: 100, backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(92vw, 760px)', maxHeight: '88vh', overflowY: 'auto', background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 20, zIndex: 101, boxShadow: '0 32px 80px rgba(124,58,237,0.15)' }}>
        <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 380 }}>
          <div style={{ background: T.surface, borderRadius: '18px 0 0 18px', overflow: 'hidden', minHeight: 280 }}>
            {product.thumbnail ? <img src={product.thumbnail} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PlaceholderImg />}
          </div>
          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 11, color: T.violet, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{product.category?.name}</div>
              <button onClick={onClose} style={{ background: T.surface, border: `1px solid ${T.border}`, width: 30, height: 30, borderRadius: 8, cursor: 'pointer', color: T.muted, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.ink, lineHeight: 1.3 }}>{product.name}</h2>
            {product.seller?.storeName && <div style={{ fontSize: 12, color: T.faint }}>by {product.seller.storeName}</div>}
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{product.desc}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: T.ink }}>₹{finalPrice.toFixed(2)}</span>
              {discount && <span style={{ fontSize: 14, color: T.faint, textDecoration: 'line-through' }}>₹{product.price.toFixed(2)}</span>}
              {discount && <span style={{ fontSize: 12, fontWeight: 700, color: T.amber, background: T.amberSoft, padding: '2px 8px', borderRadius: 999 }}>{product.discountPct}% OFF</span>}
            </div>
            {product.rating > 0 && (
              <div style={{ display: 'flex', gap: 3 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 15, color: s <= Math.round(product.rating) ? T.amber : T.border }}>★</span>)}
                <span style={{ fontSize: 12, color: T.faint, marginLeft: 6 }}>({product.reviewCount || 0} reviews)</span>
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: product.stock > 0 ? T.green : T.red }}>
              {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✕ Out of Stock'}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
              <button disabled={product.stock === 0}
                style={{ flex: 1, padding: '12px', background: `linear-gradient(135deg, ${T.violet}, #5B21B6)`, border: 'none', borderRadius: 11, color: '#fff', fontWeight: 800, fontSize: 14, cursor: product.stock === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: product.stock === 0 ? 0.4 : 1 }}>
                Add to Cart
              </button>
              <button onClick={onWishlist}
                style={{ width: 46, height: 46, border: `1.5px solid ${wishlisted ? '#FCA5A5' : T.border}`, borderRadius: 11, background: wishlisted ? T.redSoft : T.surface, color: wishlisted ? T.red : T.faint, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>♥</button>
            </div>
          </div>
        </div>
        
      </div>
    </>
  )
}

/* ── SKELETON ─────────────────────────────────────────────────────────────── */
function SkeletonCard({ viewMode }) {
  const pulse = { background: `linear-gradient(90deg, ${T.surface} 25%, ${T.border} 50%, ${T.surface} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }
  if (viewMode === 'list') return (
    <div style={{ display: 'flex', background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ width: 140, minWidth: 140, height: 130, ...pulse }} />
      <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 9, justifyContent: 'center' }}>
        <div style={{ height: 10, width: '35%', borderRadius: 5, ...pulse }} />
        <div style={{ height: 15, width: '65%', borderRadius: 5, ...pulse }} />
        <div style={{ height: 10, width: '50%', borderRadius: 5, ...pulse }} />
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
  return (
    <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ height: 210, ...pulse }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ height: 10, width: '35%', borderRadius: 5, ...pulse }} />
        <div style={{ height: 15, width: '75%', borderRadius: 5, ...pulse }} />
        <div style={{ height: 12, width: '55%', borderRadius: 5, ...pulse }} />
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}

/* ── EMPTY STATE ──────────────────────────────────────────────────────────── */
function EmptyState({ onReset }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: T.muted }}>
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }}>⊘</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: T.ink, marginBottom: 8 }}>No products found</h3>
      <p style={{ fontSize: 14, marginBottom: 24 }}>Try adjusting your filters or search query.</p>
      <button onClick={onReset}
        style={{ padding: '11px 28px', background: `linear-gradient(135deg, ${T.violet}, #5B21B6)`, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
        Reset Filters
      </button>
    </div>
  )
}

/* ── HELPERS ──────────────────────────────────────────────────────────────── */
function PlaceholderImg() {
  return <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${T.violetSoft}, ${T.amberSoft})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: T.faint }}>◻</div>
}

function Badge({ text }) {
  return <div style={{ position: 'absolute', top: 10, left: 10, background: T.amber, color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 9px', borderRadius: 999, letterSpacing: '0.04em' }}>{text}</div>
}

function PriceBlock({ price, finalPrice, discount }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 900, color: T.ink, letterSpacing: '-0.02em' }}>₹{finalPrice.toFixed(2)}</div>
      {discount && <div style={{ fontSize: 11, color: T.faint, textDecoration: 'line-through' }}>₹{price.toFixed(2)}</div>}
    </div>
  )
}

function ActionBtn({ onClick, disabled, children, small }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: small ? '8px 14px' : '10px 20px', background: disabled ? T.surface : hov ? '#5B21B6' : T.violet, border: `1.5px solid ${disabled ? T.border : T.violet}`, borderRadius: 9, color: disabled ? T.faint : '#fff', fontWeight: 700, fontSize: small ? 12 : 13, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}>
      {children}
    </button>
  )
}

function WishBtn({ active, onClick }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }}
      style={{ width: 34, height: 34, border: `1.5px solid ${active ? '#FCA5A5' : T.border}`, borderRadius: 8, background: active ? T.redSoft : T.surface, color: active ? T.red : T.faint, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>♥</button>
  )
}

function QuickBtn({ onClick }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }}
      style={{ width: 34, height: 34, border: `1.5px solid ${T.border}`, borderRadius: 8, background: T.surface, color: T.muted, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>⊹</button>
  )
}

function OverlayWishBtn({ active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: 40, height: 40, border: `1.5px solid ${active ? T.red : 'rgba(255,255,255,0.5)'}`, borderRadius: 999, background: active ? T.red : 'rgba(255,255,255,0.85)', color: active ? '#fff' : T.ink, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', transition: 'all 0.15s' }}>♥</button>
  )
}

function OverlayQuickBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 999, color: T.ink, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)', transition: 'all 0.15s' }}>
      ⊹ Quick View
    </button>
  )
}

function PagBtn({ onClick, disabled, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '9px 18px', border: `1.5px solid ${hov && !disabled ? T.violet : T.border}`, borderRadius: 10, background: hov && !disabled ? T.violetSoft : T.surface, color: disabled ? T.faint : hov ? T.violet : T.muted, fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
      {children}
    </button>
  )
}