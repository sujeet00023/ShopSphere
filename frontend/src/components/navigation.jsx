/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../store/authStore'
import { useRouter, usePathname } from 'next/navigation'
import apiClient from '../utils/api'

const T = {
  bg:        '#FFFFFF',
  surface:   '#F7F7FB',
  border:    '#E8E7F2',
  ink:       '#0F0E1A',
  muted:     '#6B6880',
  faint:     '#A09DB8',
  violet:    '#7C3AED',
  violetSoft:'#EDE9FE',
  violetMid: '#C4B5FD',
  red:       '#DC2626',
  redSoft:   '#FEE2E2',
}

const NAV_LINKS = [
  { href: '/pages/products', label: 'Products' },
  { href: '/pages/about',    label: 'About'    },
  { href: '/pages/contact',  label: 'Contact'  },
]

export default function Navigation() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const [cartCount,      setCartCount]      = useState(0)
  const [mobileOpen,     setMobileOpen]     = useState(false)
  const [dropdownOpen,   setDropdownOpen]   = useState(false)
  const [scrolled,       setScrolled]       = useState(false)
  const dropdownRef = useRef(null)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setDropdownOpen(false) }, [pathname])

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cart count
  useEffect(() => {
    if (user) fetchCartCount()
    const refresh = () => fetchCartCount()
    window.addEventListener('cartUpdated', refresh)
    return () => window.removeEventListener('cartUpdated', refresh)
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchCartCount() {
    try {
      const { data } = await apiClient.get('/cart')
      setCartCount(data.itemCount || 0)
    } catch { /* silent */ }
  }

  function handleLogout() {
    logout()
    setDropdownOpen(false)
    setMobileOpen(false)
    router.push('/pages/auth/login')
  }

  const isActive = href => pathname === href || pathname?.startsWith(href + '/')

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: T.bg,
        borderBottom: `1.5px solid ${scrolled ? T.border : 'transparent'}`,
        boxShadow: scrolled ? '0 2px 20px rgba(124,58,237,0.07)' : 'none',
        transition: 'box-shadow 0.25s, border-color 0.25s',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* ── LOGO ── */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${T.violet}, #5B21B6)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: `0 4px 12px rgba(124,58,237,0.3)` }}>
              🛍️
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: T.ink, letterSpacing: '-0.03em' }}>
              Shop<span style={{ color: T.violet }}>Sphere</span>
            </span>
          </Link>

          {/* ── DESKTOP NAV LINKS ── */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} style={{
                padding: '7px 14px', borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: isActive(href) ? 700 : 500,
                color: isActive(href) ? T.violet : T.muted,
                background: isActive(href) ? T.violetSoft : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive(href)) { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.ink } }}
              onMouseLeave={e => { if (!isActive(href)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.muted } }}>
                {label}
              </Link>
            ))}
          </div>

          {/* ── RIGHT SIDE ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Cart */}
            <Link href="/pages/cart" style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.surface, color: T.muted, textDecoration: 'none', transition: 'all 0.15s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.violetMid; e.currentTarget.style.color = T.violet; e.currentTarget.style.background = T.violetSoft }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; e.currentTarget.style.background = T.surface }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: T.violet, color: '#fff', fontSize: 10, fontWeight: 800, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, border: `2px solid ${T.bg}` }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* User area */}
            {user ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button onClick={() => setDropdownOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 6px', border: `1.5px solid ${dropdownOpen ? T.violetMid : T.border}`, borderRadius: 12, background: dropdownOpen ? T.violetSoft : T.surface, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!dropdownOpen) { e.currentTarget.style.borderColor = T.violetMid; e.currentTarget.style.background = T.violetSoft } }}
                  onMouseLeave={e => { if (!dropdownOpen) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface } }}>
                  <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7C3AED&color=fff`}
                    alt={user.name} style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
                  <span className="nav-username" style={{ fontSize: 13, fontWeight: 600, color: T.ink, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                  <svg width="14" height="14" fill="none" stroke={T.faint} viewBox="0 0 24 24" style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 14, boxShadow: '0 8px 32px rgba(124,58,237,0.12)', overflow: 'hidden', zIndex: 60 }}>
                    {/* User info */}
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 2 }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: T.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                      <span style={{ marginTop: 6, display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 8px', borderRadius: 999, background: T.violetSoft, color: T.violet, border: `1px solid ${T.violetMid}` }}>
                        {user.role}
                      </span>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '6px 0' }}>
                      {user.role === 'SELLER' && (
                        <DropdownLink href="/pages/seller/dashboard" icon="🏪" label="Seller Dashboard" onClick={() => setDropdownOpen(false)} />
                      )}
                      {user.role === 'CUSTOMER' && (
                        <DropdownLink href="/pages/user/dashboard" icon="👤" label="My Dashboard" onClick={() => setDropdownOpen(false)} />
                      )}
                      {user.role === 'ADMIN' && (
                        <DropdownLink href="/pages/admin/dashboard" icon="⚙️" label="Admin Dashboard" onClick={() => setDropdownOpen(false)} />
                      )}
                      <DropdownLink href="/pages/orders" icon="📦" label="My Orders" onClick={() => setDropdownOpen(false)} />
                      <DropdownLink href="/pages/setting" icon="🔧" label="Settings" onClick={() => setDropdownOpen(false)} />
                    </div>

                    {/* Logout */}
                    <div style={{ borderTop: `1px solid ${T.border}`, padding: '6px 0' }}>
                      <button onClick={handleLogout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: T.red, textAlign: 'left', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = T.redSoft}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ fontSize: 15 }}>🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/pages/auth/login" className="nav-signin"
                  style={{ padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: T.violet, background: T.violetSoft, border: `1.5px solid ${T.violetMid}`, textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.violet; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.violetSoft; e.currentTarget.style.color = T.violet }}>
                  Sign In
                </Link>
                <Link href="/pages/auth/register"
                  style={{ padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${T.violet}, #5B21B6)`, textDecoration: 'none', boxShadow: '0 2px 10px rgba(124,58,237,0.25)', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(v => !v)} className="hamburger"
              style={{ width: 40, height: 40, display: 'none', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${T.border}`, borderRadius: 10, background: mobileOpen ? T.violetSoft : T.surface, cursor: 'pointer', color: mobileOpen ? T.violet : T.muted, flexShrink: 0, transition: 'all 0.15s' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        {mobileOpen && (
          <div style={{ borderTop: `1.5px solid ${T.border}`, background: T.bg, padding: '12px 16px 16px' }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}
                style={{ display: 'block', padding: '10px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: isActive(href) ? 700 : 500, color: isActive(href) ? T.violet : T.muted, background: isActive(href) ? T.violetSoft : 'transparent', marginBottom: 2 }}>
                {label}
              </Link>
            ))}
            {!user && (
              <Link href="/pages/auth/login"
                style={{ display: 'block', padding: '10px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, color: T.violet, background: T.violetSoft, marginTop: 8 }}>
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  )
}

function DropdownLink({ href, icon, label, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <Link href={href} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', fontSize: 13, fontWeight: 500, color: hov ? '#0F0E1A' : '#6B6880', background: hov ? '#F7F7FB' : 'transparent', textDecoration: 'none', transition: 'all 0.15s' }}>
      <span style={{ fontSize: 15 }}>{icon}</span> {label}
    </Link>
  )
}