/* eslint-disable react-hooks/immutability */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '../../../../utils/api'
import { useAuthStore } from '../../../../store/authStore'
import toast from 'react-hot-toast'

const fmtINR = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : ''

const STEPS = ['Basic Info', 'Pricing', 'Media', 'Review']

export default function CreateProductPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading,    setLoading]    = useState(false)
  const [categories, setCategories] = useState([])
  const [step,       setStep]       = useState(0)
  const [imgError,   setImgError]   = useState(false)

  const [formData, setFormData] = useState({
    name:        '',
    desc:        '',
    longDesc:    '',
    price:       '',
    thumbnail:   '',
    stock:       '',
    categoryId:  '',
    discountPct: '0',
  })

  useEffect(() => {
    if (user?.role !== 'SELLER') { router.push('/'); return }
    fetchCategories()
  }, [user, router])

  async function fetchCategories() {
    try {
      const { data } = await apiClient.get('/categories')
      setCategories(data.data)
    } catch {
      toast.error('Failed to load categories')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await apiClient.post('/products', {
        ...formData,
        price:       parseFloat(formData.price),
        stock:       parseInt(formData.stock),
        discountPct: parseFloat(formData.discountPct) || 0,
      })
      toast.success('Product created successfully!')
      router.push(`/pages/products/${data.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const upd = (key, val) => setFormData(f => ({ ...f, [key]: val }))

  const discountedPrice = formData.price && formData.discountPct > 0
    ? parseFloat(formData.price) * (1 - parseFloat(formData.discountPct) / 100)
    : parseFloat(formData.price) || 0

  // Step validation
  const stepValid = [
    formData.name && formData.desc && formData.categoryId,
    formData.price && formData.stock,
    formData.thumbnail,
    true,
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)' }}>

      {/* Top bar */}
      <div className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={() => router.back()} className="back-link" style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            ← Back
          </button>
          <div style={{ width:1, height:18, background:'var(--stone)' }} />
          <span style={{ fontSize:13, fontWeight:600, color:'var(--fog)' }}>Create Product</span>
        </div>
        {/* Step progress dots */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, background: i < step ? 'var(--green)' : i === step ? 'var(--ink)' : 'var(--stone)', color: i <= step ? '#fff' : 'var(--fog)', transition:'all 0.2s', cursor: i < step ? 'pointer' : 'default' }}
                onClick={() => i < step && setStep(i)}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width:24, height:2, background: i < step ? 'var(--ink)' : 'var(--stone)', borderRadius:2, transition:'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'clamp(32px,5vw,56px) 24px' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom:40 }}>
          <div className="divider" style={{ marginBottom:14 }} />
          <h1 className="serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:8 }}>
            Create Product
          </h1>
          <p style={{ color:'var(--fog)', fontSize:15 }}>
            Step {step + 1} of {STEPS.length} — <strong style={{ color:'var(--ink)' }}>{STEPS[step]}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:28, alignItems:'start' }}
            className="create-product-layout">

            {/* ── LEFT: Form steps ── */}
            <div>

              {/* ── STEP 0: Basic Info ── */}
              {step === 0 && (
                <div className="card fade-up" style={{ display:'flex', flexDirection:'column', gap:22 }}>
                  <div className="sec-label">Basic Information</div>

                  <div className="field-wrap">
                    <label className="field-label">Product Name *</label>
                    <input className="field-input" type="text" value={formData.name}
                      onChange={e => upd('name', e.target.value)}
                      placeholder="e.g., iPhone 17 Pro Max" required />
                    <span style={{ fontSize:12, color:'var(--fog)' }}>{formData.name.length}/100 characters</span>
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">Category *</label>
                    <select className="field-input" value={formData.categoryId}
                      onChange={e => upd('categoryId', e.target.value)} required
                      style={{ cursor:'pointer' }}>
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">Short Description * <span style={{ color:'var(--fog)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(shown in listings)</span></label>
                    <textarea className="field-input" value={formData.desc}
                      onChange={e => upd('desc', e.target.value)}
                      placeholder="A brief, compelling description of your product…"
                      rows={3} required style={{ resize:'vertical', minHeight:90 }} />
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">Long Description <span style={{ color:'var(--fog)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional, shown on product page)</span></label>
                    <textarea className="field-input" value={formData.longDesc}
                      onChange={e => upd('longDesc', e.target.value)}
                      placeholder="Detailed specifications, features, and benefits…"
                      rows={5} style={{ resize:'vertical', minHeight:120 }} />
                  </div>
                </div>
              )}

              {/* ── STEP 1: Pricing ── */}
              {step === 1 && (
                <div className="card fade-up" style={{ display:'flex', flexDirection:'column', gap:22 }}>
                  <div className="sec-label">Pricing & Inventory</div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                    <div className="field-wrap">
                      <label className="field-label">Price (₹) *</label>
                      <input className="field-input" type="number" step="0.01" min="0"
                        value={formData.price} onChange={e => upd('price', e.target.value)}
                        placeholder="125000" required />
                    </div>
                    <div className="field-wrap">
                      <label className="field-label">Stock Quantity *</label>
                      <input className="field-input" type="number" min="0"
                        value={formData.stock} onChange={e => upd('stock', e.target.value)}
                        placeholder="50" required />
                    </div>
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">Discount % <span style={{ color:'var(--fog)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(0 = no discount)</span></label>
                    <input className="field-input" type="number" step="0.1" min="0" max="90"
                      value={formData.discountPct} onChange={e => upd('discountPct', e.target.value)}
                      placeholder="0" />
                    {/* Discount slider */}
                    <input type="range" min="0" max="90" step="1"
                      value={parseFloat(formData.discountPct) || 0}
                      onChange={e => upd('discountPct', e.target.value)}
                      style={{ width:'100%', marginTop:8, accentColor:'var(--ember)', cursor:'pointer' }} />
                  </div>

                  {/* Price preview */}
                  {formData.price && (
                    <div style={{ background:'var(--mist)', borderRadius:12, padding:'18px 20px', border:'1.5px solid var(--stone)' }}>
                      <div className="sec-label" style={{ marginBottom:12 }}>Price Preview</div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
                        <span className="serif" style={{ fontSize:28, fontWeight:900, color:'var(--ink)' }}>
                          {fmtINR(discountedPrice)}
                        </span>
                        {parseFloat(formData.discountPct) > 0 && (
                          <>
                            <span style={{ fontSize:16, color:'var(--fog)', textDecoration:'line-through' }}>
                              {fmtINR(parseFloat(formData.price))}
                            </span>
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--ember)', background:'#fff3ee', padding:'2px 10px', borderRadius:999, border:'1px solid rgba(232,67,10,0.2)' }}>
                              -{formData.discountPct}% off
                            </span>
                          </>
                        )}
                      </div>
                      {parseFloat(formData.discountPct) > 0 && (
                        <p style={{ fontSize:13, color:'var(--fog)', marginTop:6 }}>
                          Customer saves {fmtINR(parseFloat(formData.price) - discountedPrice)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stock status preview */}
                  {formData.stock && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600, color: parseInt(formData.stock) === 0 ? 'var(--red)' : parseInt(formData.stock) < 5 ? 'var(--ember)' : 'var(--green)' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
                      {parseInt(formData.stock) === 0 ? 'Out of Stock' : parseInt(formData.stock) < 5 ? `Low Stock — only ${formData.stock} units` : `In Stock — ${formData.stock} units available`}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: Media ── */}
              {step === 2 && (
                <div className="card fade-up" style={{ display:'flex', flexDirection:'column', gap:22 }}>
                  <div className="sec-label">Product Image</div>

                  <div className="field-wrap">
                    <label className="field-label">Thumbnail URL *</label>
                    <input className="field-input" type="url"
                      value={formData.thumbnail} onChange={e => { upd('thumbnail', e.target.value); setImgError(false) }}
                      placeholder="https://example.com/product-image.jpg" required />
                  </div>

                  {/* Image preview */}
                  {formData.thumbnail && (
                    <div>
                      <div className="sec-label" style={{ marginBottom:10 }}>Preview</div>
                      {imgError ? (
                        <div style={{ width:'100%', maxWidth:280, height:280, borderRadius:16, background:'var(--mist)', border:'1.5px dashed var(--stone)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                          <span style={{ fontSize:32 }}>🖼️</span>
                          <span style={{ fontSize:13, color:'var(--fog)' }}>Invalid image URL</span>
                        </div>
                      ) : (
                        <img src={formData.thumbnail} alt="Preview"
                          onError={() => setImgError(true)}
                          style={{ width:'100%', maxWidth:280, height:280, objectFit:'cover', borderRadius:16, border:'1.5px solid var(--stone)', display:'block' }} />
                      )}
                    </div>
                  )}

                  {/* Tips */}
                  <div style={{ background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:12, padding:'16px 18px' }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'#1e40af', marginBottom:10 }}>💡 Image Tips</div>
                    <ul style={{ fontSize:13, color:'#3b5fc0', lineHeight:1.9, paddingLeft:16 }}>
                      <li>Use square images — 800×800px or larger</li>
                      <li>White or neutral background works best</li>
                      <li>Supports JPG, PNG, WebP formats</li>
                      <li>Use CDN links (Amazon, Cloudinary, etc.) for reliability</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Review ── */}
              {step === 3 && (
                <div className="card fade-up" style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div className="sec-label">Review & Publish</div>

                  {/* Product preview card */}
                  <div style={{ border:'1.5px solid var(--stone)', borderRadius:14, overflow:'hidden' }}>
                    {formData.thumbnail && !imgError && (
                      <img src={formData.thumbnail} alt={formData.name}
                        style={{ width:'100%', height:220, objectFit:'cover', display:'block' }} />
                    )}
                    <div style={{ padding:'18px 20px' }}>
                      {formData.categoryId && categories.find(c => c.id === formData.categoryId) && (
                        <span className="sec-label" style={{ display:'block', marginBottom:6 }}>
                          {categories.find(c => c.id === formData.categoryId)?.name}
                        </span>
                      )}
                      <div className="serif" style={{ fontSize:20, fontWeight:900, marginBottom:8 }}>{formData.name || 'Product Name'}</div>
                      <p style={{ fontSize:14, color:'var(--fog)', lineHeight:1.7, marginBottom:12 }}>{formData.desc || '—'}</p>
                      <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                        <span className="serif" style={{ fontSize:22, fontWeight:900 }}>{fmtINR(discountedPrice)}</span>
                        {parseFloat(formData.discountPct) > 0 && (
                          <span style={{ fontSize:14, color:'var(--fog)', textDecoration:'line-through' }}>{fmtINR(parseFloat(formData.price))}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[
                      ['Product Name',    !!formData.name],
                      ['Category',        !!formData.categoryId],
                      ['Short Desc',      !!formData.desc],
                      ['Price',           !!formData.price],
                      ['Stock',           !!formData.stock],
                      ['Image',           !!formData.thumbnail && !imgError],
                    ].map(([label, ok]) => (
                      <div key={label} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14 }}>
                        <div style={{ width:20, height:20, borderRadius:'50%', background: ok ? 'var(--green)' : 'var(--stone)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:700, flexShrink:0 }}>
                          {ok ? '✓' : '!'}
                        </div>
                        <span style={{ color: ok ? 'var(--ink)' : 'var(--fog)', fontWeight: ok ? 500 : 400 }}>{label}</span>
                        {!ok && <span style={{ fontSize:12, color:'var(--ember)', marginLeft:'auto' }}>Required</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div style={{ display:'flex', gap:12, marginTop:20 }}>
                {step > 0 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                    style={{ padding:'14px 24px', border:'1.5px solid var(--stone)', borderRadius:10, background:'var(--paper)', fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:15, color:'var(--ink)', transition:'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--stone)'}>
                    ← Back
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button type="button"
                    onClick={() => stepValid[step] && setStep(s => s + 1)}
                    disabled={!stepValid[step]}
                    style={{ flex:1, padding:'14px', borderRadius:10, border:'none', background: stepValid[step] ? 'var(--ink)' : 'var(--stone)', color: stepValid[step] ? '#fff' : 'var(--fog)', fontWeight:700, fontSize:15, cursor: stepValid[step] ? 'pointer' : 'not-allowed', fontFamily:'inherit', transition:'background 0.2s' }}>
                    Continue →
                  </button>
                ) : (
                  <button type="submit" disabled={loading}
                    style={{ flex:1, padding:'14px', borderRadius:10, border:'none', background:'var(--ember)', color:'#fff', fontWeight:700, fontSize:16, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: loading ? 0.7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'opacity 0.2s, transform 0.15s' }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.transform='translateY(-1px)' }}
                    onMouseLeave={e => e.currentTarget.style.transform='none'}>
                    {loading ? <><span className="spinner-sm" /> Publishing…</> : '✦ Publish Product'}
                  </button>
                )}
              </div>
            </div>

            {/* ── RIGHT: sidebar tips ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="create-product-tips">
              {/* Step guide */}
              <div style={{ background:'var(--mist)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'20px 20px' }}>
                <div className="sec-label" style={{ marginBottom:14 }}>Your Progress</div>
                {STEPS.map((s, i) => (
                  <div key={s} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < STEPS.length - 1 ? '1px solid var(--stone)' : 'none', cursor: i < step ? 'pointer' : 'default' }}
                    onClick={() => i < step && setStep(i)}>
                    <div style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, background: i < step ? 'var(--green)' : i === step ? 'var(--ink)' : 'transparent', color: i <= step ? '#fff' : 'var(--fog)', border: i > step ? '1.5px solid var(--stone)' : 'none', flexShrink:0 }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize:14, fontWeight: i === step ? 700 : 400, color: i === step ? 'var(--ink)' : i < step ? 'var(--green)' : 'var(--fog)' }}>{s}</span>
                  </div>
                ))}
              </div>

              {/* Contextual tips */}
              <div style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'20px 20px' }}>
                <div className="sec-label" style={{ marginBottom:12 }}>
                  {['Tips for Basic Info','Pricing Tips','Image Tips','Final Check'][step]}
                </div>
                <ul style={{ fontSize:13, color:'var(--fog)', lineHeight:2, paddingLeft:16 }}>
                  {[
                    ['Use a clear product name','Pick the right category','Write a concise short description','Add detailed specs in long description'],
                    ['Research competitor prices','Use round numbers for clarity','Discounts attract more buyers','Keep stock count accurate'],
                    ['Use white backgrounds','High resolution = more trust','Consistent image ratios','Show multiple angles if possible'],
                    ['Review all details','Check the preview card','Once published, you can edit','Your product goes live instantly'],
                  ][step].map(tip => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .create-product-layout { grid-template-columns: 1fr !important; }
          .create-product-tips { display: none !important; }
        }
      `}</style>
    </div>
  )
}