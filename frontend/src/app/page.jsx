/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '../utils/api'
import ProductGrid from '../components/ProductGrid'
import toast from 'react-hot-toast'



/* ── Marquee Strip ── */
const tags = ['Free Shipping','Secure Payment','Top Sellers','New Arrivals','Easy Returns','Verified Products','10,000+ Items']
function Marquee() {
  return (
    <div style={{ background:'var(--ink)', color:'var(--paper)', padding:'10px 0', overflow:'hidden' }}>
      <div className="marquee-track">
        {[...tags, ...tags].map((t, i) => (
          <span key={i} style={{ marginRight:48, fontSize:13, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', opacity:0.85 }}>
            {t} <span style={{ color:'var(--ember)', marginLeft:48 }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [products, setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [email, setEmail]         = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/products?limit=8'),
        apiClient.get('/categories'),
      ])
      setProducts(productsRes.data.data)
      setCategories(categoriesRes.data.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background:'var(--paper)', minHeight:'100vh' }}>
      <Marquee />

      {/* ── Hero ── */}
      <section style={{ maxWidth:1280, margin:'0 auto', padding:'clamp(60px,10vw,120px) 24px clamp(60px,8vw,100px)' }}>
        <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:64, alignItems:'center' }}>

          {/* Left */}
          <div>
            <span className="pill fade-up"
              style={{ background:'var(--mist)', color:'var(--fog)', marginBottom:24, display:'inline-block', border:'1px solid var(--stone)' }}>
              New Era Shopping Experience
            </span>
            <h1 className="serif fade-up d1"
              style={{ fontSize:'clamp(3rem,7vw,6rem)', fontWeight:900, lineHeight:1.0, letterSpacing:'-0.03em', color:'var(--ink)', marginBottom:28 }}>
              Shop<br />
              <em style={{ fontStyle:'italic', color:'var(--ember)' }}>Smarter.</em><br />
              Live Better.
            </h1>
            <p className="fade-up d2"
              style={{ fontSize:18, color:'var(--fog)', lineHeight:1.7, maxWidth:480, marginBottom:40 }}>
              Thousands of curated products from trusted sellers — delivered fast, priced right, secured with care.
            </p>
            <div className="fade-up d3" style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <Link href="/pages/products" className="btn btn-ink" style={{ fontSize:15 }}>Explore Products →</Link>
             {/*  <Link href="/pages/seller/search"  className="btn btn-outline" style={{ fontSize:15 }}>Advanced Search</Link> */}
            </div>
            <div className="fade-up d4"
              style={{ display:'flex', gap:40, marginTop:56, paddingTop:40, borderTop:'1px solid var(--stone)' }}>
              {[['10K+','Products'],['500+','Sellers'],['100K+','Customers']].map(([v,l]) => (
                <div key={l}>
                  <div className="serif" style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.02em' }}>{v}</div>
                  <div style={{ fontSize:13, color:'var(--fog)', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — decorative card stack */}
          <div className="hero-visual fade-up d2" style={{ position:'relative', height:540 }}>
            <div style={{ position:'absolute', inset:0, background:'var(--mist)', borderRadius:24, zIndex:0 }} />
            <div style={{ position:'absolute', top:32, right:24, left:24, background:'var(--paper)', borderRadius:16, padding:20, boxShadow:'0 8px 40px rgba(0,0,0,0.1)', zIndex:2 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:52, height:52, borderRadius:10, background:'var(--stone)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🛍️</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>New Arrivals</div>
                  <div style={{ color:'var(--fog)', fontSize:13 }}>250+ items added today</div>
                </div>
                <span className="pill" style={{ marginLeft:'auto', background:'#fff3ee', color:'var(--ember)' }}>New</span>
              </div>
            </div>
            <div style={{ position:'absolute', top:110, left:24, right:24, height:260, borderRadius:16, background:'linear-gradient(135deg,#e8e6e1 0%,#d6d3cc 100%)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1, overflow:'hidden' }}>
              <div className="serif" style={{ fontSize:80, opacity:0.12, fontWeight:900, letterSpacing:'-0.05em' }}>Shop</div>
              <div style={{ position:'absolute', bottom:20, left:20, display:'flex', gap:8 }}>
                {['🎧','👟','📱','🏠'].map(e => (
                  <div key={e} style={{ width:44, height:44, borderRadius:10, background:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{e}</div>
                ))}
              </div>
            </div>
            <div style={{ position:'absolute', bottom:24, left:24, right:24, background:'var(--ink)', color:'var(--paper)', borderRadius:16, padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:2 }}>
              <div>
                <div style={{ fontSize:12, opacity:0.6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Secure Checkout</div>
                <div style={{ fontWeight:700, fontSize:15, marginTop:4 }}>Stripe Protected ✓</div>
              </div>
              <div style={{ width:44, height:44, borderRadius:10, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🔒</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Pillars ── */}
      <section style={{ background:'var(--mist)', padding:'clamp(48px,8vw,80px) 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div className="trust-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
            {[
              { icon:'✦', label:'Wide Selection', desc:'Thousands of products from top brands' },
              { icon:'◈', label:'Best Prices',    desc:'Competitive pricing and regular discounts' },
              { icon:'◎', label:'Fast Shipping',  desc:'Quick delivery straight to your door' },
              { icon:'⟁', label:'Secure Payment', desc:'Protected with Stripe encryption' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="trust-box" style={{ background:'var(--paper)' }}>
                <div className="serif" style={{ fontSize:28, color:'var(--ember)', marginBottom:14 }}>{icon}</div>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:14, color:'var(--fog)', lineHeight:1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section style={{ maxWidth:1280, margin:'0 auto', padding:'clamp(64px,10vw,100px) 24px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:48, flexWrap:'wrap', gap:16 }}>
          <div>
            <div className="divider" style={{ marginBottom:16 }} />
            <h2 className="serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1 }}>
              Featured<br />Products
            </h2>
          </div>
          <Link href="/pages/products" className="btn btn-outline" style={{ fontSize:14 }}>View All →</Link>
        </div>
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div className="spinner" style={{ margin:'0 auto' }} />
          </div>
        ) : products.length > 0 ? (
          <ProductGrid products={products} loading={loading} />
        ) : (
          <p style={{ color:'var(--fog)', textAlign:'center', padding:'60px 0' }}>No products available yet</p>
        )}
      </section>

      {/* ── Stats Band ── */}
      <section style={{ background:'var(--ink)', padding:'clamp(56px,8vw,80px) 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40, textAlign:'center' }}>
            {[['10K+','Products Available'],['500+','Trusted Sellers'],['100K+','Happy Customers']].map(([v,l]) => (
              <div key={l}>
                <div className="serif" style={{ fontSize:'clamp(2.5rem,5vw,4rem)', fontWeight:900, color:'var(--paper)', letterSpacing:'-0.03em' }}>{v}</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', marginTop:8, fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
     {/*  {categories.length > 0 && (
        <section style={{ maxWidth:1280, margin:'0 auto', padding:'clamp(64px,10vw,100px) 24px' }}>
          <div style={{ marginBottom:48 }}>
            <div className="divider" style={{ marginBottom:16 }} />
            <h2 className="serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, letterSpacing:'-0.03em' }}>
              Shop by Category
            </h2>
          </div>
          <div className="cat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {categories.slice(0,6).map((cat,i) => (
              <Link key={cat.id} href={`/products?category=${cat.id}`}
                className="cat-card"
                style={{ height:i===0||i===3?360:260, display:'block', textDecoration:'none' }}>
                <img src={cat.image} alt={cat.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <div className="cat-card-overlay" />
                <div style={{ position:'absolute', bottom:24, left:24 }}>
                  <div className="serif" style={{ fontSize:22, fontWeight:700, color:'#fff', letterSpacing:'-0.01em' }}>{cat.name}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:4 }}>Browse products →</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )} */}

      {/* ── CTA ── */}
      <section style={{ maxWidth:1280, margin:'0 auto',  marginTop: '60px', padding:'0 24px clamp(64px,10vw,100px)' }}>
        <div style={{ background:'var(--ink)', borderRadius:24, padding:'clamp(48px,7vw,80px) clamp(32px,6vw,80px)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:32 }}>
          <div style={{ maxWidth:520 }}>
            <span className="pill" style={{ background:'rgba(232,67,10,0.15)', color:'var(--ember)', marginBottom:20, display:'inline-block', border:'1px solid rgba(232,67,10,0.3)' }}>
              Limited Offers
            </span>
            <h2 className="serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, color:'var(--paper)', letterSpacing:'-0.03em', lineHeight:1.1 }}>
              Ready to Start<br />Shopping?
            </h2>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:16, lineHeight:1.7, marginTop:16 }}>
              Join thousands of satisfied customers and discover amazing products at great prices.
            </p>
          </div>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <Link href="/pages/products" className="btn btn-ember" style={{ fontSize:15 }}>Shop Now →</Link>
            <Link href="/pages/search"         className="btn btn-ghost-dark" style={{ fontSize:15 }}>Advanced Search</Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section style={{ background:'var(--mist)', padding:'clamp(64px,10vw,100px) 24px' }}>
        <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
          <div className="divider" style={{ margin:'0 auto 20px' }} />
          <h2 className="serif" style={{ fontSize:'clamp(1.8rem,3vw,2.6rem)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:14 }}>
            Stay in the Loop
          </h2>
          <p style={{ color:'var(--fog)', fontSize:16, lineHeight:1.7, marginBottom:32 }}>
            Get updates on new products, special offers, and exclusive deals delivered to your inbox.
          </p>
          <div className="nl-wrap">
            <input className="nl-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="nl-btn">Subscribe</button>
          </div>
          <p style={{ fontSize:12, color:'var(--fog)', marginTop:14 }}>We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background:'var(--ink)', color:'var(--paper)', padding:'clamp(48px,8vw,80px) 24px 32px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:48, marginBottom:56 }}>
            <div>
              <div className="serif" style={{ fontSize:24, fontWeight:900, color:'var(--paper)', marginBottom:12 }}>ShopSphere</div>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>A new era of smart, curated online shopping.</p>
            </div>
            {[
              { heading:'Company', links:['About Us','Careers','Blog'] },
              { heading:'Support', links:['Contact Us','FAQ','Returns'] },
              { heading:'Legal',   links:['Privacy Policy','Terms of Service','Shipping Policy'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:18 }}>{heading}</div>
                <ul style={{ listStyle:'none' }}>
                  {links.map(l => <li key={l} style={{ marginBottom:12 }}><a href="#" className="fl">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:28, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.3)' }}>© 2026 ShopSphere. All rights reserved.</p>
            <div style={{ display:'flex', gap:24 }}>
              {['Privacy','Terms','Cookies'].map(l => <a key={l} href="#" className="fl">{l}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}