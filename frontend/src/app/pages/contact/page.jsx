'use client'

import { useState } from 'react'
import Link from 'next/link'

const CONTACT_EMAIL = 'support@shopsphere.in' // ← change to your actual email

const INQUIRY_TYPES = [
  { value: 'general',   label: '💬 General Enquiry' },
  { value: 'order',     label: '📦 Order Support' },
  { value: 'seller',    label: '🏪 Seller Partnership' },
  { value: 'technical', label: '🔧 Technical Issue' },
  { value: 'billing',   label: '💳 Billing & Payments' },
  { value: 'other',     label: '✦ Other' },
]

const INFO_CARDS = [
  {
    icon: '📧',
    title: 'Email Us',
    lines: [CONTACT_EMAIL, 'We reply within 24 hours'],
    action: { label: 'Send Email', href: `mailto:${CONTACT_EMAIL}` },
  },
  {
    icon: '📞',
    title: 'Call Us',
    lines: ['+91 98765 43210', 'Mon–Sat, 9am – 6pm IST'],
    action: { label: 'Call Now', href: 'tel:+919876543210' },
  },
  {
    icon: '📍',
    title: 'Visit Us',
    lines: ['ShopSphere HQ, Bandra Kurla Complex', 'Mumbai, Maharashtra 400051'],
    action: { label: 'Get Directions', href: 'https://maps.google.com' },
  },
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name:        '',
    email:       '',
    phone:       '',
    inquiryType: '',
    subject:     '',
    message:     '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [focused,   setFocused]   = useState('')

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  /* Build the mailto: link with all form details pre-filled */
  function buildMailtoLink() {
    const typeLabel  = INQUIRY_TYPES.find(t => t.value === form.inquiryType)?.label || form.inquiryType
    const bodyLines  = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || 'Not provided'}`,
      `Inquiry Type: ${typeLabel}`,
      ``,
      `Message:`,
      form.message,
      ``,
      `---`,
      `Sent from ShopSphere Contact Form`,
    ]
    const subject = encodeURIComponent(`[ShopSphere] ${form.subject || typeLabel}`)
    const body    = encodeURIComponent(bodyLines.join('\n'))
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Open the user's mail client with everything pre-filled
    window.location.href = buildMailtoLink()
    setSubmitted(true)
  }

  const inputStyle = (name) => ({
    width:        '100%',
    padding:      '13px 16px',
    border:       `1.5px solid ${focused === name ? 'var(--ink)' : 'var(--stone)'}`,
    borderRadius: 8,
    fontSize:     15,
    fontFamily:   'inherit',
    color:        'var(--ink)',
    background:   'var(--paper)',
    outline:      'none',
    boxShadow:    focused === name ? '0 0 0 3px rgba(10,10,10,0.06)' : 'none',
    transition:   'border-color 0.2s, box-shadow 0.2s',
  })

  const fieldLabel = {
    fontSize:      11,
    fontWeight:    700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color:         'var(--fog)',
    marginBottom:  6,
    display:       'block',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>

      {/* ── Top bar ── */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" className="back-link">← Home</Link>
          <div style={{ width: 1, height: 18, background: 'var(--stone)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fog)' }}>Contact Us</span>
        </div>
        <Link href="/pages/about" className="back-link" style={{ fontSize: 13 }}>About Us</Link>
      </div>

      {/* ── Hero ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 24px', borderBottom: '1.5px solid var(--stone)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span className="pill fade-up"
            style={{ background: 'var(--mist)', color: 'var(--fog)', border: '1px solid var(--stone)', display: 'inline-block', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
            Get in Touch
          </span>
          <h1 className="serif fade-up d1"
            style={{ fontSize: 'clamp(2.6rem,7vw,5.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: 24, maxWidth: 700 }}>
            We&lsquo;d love to{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--ember)' }}>hear</em>{' '}
            from you.
          </h1>
          <p className="fade-up d2"
            style={{ fontSize: 'clamp(15px,2.5vw,18px)', color: 'var(--fog)', lineHeight: 1.7, maxWidth: 520 }}>
            Whether you have a question about an order, want to become a seller, or just want to say hello — our team is here for you.
          </p>
        </div>
      </section>

      {/* ── Info cards ── */}
      <section style={{ padding: 'clamp(36px,5vw,56px) 24px', background: 'var(--mist)', borderBottom: '1.5px solid var(--stone)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}
          className="contact-info-grid">
          {INFO_CARDS.map(({ icon, title, lines, action }) => (
            <div key={title}
              style={{ background: 'var(--paper)', border: '1.5px solid var(--stone)', borderRadius: 16, padding: '28px 24px', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--stone)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{title}</div>
              {lines.map((l, i) => (
                <div key={i} style={{ fontSize: 14, color: i === 0 ? 'var(--ink)' : 'var(--fog)', fontWeight: i === 0 ? 600 : 400, lineHeight: 1.6 }}>{l}</div>
              ))}
              <a href={action.href}
                target={action.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, fontSize: 13, fontWeight: 700, color: 'var(--sky)', textDecoration: 'none', transition: 'gap 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.gap = '10px'}
                onMouseLeave={e => e.currentTarget.style.gap = '6px'}>
                {action.label} →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main: Form + Sidebar ── */}
      <section style={{ padding: 'clamp(48px,7vw,80px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}
          className="contact-main-grid">

          {/* ── Form ── */}
          <div>
            <div style={{ marginBottom: 32 }}>
              <div className="divider" style={{ marginBottom: 16 }} />
              <h2 className="serif"
                style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
                Send us a message
              </h2>
              <p style={{ color: 'var(--fog)', fontSize: 15 }}>
                Fill in the form — clicking <strong style={{ color: 'var(--ink)' }}>Send Enquiry</strong> will open your email client with everything pre-filled and ready to send.
              </p>
            </div>

            {submitted ? (
              /* ── Success state ── */
              <div className="card fade-up" style={{ textAlign: 'center', padding: '56px 32px' }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>📬</div>
                <div className="divider" style={{ margin: '0 auto 20px' }} />
                <h3 className="serif" style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>
                  Your email client is open!
                </h3>
                <p style={{ color: 'var(--fog)', fontSize: 15, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 28px' }}>
                  We&lsquo;ve pre-filled your message in your email client. Just hit <strong>Send</strong> and we&lsquo;ll get back to you within 24 hours.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => setSubmitted(false)}
                    className="btn btn-outline" style={{ fontSize: 14 }}>
                    Send Another Message
                  </button>
                  <Link href="/" className="btn btn-ink" style={{ fontSize: 14 }}>Back to Home</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Name + Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="form-2col">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={fieldLabel}>Your Name *</label>
                      <input
                        type="text" value={form.name} required
                        placeholder="Arjun Mehta"
                        onChange={e => upd('name', e.target.value)}
                        onFocus={() => setFocused('name')}
                        onBlur={() => setFocused('')}
                        style={inputStyle('name')}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={fieldLabel}>Email Address *</label>
                      <input
                        type="email" value={form.email} required
                        placeholder="arjun@example.com"
                        onChange={e => upd('email', e.target.value)}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused('')}
                        style={inputStyle('email')}
                      />
                    </div>
                  </div>

                  {/* Phone + Inquiry type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="form-2col">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={fieldLabel}>Phone <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                      <input
                        type="tel" value={form.phone}
                        placeholder="+91 98765 43210"
                        onChange={e => upd('phone', e.target.value)}
                        onFocus={() => setFocused('phone')}
                        onBlur={() => setFocused('')}
                        style={inputStyle('phone')}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={fieldLabel}>Inquiry Type *</label>
                      <select
                        value={form.inquiryType} required
                        onChange={e => upd('inquiryType', e.target.value)}
                        onFocus={() => setFocused('inquiryType')}
                        onBlur={() => setFocused('')}
                        style={{ ...inputStyle('inquiryType'), cursor: 'pointer' }}>
                        <option value="">Select type…</option>
                        {INQUIRY_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={fieldLabel}>Subject *</label>
                    <input
                      type="text" value={form.subject} required
                      placeholder="e.g., I haven't received my order #12345"
                      onChange={e => upd('subject', e.target.value)}
                      onFocus={() => setFocused('subject')}
                      onBlur={() => setFocused('')}
                      style={inputStyle('subject')}
                    />
                  </div>

                  {/* Message */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={fieldLabel}>
                      Message *{' '}
                      <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, float: 'right' }}>
                        {form.message.length}/1000
                      </span>
                    </label>
                    <textarea
                      value={form.message} required
                      maxLength={1000}
                      rows={6}
                      placeholder="Tell us more about your enquiry…"
                      onChange={e => upd('message', e.target.value)}
                      onFocus={() => setFocused('message')}
                      onBlur={() => setFocused('')}
                      style={{ ...inputStyle('message'), resize: 'vertical', minHeight: 140 }}
                    />
                  </div>

                  {/* Mailto notice */}
                  <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '13px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
                    <p style={{ fontSize: 13, color: '#3b5fc0', lineHeight: 1.6 }}>
                      Clicking <strong>Send Enquiry</strong> will open your email app (Gmail, Outlook, Apple Mail, etc.) with your message pre-filled. Just press <strong>Send</strong> in your email client.
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    style={{ width: '100%', padding: '16px', borderRadius: 10, border: 'none', background: 'var(--ink)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#222'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.18)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                    📧 Send Enquiry via Email
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="contact-sidebar">

            {/* Response time */}
            <div style={{ background: 'var(--ink)', borderRadius: 16, padding: '28px 24px', color: 'var(--paper)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                Response Times
              </div>
              {[
                ['General Enquiries',  '< 24 hours'],
                ['Order Support',      '< 4 hours'],
                ['Technical Issues',   '< 12 hours'],
                ['Seller Partnership', '2–3 business days'],
              ].map(([t, r]) => (
                <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>{t}</span>
                  <span style={{ fontWeight: 700, color: 'var(--paper)', whiteSpace: 'nowrap' }}>{r}</span>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{ background: 'var(--mist)', border: '1.5px solid var(--stone)', borderRadius: 16, padding: '24px 22px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fog)', marginBottom: 16 }}>
                Quick Answers
              </div>
              {[
                ['Where is my order?',          'Track in My Orders page'],
                ['How do I return an item?',    'Visit our Returns policy'],
                ['How to become a seller?',     'Apply via Seller signup'],
                ['Is my payment secure?',       'Yes — powered by Stripe'],
              ].map(([q, a]) => (
                <div key={q} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--stone)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{q}</div>
                  <div style={{ fontSize: 13, color: 'var(--fog)' }}>{a}</div>
                </div>
              ))}
              <Link href="/pages/products"
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--sky)', textDecoration: 'none' }}>
                View full FAQ →
              </Link>
            </div>

            {/* Direct email CTA */}
            <a href={`mailto:${CONTACT_EMAIL}`}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', border: '1.5px solid var(--stone)', borderRadius: 14, textDecoration: 'none', color: 'inherit', background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--stone)'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📧</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Prefer direct email?</div>
                <div style={{ fontSize: 13, color: 'var(--sky)', fontWeight: 600, marginTop: 2 }}>{CONTACT_EMAIL}</div>
              </div>
            </a>

            {/* Social */}
            <div style={{ background: 'var(--mist)', border: '1.5px solid var(--stone)', borderRadius: 14, padding: '20px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fog)', marginBottom: 14 }}>
                Follow Us
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['𝕏 Twitter','#'],['📘 Facebook','#'],['📸 Instagram','#']].map(([label, href]) => (
                  <a key={label} href={href}
                    style={{ flex: 1, padding: '9px', textAlign: 'center', border: '1.5px solid var(--stone)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', background: 'var(--paper)', transition: 'border-color 0.15s, background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.background = 'var(--mist)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--stone)'; e.currentTarget.style.background = 'var(--paper)' }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Map placeholder ── */}
      <section style={{ height: 280, background: 'var(--mist)', borderTop: '1.5px solid var(--stone)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Bandra Kurla Complex, Mumbai</div>
          <a href="https://maps.google.com" target="_blank" rel="noreferrer"
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--sky)', textDecoration: 'none' }}>
            Open in Google Maps →
          </a>
        </div>
        {/* Decorative grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--stone) 1px, transparent 1px), linear-gradient(90deg, var(--stone) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4 }} />
      </section>

      <style>{`
        @media (max-width: 900px) {
          .contact-main-grid { grid-template-columns: 1fr !important; }
          .contact-info-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .contact-sidebar   { display: none !important; }
        }
        @media (max-width: 600px) {
          .form-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}