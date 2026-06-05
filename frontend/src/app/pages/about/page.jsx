'use client'

import Link from 'next/link'

const TEAM = [
  { name:'Sujeet Khupase',   role:'CEO & Co-founder',      emoji:'👨‍💼', bio:'Passionate about building the future of Indian commerce.' },
  { name:'Ankita Gatkul',  role:'CTO',                   emoji:'👩‍💻', bio:'10+ years of engineering experience across fintech and e-commerce.' },
  { name:'Neha Pol',   role:'Head of Design',        emoji:'🎨', bio:'Crafting beautiful, accessible experiences since 2015.' },
  { name:'Sumeet Khupase',   role:'Head of Seller Success',emoji:'🚀', bio:'Helping sellers grow their businesses every single day.' },
]

const MILESTONES = [
  { year:'2021', title:'Founded',        desc:'ShopSphere was born in a Mumbai apartment with 3 people and a big idea.' },
  { year:'2022', title:'First 1K Sellers',desc:'We onboarded our first 1,000 sellers across 12 Indian cities.' },
  { year:'2023', title:'₹100Cr GMV',     desc:'Crossed ₹100 Crore in gross merchandise value in under 2 years.' },
  { year:'2024', title:'10L Customers',  desc:'Reached 10 lakh happy customers and launched same-day delivery.' },
  { year:'2025', title:'Pan-India',      desc:'Expanded to every pin code in India with 500+ seller partners.' },
  { year:'2026', title:'Today',          desc:'Continuing to grow, innovate, and serve Indias shopping needs.' },
]

const VALUES = [
  { icon:'✦', title:'Customer First',   desc:'Every decision we make starts and ends with whats best for our customers.' },
  { icon:'◎', title:'Seller Success',   desc:'Our sellers are our partners. When they grow, we all grow together.' },
  { icon:'◈', title:'Radical Honesty',  desc:'We communicate with transparency — with our team, sellers, and customers.' },
  { icon:'⟁', title:'Built for India',  desc:'We design for the unique needs, languages, and diversity of Indian commerce.' },
]

export default function AboutPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)' }}>

      {/* ── Hero ── */}
      <section style={{ borderBottom:'1.5px solid var(--stone)', padding:'clamp(56px,10vw,120px) 24px', background:'var(--paper)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <span className="pill fade-up" style={{ background:'var(--mist)', color:'var(--fog)', border:'1px solid var(--stone)', display:'inline-block', marginBottom:24, textTransform:'uppercase', letterSpacing:'0.06em', fontSize:11 }}>
            About Us
          </span>
          <h1 className="serif fade-up d1" style={{ fontSize:'clamp(2.8rem,8vw,6.5rem)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:0.95, marginBottom:32, maxWidth:800 }}>
            We&lsquo;re building India&lsquo;s most{' '}
            <em style={{ fontStyle:'italic', color:'var(--ember)' }}>trusted</em>{' '}
            marketplace.
          </h1>
          <p className="fade-up d2" style={{ fontSize:'clamp(16px,2.5vw,20px)', color:'var(--fog)', lineHeight:1.7, maxWidth:620 }}>
            ShopSphere connects millions of buyers with thousands of sellers across India — built on trust, speed, and a relentless focus on people.
          </p>

          {/* Stats row */}
          <div className="fade-up d3" style={{ display:'flex', gap:'clamp(32px,6vw,80px)', marginTop:56, paddingTop:40, borderTop:'1.5px solid var(--stone)', flexWrap:'wrap' }}>
            {[['10K+','Products'],['500+','Sellers'],['10L+','Customers'],['50+','Cities']].map(([v,l]) => (
              <div key={l}>
                <div className="serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, letterSpacing:'-0.03em', color:'var(--ink)' }}>{v}</div>
                <div style={{ fontSize:14, color:'var(--fog)', marginTop:4, fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section style={{ padding:'clamp(56px,8vw,96px) 24px', background:'var(--ink)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(32px,6vw,72px)', alignItems:'center' }} className="about-2col">
          <div>
            <div className="divider" style={{ marginBottom:20 }} />
            <h2 className="serif" style={{ fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:900, letterSpacing:'-0.03em', color:'var(--paper)', lineHeight:1.1, marginBottom:24 }}>
              Our Mission
            </h2>
            <p style={{ fontSize:17, color:'rgba(255,255,255,0.6)', lineHeight:1.8, marginBottom:20 }}>
              We believe every Indian seller — from a craftsperson in Jaipur to a tech entrepreneur in Bangalore — deserves access to a world-class platform to grow their business.
            </p>
            <p style={{ fontSize:17, color:'rgba(255,255,255,0.6)', lineHeight:1.8 }}>
              And every buyer deserves a seamless, trustworthy experience that matches the best in the world — built specifically for India.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {VALUES.map(({ icon, title, desc }) => (
              <div key={title} style={{ background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'24px 20px', transition:'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}>
                <div className="serif" style={{ fontSize:26, color:'var(--ember)', marginBottom:12 }}>{icon}</div>
                <div style={{ fontWeight:700, fontSize:15, color:'var(--paper)', marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section style={{ padding:'clamp(56px,8vw,96px) 24px', background:'var(--mist)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div className="divider" style={{ margin:'0 auto 20px' }} />
            <h2 className="serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, letterSpacing:'-0.03em' }}>Our Journey</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }} className="timeline-grid">
            {MILESTONES.map(({ year, title, desc }) => (
              <div key={year} style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'24px 24px', transition:'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.09)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--stone)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
                <div className="serif" style={{ fontSize:36, fontWeight:900, color:'var(--ember)', letterSpacing:'-0.03em', lineHeight:1 }}>{year}</div>
                <div style={{ fontWeight:700, fontSize:17, marginTop:10, marginBottom:8 }}>{title}</div>
                <div style={{ fontSize:14, color:'var(--fog)', lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section style={{ padding:'clamp(56px,8vw,96px) 24px', background:'var(--paper)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ marginBottom:48 }}>
            <div className="divider" style={{ marginBottom:16 }} />
            <h2 className="serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, letterSpacing:'-0.03em' }}>The Team</h2>
            <p style={{ color:'var(--fog)', fontSize:16, marginTop:10 }}>The people behind ShopSphere.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }} className="team-grid">
            {TEAM.map(({ name, role, emoji, bio }) => (
              <div key={name} style={{ border:'1.5px solid var(--stone)', borderRadius:16, padding:'28px 20px', textAlign:'center', transition:'border-color 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--stone)'; e.currentTarget.style.boxShadow='none' }}>
                <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--mist)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 16px' }}>{emoji}</div>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>{name}</div>
                <div style={{ fontSize:12, color:'var(--ember)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>{role}</div>
                <div style={{ fontSize:13, color:'var(--fog)', lineHeight:1.6 }}>{bio}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'clamp(56px,8vw,80px) 24px', background:'var(--mist)', borderTop:'1.5px solid var(--stone)' }}>
        <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
          <div className="divider" style={{ margin:'0 auto 20px' }} />
          <h2 className="serif" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:16 }}>
            Want to know more?
          </h2>
          <p style={{ color:'var(--fog)', fontSize:16, lineHeight:1.7, marginBottom:32 }}>
            Have questions about ShopSphere? We&lsquo;d love to hear from you.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/pages/contact" className="btn btn-ink" style={{ fontSize:15 }}>Contact Us →</Link>
            <Link href="/pages/products" className="btn btn-outline" style={{ fontSize:15 }}>Browse Products</Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .about-2col   { grid-template-columns: 1fr !important; }
          .timeline-grid{ grid-template-columns: 1fr 1fr !important; }
          .team-grid    { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .timeline-grid{ grid-template-columns: 1fr !important; }
          .team-grid    { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}