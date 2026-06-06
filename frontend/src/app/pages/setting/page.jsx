/* eslint-disable react-hooks/static-components */



'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../../store/authStore'
import apiClient from '../../../utils/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

/* ── Section wrapper ── */
function Section({ title, desc, children }) {
  return (
    <div style={{ borderBottom: '1.5px solid var(--stone)', paddingBottom: 36, marginBottom: 36 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{title}</h2>
        {desc && <p style={{ fontSize: 14, color: 'var(--fog)', lineHeight: 1.6 }}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

/* ── Field wrapper ── */
function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fog)' }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: 12, color: 'var(--fog)' }}>{hint}</span>}
    </div>
  )
}

/* ── Toggle switch ── */
function Toggle({ on, onChange, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--stone)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{label}</div>
        {desc && <div style={{ fontSize: 13, color: 'var(--fog)', marginTop: 2 }}>{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        style={{
          width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: on ? 'var(--ink)' : 'var(--stone)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
        aria-label={label}
      >
        <span style={{
          position: 'absolute', top: 3, left: on ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}

/* ── Danger button ── */
function DangerBtn({ children, onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '11px 22px', border: '1.5px solid #fca5a5', borderRadius: 8,
        background: 'transparent', color: '#dc2626', fontWeight: 700, fontSize: 14,
        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        transition: 'background 0.15s, border-color 0.15s', opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#dc2626' }}}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#fca5a5' }}
    >
      {children}
    </button>
  )
}

/* ── Input style ── */
const inputStyle = (focused) => ({
  padding: '12px 14px', border: `1.5px solid ${focused ? 'var(--ink)' : 'var(--stone)'}`,
  borderRadius: 8, fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)',
  background: 'var(--paper)', outline: 'none', width: '100%',
  boxShadow: focused ? '0 0 0 3px rgba(10,10,10,0.06)' : 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
})

const TABS = [
  { id: 'profile',       icon: '👤', label: 'Profile' },
  { id: 'security',      icon: '🔒', label: 'Security' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'preferences',   icon: '⚙️', label: 'Preferences' },
  { id: 'addresses',     icon: '📍', label: 'Addresses' },
  { id: 'danger',        icon: '⚠️', label: 'Account' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving,    setSaving]    = useState(false)
  const [focused,   setFocused]   = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const fileRef = useRef(null)

  /* ── Profile state ── */
  const [profile, setProfile] = useState({
    name:   user?.name   || '',
    email:  user?.email  || '',
    phone:  user?.phone  || '',
    bio:    user?.bio    || '',
    avatar: user?.avatar || '',
  })

  /* ── Password state ── */
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [showPwd, setShowPwd]     = useState({ current: false, next: false, confirm: false })

  /* ── Notification prefs ── */
  const [notifs, setNotifs] = useState({
    orderUpdates:   true,
    promotions:     false,
    newArrivals:    true,
    priceDrops:     true,
    sellerMessages: true,
    weeklyDigest:   false,
  })

  /* ── Preferences ── */
  const [prefs, setPrefs] = useState({
    currency:   'INR',
    language:   'en',
    theme:      'light',
    compactView:false,
    showPrices: true,
  })

  /* ── Addresses ── */
  const [addresses, setAddresses] = useState(user?.addresses || [])
  const [newAddr,   setNewAddr]   = useState({ label:'', street:'', city:'', state:'', zipCode:'', country:'India', isDefault:false })
  const [addingAddr,setAddingAddr]= useState(false)

  /* ── Danger zone ── */
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deactivating,  setDeactivating]  = useState(false)

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div className="serif" style={{ fontSize: 28, fontWeight: 900 }}>Please sign in</div>
        <Link href="/pages/auth/login" className="btn btn-ink">Sign In</Link>
      </div>
    )
  }

  /* ── Handlers ── */
  async function saveProfile() {
    setSaving(true)
    try {
      const { data } = await apiClient.patch('/users/profile', profile)
      setUser?.(data.data)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (passwords.next !== passwords.confirm) { toast.error('Passwords do not match'); return }
    if (passwords.next.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      await apiClient.patch('/users/password', { currentPassword: passwords.current, newPassword: passwords.next })
      toast.success('Password changed!')
      setPasswords({ current:'', next:'', confirm:'' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  async function saveNotifs() {
    setSaving(true)
    try {
      await apiClient.patch('/users/notifications', notifs)
      toast.success('Notification preferences saved!')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  async function savePrefs() {
    setSaving(true)
    try {
      await apiClient.patch('/users/preferences', prefs)
      toast.success('Preferences saved!')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  async function addAddress() {
    if (!newAddr.street || !newAddr.city || !newAddr.zipCode) { toast.error('Please fill required address fields'); return }
    setSaving(true)
    try {
      const { data } = await apiClient.post('/users/addresses', newAddr)
      setAddresses(prev => [...prev, data.data])
      setNewAddr({ label:'', street:'', city:'', state:'', zipCode:'', country:'India', isDefault:false })
      setAddingAddr(false)
      toast.success('Address added!')
    } catch {
      toast.error('Failed to add address')
    } finally {
      setSaving(false)
    }
  }

  async function removeAddress(id) {
    try {
      await apiClient.delete(`/users/addresses/${id}`)
      setAddresses(prev => prev.filter(a => a.id !== id))
      toast.success('Address removed')
    } catch {
      toast.error('Failed to remove address')
    }
  }

  async function handleDeactivate() {
    if (deleteConfirm !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
    setDeactivating(true)
    try {
      await apiClient.delete('/users/account')
      toast.success('Account deactivated')
      logout?.()
      router.push('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account')
    } finally {
      setDeactivating(false)
    }
  }

  function handleLogout() {
    logout?.()
    toast.success('Logged out')
    router.push('/')
  }

  /* ── Password strength ── */
  function pwdStrength(p) {
    if (!p) return null
    let score = 0
    if (p.length >= 8)  score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return ['Weak','Fair','Good','Strong'][score - 1] || 'Weak'
  }
  const strengthColor = { Weak:'#dc2626', Fair:'#f59e0b', Good:'#3b82f6', Strong:'#16a34a' }
  const strength = pwdStrength(passwords.next)

  const inp = (val, onChange, name, placeholder, type='text') => (
    <input
      type={type} value={val} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(name)}
      onBlur={() => setFocused('')}
      style={inputStyle(focused === name)}
    />
  )

  const SaveBtn = ({ onClick }) => (
    <button
      type="button" onClick={onClick} disabled={saving}
      style={{ padding:'12px 28px', background: saving ? 'var(--stone)' : 'var(--ink)', color: saving ? 'var(--fog)' : '#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, transition:'background 0.2s' }}>
      {saving ? <><span className="spinner-sm" />Saving…</> : 'Save Changes'}
    </button>
  )

  /* ── Tab content ── */
  const TAB_CONTENT = {

    /* ── PROFILE ── */
    profile: (
      <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
        <Section title="Profile Picture" desc="Update your profile photo.">
          <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', border:'2px solid var(--stone)', overflow:'hidden', background:'var(--mist)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>
              {profile.avatar
                ? <img src={profile.avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : (user.name?.[0] || '?').toUpperCase()
              }
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ padding:'9px 18px', border:'1.5px solid var(--stone)', borderRadius:8, background:'var(--paper)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', color:'var(--ink)', transition:'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='var(--ink)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--stone)'}>
                  Upload Photo
                </button>
                {profile.avatar && (
                  <button type="button" onClick={() => setProfile(p => ({ ...p, avatar:'' }))}
                    style={{ padding:'9px 18px', border:'1.5px solid #fca5a5', borderRadius:8, background:'transparent', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', color:'#dc2626' }}>
                    Remove
                  </button>
                )}
              </div>
              <Field label="Or paste image URL">
                <input style={{ ...inputStyle(focused==='avatar'), width:'100%' }}
                  value={profile.avatar} placeholder="https://example.com/avatar.jpg"
                  onChange={e => setProfile(p => ({ ...p, avatar:e.target.value }))}
                  onFocus={() => setFocused('avatar')} onBlur={() => setFocused('')} />
              </Field>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { const url = URL.createObjectURL(f); setProfile(p => ({ ...p, avatar: url })) }}} />
            </div>
          </div>
        </Section>

        <Section title="Personal Information" desc="Update your name, email, and contact details.">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }} className="settings-2col">
            <Field label="Full Name">
              {inp(profile.name, v => setProfile(p => ({ ...p, name:v })), 'name', 'Your name')}
            </Field>
            <Field label="Email Address" hint="Changing email may require re-verification.">
              {inp(profile.email, v => setProfile(p => ({ ...p, email:v })), 'email', 'you@example.com', 'email')}
            </Field>
            <Field label="Phone Number">
              {inp(profile.phone, v => setProfile(p => ({ ...p, phone:v })), 'phone', '+91 98765 43210', 'tel')}
            </Field>
            <Field label="Bio" hint="A short description about you.">
              <textarea
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio:e.target.value }))}
                placeholder="Tell us a bit about yourself…"
                rows={3}
                onFocus={() => setFocused('bio')} onBlur={() => setFocused('')}
                style={{ ...inputStyle(focused==='bio'), resize:'vertical', minHeight:80 }}
              />
            </Field>
          </div>
          <div style={{ marginTop:22 }}>
            <SaveBtn onClick={saveProfile} />
          </div>
        </Section>
      </div>
    ),

    /* ── SECURITY ── */
    security: (
      <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
        <Section title="Change Password" desc="Choose a strong password you haven't used before.">
          <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:480 }}>
            <Field label="Current Password">
              <div style={{ position:'relative' }}>
                <input
                  type={showPwd.current ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={e => setPasswords(p => ({ ...p, current:e.target.value }))}
                  placeholder="Enter current password"
                  onFocus={() => setFocused('cur')} onBlur={() => setFocused('')}
                  style={{ ...inputStyle(focused==='cur'), paddingRight:44 }}
                />
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, current:!p.current }))}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--fog)' }}>
                  {showPwd.current ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>
            <Field label="New Password">
              <div style={{ position:'relative' }}>
                <input
                  type={showPwd.next ? 'text' : 'password'}
                  value={passwords.next}
                  onChange={e => setPasswords(p => ({ ...p, next:e.target.value }))}
                  placeholder="Min. 8 characters"
                  onFocus={() => setFocused('nxt')} onBlur={() => setFocused('')}
                  style={{ ...inputStyle(focused==='nxt'), paddingRight:44 }}
                />
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, next:!p.next }))}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--fog)' }}>
                  {showPwd.next ? '🙈' : '👁️'}
                </button>
              </div>
              {strength && (
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6 }}>
                  <div style={{ flex:1, height:4, background:'var(--stone)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(['Weak','Fair','Good','Strong'].indexOf(strength)+1)*25}%`, background: strengthColor[strength], borderRadius:2, transition:'width 0.3s, background 0.3s' }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color: strengthColor[strength], flexShrink:0 }}>{strength}</span>
                </div>
              )}
            </Field>
            <Field label="Confirm New Password">
              <div style={{ position:'relative' }}>
                <input
                  type={showPwd.confirm ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm:e.target.value }))}
                  placeholder="Repeat new password"
                  onFocus={() => setFocused('cnf')} onBlur={() => setFocused('')}
                  style={{ ...inputStyle(focused==='cnf'), paddingRight:44, borderColor: passwords.confirm && passwords.next !== passwords.confirm ? '#dc2626' : focused==='cnf' ? 'var(--ink)' : 'var(--stone)' }}
                />
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, confirm:!p.confirm }))}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--fog)' }}>
                  {showPwd.confirm ? '🙈' : '👁️'}
                </button>
              </div>
              {passwords.confirm && passwords.next !== passwords.confirm && (
                <span style={{ fontSize:12, color:'#dc2626', fontWeight:600 }}>Passwords do not match</span>
              )}
            </Field>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <SaveBtn onClick={changePassword} />
            </div>
          </div>
        </Section>

        <Section title="Active Sessions" desc="Devices currently signed into your account.">
          {[
            { device:'Chrome · Windows 11', location:'Mumbai, India', time:'Active now',    current:true },
            { device:'Safari · iPhone 15',  location:'Mumbai, India', time:'2 hours ago',   current:false },
            { device:'Firefox · macOS',     location:'Delhi, India',  time:'3 days ago',    current:false },
          ].map(s => (
            <div key={s.device} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--stone)', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'var(--mist)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {s.device.includes('iPhone') ? '📱' : s.device.includes('Safari') ? '🍎' : '💻'}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
                    {s.device}
                    {s.current && <span style={{ fontSize:10, fontWeight:700, background:'#dcfce7', color:'#16a34a', padding:'2px 8px', borderRadius:999, textTransform:'uppercase', letterSpacing:'0.05em' }}>Current</span>}
                  </div>
                  <div style={{ fontSize:12, color:'var(--fog)', marginTop:2 }}>{s.location} · {s.time}</div>
                </div>
              </div>
              {!s.current && (
                <button type="button"
                  style={{ fontSize:12, fontWeight:700, color:'#dc2626', background:'none', border:'1px solid #fca5a5', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit' }}
                  onClick={() => toast.success('Session revoked')}>
                  Revoke
                </button>
              )}
            </div>
          ))}
          <button type="button" style={{ marginTop:16, fontSize:13, fontWeight:700, color:'#dc2626', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', padding:0 }}
            onClick={() => toast.success('All other sessions revoked')}>
            Revoke All Other Sessions
          </button>
        </Section>
      </div>
    ),

    /* ── NOTIFICATIONS ── */
    notifications: (
      <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
        <Section title="Email Notifications" desc="Choose what updates you receive by email.">
          <Toggle on={notifs.orderUpdates}   onChange={v => setNotifs(n => ({ ...n, orderUpdates:v }))}   label="Order Updates"    desc="Shipping, delivery, and order status changes" />
          <Toggle on={notifs.promotions}     onChange={v => setNotifs(n => ({ ...n, promotions:v }))}     label="Promotions"       desc="Deals, discounts, and special offers" />
          <Toggle on={notifs.newArrivals}    onChange={v => setNotifs(n => ({ ...n, newArrivals:v }))}    label="New Arrivals"     desc="When new products are listed in your interests" />
          <Toggle on={notifs.priceDrops}     onChange={v => setNotifs(n => ({ ...n, priceDrops:v }))}     label="Price Drops"      desc="When items in your wishlist go on sale" />
          <Toggle on={notifs.sellerMessages} onChange={v => setNotifs(n => ({ ...n, sellerMessages:v }))} label="Seller Messages"  desc="Direct messages from sellers" />
          <Toggle on={notifs.weeklyDigest}   onChange={v => setNotifs(n => ({ ...n, weeklyDigest:v }))}   label="Weekly Digest"    desc="A weekly summary of your activity" />
          <div style={{ marginTop:22 }}>
            <SaveBtn onClick={saveNotifs} />
          </div>
        </Section>
      </div>
    ),

    /* ── PREFERENCES ── */
    preferences: (
      <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
        <Section title="Display & Regional" desc="Customize how ShopSphere looks and works for you.">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:22 }} className="settings-2col">
            <Field label="Currency">
              <select value={prefs.currency} onChange={e => setPrefs(p => ({ ...p, currency:e.target.value }))}
                style={{ ...inputStyle(focused==='currency'), cursor:'pointer' }}
                onFocus={() => setFocused('currency')} onBlur={() => setFocused('')}>
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
                <option value="GBP">£ British Pound (GBP)</option>
              </select>
            </Field>
            <Field label="Language">
              <select value={prefs.language} onChange={e => setPrefs(p => ({ ...p, language:e.target.value }))}
                style={{ ...inputStyle(false), cursor:'pointer' }}>
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </Field>
          </div>
          <Toggle on={prefs.compactView} onChange={v => setPrefs(p => ({ ...p, compactView:v }))} label="Compact View"  desc="Show more products per row in listings" />
          <Toggle on={prefs.showPrices}  onChange={v => setPrefs(p => ({ ...p, showPrices:v }))}  label="Show Prices"   desc="Display prices on product thumbnails" />
          <div style={{ marginTop:22 }}>
            <SaveBtn onClick={savePrefs} />
          </div>
        </Section>
      </div>
    ),

    /* ── ADDRESSES ── */
    addresses: (
      <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
        <Section title="Saved Addresses" desc="Manage your delivery addresses for faster checkout.">
          {addresses.length === 0 && !addingAddr && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--fog)', fontSize:15 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📍</div>
              No saved addresses yet.
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom: addresses.length ? 20 : 0 }}>
            {addresses.map(addr => (
              <div key={addr.id} style={{ border:'1.5px solid var(--stone)', borderRadius:12, padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontWeight:700, fontSize:14 }}>{addr.label || 'Address'}</span>
                    {addr.isDefault && <span style={{ fontSize:10, fontWeight:700, background:'var(--mist)', color:'var(--fog)', padding:'2px 8px', borderRadius:999, textTransform:'uppercase', letterSpacing:'0.05em', border:'1px solid var(--stone)' }}>Default</span>}
                  </div>
                  <div style={{ fontSize:13, color:'var(--fog)', lineHeight:1.8 }}>
                    {addr.street}<br />{addr.city}, {addr.state} {addr.zipCode}<br />{addr.country}
                  </div>
                </div>
                <button type="button" onClick={() => removeAddress(addr.id)}
                  style={{ fontSize:12, fontWeight:700, color:'#dc2626', background:'none', border:'1px solid #fca5a5', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          {addingAddr ? (
            <div style={{ border:'1.5px solid var(--stone)', borderRadius:12, padding:'22px 20px' }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>New Address</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }} className="settings-2col">
                {[
                  ['label',   'Label (Home/Work…)', 'Label'],
                  ['street',  'Street Address *',    '123 MG Road, Apt 4B'],
                  ['city',    'City *',              'Mumbai'],
                  ['state',   'State',               'Maharashtra'],
                  ['zipCode', 'ZIP Code *',          '400001'],
                  ['country', 'Country',             'India'],
                ].map(([k, label, ph]) => (
                  <div key={k} style={{ display:'flex', flexDirection:'column', gap:6, gridColumn: k === 'street' || k === 'label' ? 'span 2' : 'span 1' }}>
                    <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--fog)' }}>{label}</label>
                    <input value={newAddr[k]} placeholder={ph}
                      onChange={e => setNewAddr(a => ({ ...a, [k]: e.target.value }))}
                      onFocus={() => setFocused('addr_'+k)} onBlur={() => setFocused('')}
                      style={inputStyle(focused==='addr_'+k)} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14 }}>
                <input type="checkbox" id="defaultAddr" checked={newAddr.isDefault} onChange={e => setNewAddr(a => ({ ...a, isDefault:e.target.checked }))} style={{ width:16, height:16, cursor:'pointer', accentColor:'var(--ink)' }} />
                <label htmlFor="defaultAddr" style={{ fontSize:14, fontWeight:500, cursor:'pointer' }}>Set as default address</label>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button type="button" onClick={addAddress} disabled={saving}
                  style={{ padding:'11px 22px', background:'var(--ink)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}>
                  {saving ? <><span className="spinner-sm" />Saving…</> : 'Save Address'}
                </button>
                <button type="button" onClick={() => setAddingAddr(false)}
                  style={{ padding:'11px 22px', background:'transparent', border:'1.5px solid var(--stone)', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit', color:'var(--ink)' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingAddr(true)}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', border:'1.5px dashed var(--stone)', borderRadius:10, background:'transparent', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit', color:'var(--fog)', transition:'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.color='var(--ink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--stone)'; e.currentTarget.style.color='var(--fog)' }}>
              + Add New Address
            </button>
          )}
        </Section>
      </div>
    ),

    /* ── DANGER ZONE ── */
   /*  danger: (
      <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
        <Section title="Sign Out" desc="Sign out of your account on this device.">
          <button type="button" onClick={handleLogout}
            style={{ padding:'12px 24px', border:'1.5px solid var(--stone)', borderRadius:8, background:'transparent', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', color:'var(--ink)', transition:'border-color 0.2s, background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.background='var(--mist)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--stone)'; e.currentTarget.style.background='transparent' }}>
            Sign Out of ShopSphere
          </button>
        </Section>

        <Section title="Export Your Data" desc="Download a copy of all your personal data, orders, and activity.">
          <DangerBtn onClick={() => { toast.success('Your data export has been requested. You'll receive an email shortly.') }}>
            Request Data Export
          </DangerBtn>
        </Section>

        <Section title="Deactivate Account" desc="Permanently deactivate your account. This action cannot be undone. All your orders, wishlist, and data will be deleted.">
          <div style={{ background:'#fff5f5', border:'1.5px solid #fca5a5', borderRadius:12, padding:'20px 22px' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#dc2626', marginBottom:6 }}>⚠️ This is irreversible</div>
            <p style={{ fontSize:13, color:'#7f1d1d', lineHeight:1.7, marginBottom:18 }}>
              Once you deactivate your account, all your data will be permanently removed. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              onFocus={() => setFocused('del')} onBlur={() => setFocused('')}
              style={{ ...inputStyle(focused==='del'), marginBottom:14, borderColor: deleteConfirm && deleteConfirm !== 'DELETE' ? '#dc2626' : focused==='del' ? 'var(--ink)' : 'var(--stone)' }}
            />
            <DangerBtn onClick={handleDeactivate} loading={deactivating}>
              {deactivating ? 'Deactivating…' : 'Deactivate My Account'}
            </DangerBtn>
          </div>
        </Section>
      </div>
    ), */
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)' }}>

      {/* Top bar */}
      <div className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Link href="/" className="back-link">← Home</Link>
          <div style={{ width:1, height:18, background:'var(--stone)' }} />
          <span style={{ fontSize:13, fontWeight:600, color:'var(--fog)' }}>Settings</span>
        </div>
        {/* Mobile nav toggle */}
        <button className="settings-mobile-toggle" onClick={() => setMobileNav(v => !v)}
          style={{ display:'none', background:'none', border:'1.5px solid var(--stone)', borderRadius:8, padding:'8px 14px', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', color:'var(--ink)' }}>
          ☰ Menu
        </button>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(32px,5vw,56px) 24px' }}>
        {/* Page title */}
        <div className="fade-up" style={{ marginBottom:36 }}>
          <div className="divider" style={{ marginBottom:14 }} />
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div>
              <h1 className="serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1 }}>
                Settings
              </h1>
              <p style={{ color:'var(--fog)', fontSize:15, marginTop:6 }}>
                Manage your account, security, and preferences
              </p>
            </div>
            {/* Avatar */}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', border:'2px solid var(--stone)', overflow:'hidden', background:'var(--mist)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700 }}>
                {profile.avatar
                  ? <img src={profile.avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : (user.name?.[0] || '?').toUpperCase()
                }
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{user.name}</div>
                <div style={{ fontSize:12, color:'var(--fog)' }}>{user.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileNav && (
          <div style={{ background:'var(--mist)', border:'1.5px solid var(--stone)', borderRadius:14, padding:16, marginBottom:24, display:'flex', flexDirection:'column', gap:4 }}>
            {TABS.map(t => (
              <button key={t.id} type="button" onClick={() => { setActiveTab(t.id); setMobileNav(false) }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight: activeTab===t.id ? 700 : 500, background: activeTab===t.id ? 'var(--ink)' : 'transparent', color: activeTab===t.id ? '#fff' : 'var(--ink)', textAlign:'left' }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:32, alignItems:'start' }} className="settings-layout">

          {/* ── Sidebar nav ── */}
          <nav style={{ position:'sticky', top:88, background:'var(--mist)', borderRadius:16, padding:12, border:'1.5px solid var(--stone)' }} className="settings-nav">
            {TABS.map(t => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 14px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:14, marginBottom:2, fontWeight: activeTab===t.id ? 700 : 500, background: activeTab===t.id ? 'var(--ink)' : 'transparent', color: activeTab===t.id ? '#fff' : t.id==='danger' ? '#dc2626' : 'var(--ink)', textAlign:'left', transition:'background 0.15s, color 0.15s' }}>
                <span style={{ fontSize:16 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>

          {/* ── Content ── */}
          <div className="fade-up" style={{ minWidth:0 }}>
            {TAB_CONTENT[activeTab]}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .settings-layout { grid-template-columns: 1fr !important; }
          .settings-nav    { display: none !important; position: static !important; }
          .settings-mobile-toggle { display: block !important; }
        }
        @media (max-width: 560px) {
          .settings-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}