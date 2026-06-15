'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useAuthStore } from "../../../../store/authStore"
import apiClient from "../../../../utils/api"
import toast from "react-hot-toast"

const T = {
  bg: '#FFFFFF', surface: '#F7F7FB', border: '#E8E7F2', borderHov: '#C4B5FD',
  ink: '#0F0E1A', muted: '#6B6880', faint: '#A09DB8',
  violet: '#7C3AED', violetDark: '#5B21B6', violetSoft: '#EDE9FE', violetMid: '#C4B5FD',
  red: '#DC2626', redSoft: '#FEE2E2',
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [focused, setFocused] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(formData.email, formData.password)
      toast.success('Welcome back!')
      router.push('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const field = (name) => ({
    onFocus: () => setFocused(name),
    onBlur:  () => setFocused(''),
    style: inputStyle(focused === name),
  })

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'Inter', sans-serif" }} className="auth-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,900;1,900&display=swap');
        * { box-sizing: border-box; }
        .auth-panel { display: flex !important; }
        @media (max-width: 768px) {
          .auth-root   { grid-template-columns: 1fr !important; }
          .auth-panel  { display: none !important; }
        }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px ${T.violetSoft} inset !important; -webkit-text-fill-color: ${T.ink} !important; }
      `}</style>

      {/* ── LEFT PANEL (decorative) ── */}
      <div className="auth-panel" style={{ background: `linear-gradient(145deg, ${T.violet} 0%, ${T.violetDark} 60%, #3B0764 100%)`, position: 'relative', overflow: 'hidden', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top: '40%', right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 52 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, backdropFilter: 'blur(8px)' }}>🛍️</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.03em' }}>ShopSphere</span>
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 18 }}>
            Welcome<br /><em style={{ fontStyle: 'italic', color: T.violetMid }}>back.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.75, marginBottom: 48 }}>
            Sign in to continue shopping, track orders, and access your personal dashboard.
          </p>

          {/* Mini feature chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🚚', text: 'Track all your orders in one place' },
              { icon: '♥',  text: 'Access your saved wishlist'         },
              { icon: '⚡', text: 'Faster checkout every time'         },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', textAlign: 'left' }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div style={{ background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px,5vw,56px) clamp(24px,4vw,48px)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${T.violet}, ${T.violetDark})`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛍️</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: T.ink, letterSpacing: '-0.03em' }}>Shop<span style={{ color: T.violet }}>Sphere</span></span>
          </div>

          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.ink, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Sign in</h1>
            <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Don&lsquo;t have an account? <Link href="/pages/auth/register" style={{ color: T.violet, fontWeight: 700, textDecoration: 'none' }}>Create one →</Link></p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <Field label="Email Address">
              <input type="email" placeholder="you@example.com" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required {...field('email')} />
            </Field>

            <Field label="Password" extra={<Link href="#" style={{ fontSize: 12, color: T.violet, fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>}>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required {...field('password')} style={{ ...inputStyle(focused === 'password'), paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.faint, fontSize: 15, padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>

            <button type="submit" disabled={loading}
              style={{ marginTop: 4, padding: '14px', background: loading ? T.surface : `linear-gradient(135deg, ${T.violet}, ${T.violetDark})`, border: `1.5px solid ${loading ? T.border : 'transparent'}`, borderRadius: 12, color: loading ? T.faint : '#fff', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Spinner /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <Divider />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SocialBtn icon="G" label="Google" />
            <SocialBtn icon="f" label="Facebook" />
          </div>

          <p style={{ fontSize: 12, color: T.faint, textAlign: 'center', marginTop: 28, lineHeight: 1.6 }}>
            By signing in, you agree to our <a href="#" style={{ color: T.muted, textDecoration: 'underline' }}>Terms</a> &amp; <a href="#" style={{ color: T.muted, textDecoration: 'underline' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
      <style>{`.mobile-logo { display: none !important; } @media(max-width:768px){ .mobile-logo { display: flex !important; } }`}</style>
    </div>
  )
}

/* ── shared helpers ── */
function inputStyle(focused) {
  return {
    width: '100%', padding: '12px 14px', background: focused ? '#EDE9FE' : '#F7F7FB',
    border: `1.5px solid ${focused ? '#7C3AED' : '#E8E7F2'}`,
    borderRadius: 10, fontSize: 14, color: '#0F0E1A', fontFamily: 'inherit', outline: 'none',
    transition: 'all 0.18s', boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
  }
}

function Field({ label, children, extra }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#0F0E1A' }}>{label}</label>
        {extra}
      </div>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
      <div style={{ flex: 1, height: 1.5, background: '#E8E7F2' }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#A09DB8', whiteSpace: 'nowrap' }}>or continue with</span>
      <div style={{ flex: 1, height: 1.5, background: '#E8E7F2' }} />
    </div>
  )
}

function SocialBtn({ icon, label }) {
  const [hov, setHov] = useState(false)
  return (
    <button type="button" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: hov ? '#F0EFFA' : '#F7F7FB', border: `1.5px solid ${hov ? '#C4B5FD' : '#E8E7F2'}`, borderRadius: 10, fontWeight: 600, fontSize: 13, color: '#0F0E1A', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
      <span style={{ fontWeight: 800, fontSize: 14 }}>{icon}</span> {label}
    </button>
  )
}

function Spinner() {
  return <span style={{ width: 15, height: 15, border: '2px solid #C4B5FD', borderTopColor: '#7C3AED', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </span>
}