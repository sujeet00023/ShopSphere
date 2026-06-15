'use client'

import { useState } from "react"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiClient from "../../../../utils/api"
import { useAuthStore } from "../../../../store/authStore"
import toast from 'react-hot-toast'

const T = {
  bg: '#FFFFFF', surface: '#F7F7FB', border: '#E8E7F2',
  ink: '#0F0E1A', muted: '#6B6880', faint: '#A09DB8',
  violet: '#7C3AED', violetDark: '#5B21B6', violetSoft: '#EDE9FE', violetMid: '#C4B5FD',
  amber: '#D97706', amberSoft: '#FEF3C7', amberMid: '#FDE68A',
}

const ROLES = [
  { value: 'CUSTOMER', icon: '👤', label: 'Customer', desc: 'Browse & buy products'  },
  { value: 'SELLER',   icon: '🏪', label: 'Seller',   desc: 'List & sell products'    },
  { value: 'ADMIN',    icon: '⚙️', label: 'Admin',    desc: 'Manage the platform'     },
]

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [step,     setStep]     = useState(1)
  const [focused,  setFocused]  = useState('')
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '', adminCode: '' })

  function set(key, val) { setFormData(p => ({ ...p, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (formData.role === 'ADMIN') {
        const code = formData.adminCode
        if (!code) { toast.error('Admin code is required'); setLoading(false); return }
        if (code !== process.env.NEXT_PUBLIC_ADMIN_CODE && code !== 'admin123') {
          toast.error('Invalid admin code'); setLoading(false); return
        }
      }
      const { data } = await apiClient.post('/auth/register', {
        name: formData.name, email: formData.email,
        password: formData.password, role: formData.role,
      })
      localStorage.setItem('token', data.token)
      login(data.user)
      toast.success('Account created! Welcome to ShopSphere 🎉')
      if (formData.role === 'SELLER')     router.push('/pages/seller/dashboard')
      else if (formData.role === 'ADMIN') router.push('/pages/admin/dashboard')
      else                                router.push('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const iField = (name) => ({
    onFocus: () => setFocused(name),
    onBlur:  () => setFocused(''),
    style: inputStyle(focused === name),
  })

  const selectedRole = ROLES.find(r => r.value === formData.role)

  const passLen = formData.password.length
  const passStrength = passLen === 0 ? 0 : passLen < 6 ? 1 : passLen < 10 ? 2 : passLen < 14 ? 3 : 4
  const strengthColors = ['#E8E7F2', '#DC2626', '#D97706', '#059669', '#7C3AED']
  const strengthLabels = ['', 'Too short', 'Fair', 'Good', 'Strong']

  return (
    <div className="auth-root" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT DECORATIVE PANEL ── */}
      <div className="auth-panel" style={{ background: 'linear-gradient(145deg, #7C3AED 0%, #5B21B6 55%, #3B0764 100%)', position: 'relative', overflow: 'hidden', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ position: 'absolute', top: -80,  left: -80,  width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom:-60, right:-60,  width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top:'40%', right:-40,  width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 52 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛍️</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.03em' }}>ShopSphere</span>
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 18 }}>
            Join the<br /><em style={{ fontStyle: 'italic', color: '#C4B5FD' }}>community.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.75, marginBottom: 48 }}>
            Over 100,000 customers and 500 sellers trust ShopSphere for a better shopping experience.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { val: '10K+',  label: 'Products'    },
              { val: '500+',  label: 'Sellers'     },
              { val: '100K+', label: 'Customers'   },
              { val: '4.9★',  label: 'Avg. Rating' },
            ].map(({ val, label }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div style={{ background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px,5vw,56px) clamp(24px,4vw,48px)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Mobile logo */}
          <div className="auth-mobile-logo" style={{ alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛍️</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: T.ink, letterSpacing: '-0.03em' }}>Shop<span style={{ color: T.violet }}>Sphere</span></span>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 999, background: step >= s ? T.violet : T.border, transition: 'background 0.3s' }} />
            ))}
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: '-0.03em', margin: '0 0 7px' }}>
              {step === 1 ? 'Choose your role' : 'Create your account'}
            </h1>
            <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
              {step === 1
                ? 'Pick how you want to use ShopSphere'
                : <span>Already have an account?{' '}<Link href="/pages/auth/login" style={{ color: T.violet, fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link></span>}
            </p>
          </div>

          {/* ── STEP 1: Role picker ── */}
          {step === 1 && (
            <div className="auth-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ROLES.map(({ value, icon, label, desc }) => {
                const active = formData.role === value
                return (
                  <button key={value} type="button" onClick={() => set('role', value)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', border: `2px solid ${active ? T.violet : T.border}`, borderRadius: 14, background: active ? T.violetSoft : T.surface, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.18s', boxShadow: active ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: active ? T.violet : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, transition: 'all 0.18s' }}>{icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: active ? T.violet : T.ink }}>{label}</div>
                      <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{desc}</div>
                    </div>
                    {active && (
                      <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: 999, background: T.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>
                      </div>
                    )}
                  </button>
                )
              })}

              <button type="button"
                onClick={() => { if (!formData.role) { toast.error('Please select a role'); return }; setStep(2) }}
                style={{ marginTop: 8, padding: '14px', background: formData.role ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : T.surface, border: `1.5px solid ${formData.role ? 'transparent' : T.border}`, borderRadius: 12, color: formData.role ? '#fff' : T.faint, fontWeight: 800, fontSize: 15, cursor: formData.role ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.18s', boxShadow: formData.role ? '0 4px 16px rgba(124,58,237,0.28)' : 'none' }}>
                Continue as {selectedRole?.label || '...'} →
              </button>

              <p style={{ fontSize: 12, color: T.faint, textAlign: 'center', marginTop: 8 }}>
                Already have an account?{' '}
                <Link href="/pages/auth/login" style={{ color: T.violet, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: Details form ── */}
          {step === 2 && (
            <form className="auth-fade-in" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Role badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: T.violetSoft, border: `1.5px solid ${T.violetMid}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{selectedRole?.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.violet }}>{selectedRole?.label} Account</span>
                </div>
                <button type="button" onClick={() => setStep(1)}
                  style={{ fontSize: 12, color: T.violet, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'underline' }}>
                  Change
                </button>
              </div>

              <Field label="Full Name">
                <input type="text" placeholder="John Doe" value={formData.name}
                  onChange={e => set('name', e.target.value)} required {...iField('name')} />
              </Field>

              <Field label="Email Address">
                <input type="email" placeholder="you@example.com" value={formData.email}
                  onChange={e => set('email', e.target.value)} required {...iField('email')} />
              </Field>

              <Field label="Password">
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={formData.password} onChange={e => set('password', e.target.value)}
                    required minLength={8} {...iField('password')}
                    style={{ ...inputStyle(focused === 'password'), paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.faint, fontSize: 15, display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* Password strength */}
                {formData.password && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: passStrength >= i ? strengthColors[passStrength] : T.border, transition: 'background 0.2s' }} />
                    ))}
                    <span style={{ fontSize: 11, color: T.faint, marginLeft: 6, whiteSpace: 'nowrap' }}>
                      {strengthLabels[passStrength]}
                    </span>
                  </div>
                )}
              </Field>

              {/* Admin code */}
              {formData.role === 'ADMIN' && (
                <div style={{ background: T.amberSoft, border: `1.5px solid ${T.amberMid}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 15 }}>⚠️</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>Admin Code Required</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6, margin: '0 0 10px' }}>
                    Contact the platform owner to obtain an admin access code.
                  </p>
                  <input type="password" placeholder="Enter admin code" value={formData.adminCode}
                    onChange={e => set('adminCode', e.target.value)}
                    style={{ ...inputStyle(focused === 'adminCode'), borderColor: T.amberMid, background: '#FFFBEB' }}
                    onFocus={() => setFocused('adminCode')} onBlur={() => setFocused('')} />
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ marginTop: 4, padding: '14px', background: loading ? T.surface : 'linear-gradient(135deg, #7C3AED, #5B21B6)', border: `1.5px solid ${loading ? T.border : 'transparent'}`, borderRadius: 12, color: loading ? T.faint : '#fff', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><Spinner /> Creating account…</> : 'Create Account →'}
              </button>

              <p style={{ fontSize: 12, color: T.faint, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                By registering, you agree to our{' '}
                <a href="#" style={{ color: T.muted, textDecoration: 'underline' }}>Terms</a> &amp;{' '}
                <a href="#" style={{ color: T.muted, textDecoration: 'underline' }}>Privacy Policy</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function inputStyle(focused) {
  return {
    width: '100%', padding: '12px 14px',
    background: focused ? '#EDE9FE' : '#F7F7FB',
    border: `1.5px solid ${focused ? '#7C3AED' : '#E8E7F2'}`,
    borderRadius: 10, fontSize: 14, color: '#0F0E1A',
    fontFamily: 'inherit', outline: 'none', transition: 'all 0.18s',
    boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
  }
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#0F0E1A' }}>{label}</label>
      {children}
    </div>
  )
}

function Spinner() {
  return <span className="auth-spinner" />
}