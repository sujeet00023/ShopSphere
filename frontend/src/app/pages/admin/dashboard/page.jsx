/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../../../../store/authStore'
import apiClient from '../../../../utils/api'
import toast from 'react-hot-toast'

/* ─── Color constants ─────────────────────────────────── */
const STATUS_STYLES = {
  PENDING:    { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', dot: '#fbbf24'  },
  CONFIRMED:  { bg: 'rgba(108,99,255,0.12)',  color: '#6c63ff', dot: '#6c63ff'  },
  PROCESSING: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', dot: '#a78bfa'  },
  SHIPPED:    { bg: 'rgba(34,211,238,0.12)',  color: '#22d3ee', dot: '#22d3ee'  },
  DELIVERED:  { bg: 'rgba(0,212,170,0.12)',   color: '#00d4aa', dot: '#00d4aa'  },
  CANCELLED:  { bg: 'rgba(255,107,107,0.12)', color: '#ff6b6b', dot: '#ff6b6b'  },
}

const ROLE_STYLES = {
  ADMIN:  { bg: 'rgba(108,99,255,0.12)', color: '#6c63ff' },
  SELLER: { bg: 'rgba(0,212,170,0.12)',  color: '#00d4aa' },
  USER:   { bg: 'rgba(156,163,175,0.12)',color: '#9ca3af' },
}

/* ─── Design tokens ───────────────────────────────────── */
const T = {
  bg:       '#0f1117',
  surface:  '#181a23',
  surface2: '#1e2130',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.13)',
  accent:   '#6c63ff',
  accent2:  '#00d4aa',
  accent3:  '#ff6b6b',
  accent4:  '#fbbf24',
  text:     '#f0f1f8',
  textSec:  '#9ca3af',
  textMuted:'#6b7280',
}

/* ─── Inline style helpers ────────────────────────────── */
const card = {
  background: T.surface,
  border: `0.5px solid ${T.border}`,
  borderRadius: 14,
  padding: '20px',
}

/* ══════════════════════════════════════════════════════════
   GLOBAL STYLES (injected once)
══════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .adm-root *, .adm-root *::before, .adm-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }
  .adm-root {
    font-family: 'DM Sans', sans-serif;
    background: ${T.bg};
    color: ${T.text};
    min-height: 100vh;
    padding-bottom: 48px;
  }
  .adm-mono { font-family: 'DM Mono', monospace; }

  /* ── Scrollbar ── */
  .adm-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .adm-root ::-webkit-scrollbar-track { background: transparent; }
  .adm-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  /* ── Stat card ── */
  .adm-stat-card {
    background: ${T.surface};
    border: 0.5px solid ${T.border};
    border-radius: 14px;
    padding: 18px 20px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
    cursor: default;
  }
  .adm-stat-card:hover { border-color: ${T.border2}; }

  /* ── Tab button ── */
  .adm-tab {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    border: 0.5px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
    color: ${T.textMuted};
    background: transparent;
    white-space: nowrap;
  }
  .adm-tab:hover { color: ${T.text}; background: ${T.surface}; }
  .adm-tab.active {
    color: ${T.accent};
    background: rgba(108,99,255,0.12);
    border-color: rgba(108,99,255,0.25);
  }

  /* ── Table ── */
  .adm-table { width: 100%; border-collapse: collapse; }
  .adm-table th {
    font-size: 10px; font-weight: 600; color: ${T.textMuted};
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 0 16px 12px 0; text-align: left;
    border-bottom: 0.5px solid ${T.border};
    white-space: nowrap;
  }
  .adm-table td {
    padding: 12px 16px 12px 0;
    font-size: 13px; color: ${T.textSec};
    border-bottom: 0.5px solid rgba(255,255,255,0.04);
    vertical-align: middle;
  }
  .adm-table tr:last-child td { border-bottom: none; }
  .adm-table tr:hover td { color: ${T.text}; }

  /* ── Product row ── */
  .adm-product-row {
    display: flex; align-items: center;
    padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
    border: 0.5px solid transparent;
    transition: all 0.15s; cursor: default;
  }
  .adm-product-row:hover { background: ${T.surface2}; border-color: ${T.border}; }

  /* ── Bar chart ── */
  .adm-bar {
    width: 100%; border-radius: 4px 4px 0 0;
    background: rgba(108,99,255,0.2);
    border-top: 2px solid ${T.accent};
    transition: background 0.2s;
    cursor: pointer;
    min-height: 4px;
  }
  .adm-bar:hover { background: rgba(108,99,255,0.38); }

  /* ── Responsive grid ── */
  .adm-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .adm-overview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  /* ── Mobile ── */
  @media (max-width: 900px) {
    .adm-stats-grid { grid-template-columns: repeat(2, 1fr); }
    .adm-overview-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 520px) {
    .adm-stats-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .adm-stat-card { padding: 14px 14px; }
    .adm-table th, .adm-table td { padding-right: 10px; font-size: 12px; }
  }
  @media (max-width: 400px) {
    .adm-stats-grid { grid-template-columns: 1fr; }
  }

  /* ── Large screen ── */
  @media (min-width: 1400px) {
    .adm-stats-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
  }

  /* ── Sidebar layout for large screens ── */
  @media (min-width: 1200px) {
    .adm-overview-grid { grid-template-columns: 1.2fr 0.8fr; }
  }

  /* ── Table scroll wrapper ── */
  .adm-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* ── Donut wrap ── */
  .adm-donut-wrap {
    display: flex; align-items: center; gap: 20px;
    flex-wrap: wrap;
  }
  @media (max-width: 520px) {
    .adm-donut-wrap { flex-direction: column; align-items: flex-start; }
    .adm-donut-wrap canvas { align-self: center; }
  }

  /* ── Tabs scroll ── */
  .adm-tabs-wrap {
    display: flex; gap: 4px;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .adm-tabs-wrap::-webkit-scrollbar { display: none; }

  /* ── Hide on mobile ── */
  @media (max-width: 640px) {
    .adm-hide-mobile { display: none !important; }
  }

  /* ── Status pill ── */
  .adm-status {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 500; padding: 3px 9px;
    border-radius: 20px; white-space: nowrap;
  }
  .adm-status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  /* ── Role pill ── */
  .adm-role-pill {
    font-size: 11px; font-weight: 500;
    padding: 3px 9px; border-radius: 20px; white-space: nowrap;
  }

  /* ── Legend ── */
  .adm-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 130px; }
  .adm-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
  .adm-legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
`

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById('adm-styles')) return
    const el = document.createElement('style')
    el.id = 'adm-styles'
    el.textContent = CSS
    document.head.appendChild(el)
    return () => el.remove()
  }, [])
  return null
}

/* ══════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════ */
function StatCard({ title, value, icon, accentColor, change }) {
  return (
    <div className="adm-stat-card">
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 56, height: 56, borderRadius: '0 14px 0 56px',
        background: accentColor, opacity: 0.13,
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: T.text, marginTop: 8, letterSpacing: -1, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
        {value}
      </div>
      {change && (
        <div style={{ fontSize: 11, marginTop: 6, color: T.accent2, display: 'flex', alignItems: 'center', gap: 4 }}>
          ↑ {change}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   BAR CHART
══════════════════════════════════════════════════════════ */
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.revenue))
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 180 }}>
      {data.map((d, i) => {
        const pct = Math.max(4, Math.round((d.revenue / max) * 100))
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <div
                className="adm-bar"
                style={{ height: `${pct}%` }}
                title={`${d.month || months[i]}: $${d.revenue?.toLocaleString()}`}
              />
            </div>
            <div style={{ fontSize: 9, color: T.textMuted, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
              {d.month || months[i]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   DONUT CHART
══════════════════════════════════════════════════════════ */
function DonutChart({ orders }) {
  const canvasRef = useRef(null)

  const statusData = [
    { label: 'Delivered',  color: '#00d4aa' },
    { label: 'Shipped',    color: '#22d3ee' },
    { label: 'Processing', color: '#a78bfa' },
    { label: 'Pending',    color: '#fbbf24' },
    { label: 'Confirmed',  color: '#6c63ff' },
    { label: 'Cancelled',  color: '#ff6b6b' },
  ]

  const counts = {}
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1 })
  const total = orders.length || 1

  const chartData = statusData.map(s => ({
    ...s, val: counts[s.label.toUpperCase()] || 0
  })).filter(s => s.val > 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 130, 130)
    let start = -Math.PI / 2
    chartData.forEach(s => {
      const angle = (s.val / total) * Math.PI * 2
      ctx.beginPath(); ctx.moveTo(65, 65)
      ctx.arc(65, 65, 55, start, start + angle)
      ctx.fillStyle = s.color; ctx.fill()
      start += angle
    })
    ctx.beginPath(); ctx.arc(65, 65, 32, 0, Math.PI * 2)
    ctx.fillStyle = T.surface; ctx.fill()
    // center label
    ctx.fillStyle = T.text
    ctx.font = "600 16px 'DM Mono', monospace"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(total, 65, 65)
  }, [orders])

  return (
    <div className="adm-donut-wrap">
      <canvas ref={canvasRef} width={130} height={130} style={{ flexShrink: 0 }} />
      <div className="adm-legend">
        {chartData.map((s, i) => (
          <div key={i} className="adm-legend-item">
            <div className="adm-legend-dot" style={{ background: s.color }} />
            <span style={{ color: T.textSec, flex: 1 }}>{s.label}</span>
            <span style={{ color: T.text, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
              {Math.round((s.val / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   STATUS / ROLE PILLS
══════════════════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: 'rgba(156,163,175,0.1)', color: '#9ca3af', dot: '#9ca3af' }
  return (
    <span className="adm-status" style={{ background: s.bg, color: s.color }}>
      <span className="adm-status-dot" style={{ background: s.dot }} />
      {status}
    </span>
  )
}

function RoleBadge({ role }) {
  const r = ROLE_STYLES[role] || ROLE_STYLES.USER
  return (
    <span className="adm-role-pill" style={{ background: r.bg, color: r.color }}>
      {role}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════════════════ */
function OverviewTab({ dashboard }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="adm-overview-grid">
        {/* Revenue Chart */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Monthly Revenue
          </div>
          <BarChart data={dashboard.revenueByMonth} />
        </div>

        {/* Donut */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Order Status
          </div>
          <DonutChart orders={dashboard.recentOrders} />
        </div>
      </div>

      {/* Top Products */}
      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
          Top 5 Products
        </div>
        {dashboard.topProducts.map((product, idx) => (
          <div key={product.id} className="adm-product-row">
            <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: T.textMuted, width: 20, flexShrink: 0 }}>
              {idx + 1}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: T.text, flex: 1, margin: '0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.name}
            </span>
            <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0 }}>${product.price}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: T.accent2, fontFamily: "'DM Mono', monospace", marginLeft: 16, flexShrink: 0 }}>
              {product.sold} sold
            </span>
            <span style={{ fontSize: 12, color: T.accent4, marginLeft: 12, flexShrink: 0 }}>
              {product.rating}★
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ORDERS TAB
══════════════════════════════════════════════════════════ */
function OrdersTab({ orders }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
        Recent Orders
      </div>
      <div className="adm-table-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th className="adm-hide-mobile">Amount</th>
              <th className="adm-hide-mobile">Items</th>
              <th>Status</th>
              <th className="adm-hide-mobile">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.accent, fontWeight: 500 }}>
                    {order.orderNumber}
                  </span>
                </td>
                <td style={{ color: T.text, fontWeight: 500 }}>{order.customer.name}</td>
                <td className="adm-hide-mobile">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                    ${order.total?.toFixed(2)}
                  </span>
                </td>
                <td className="adm-hide-mobile">{order.items.length} items</td>
                <td><StatusBadge status={order.status} /></td>
                <td className="adm-hide-mobile" style={{ fontSize: 12 }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SELLERS TAB
══════════════════════════════════════════════════════════ */
function SellersTab() {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/admin/seller')
      .then(({ data }) => setSellers(data.data))
      .catch(() => toast.error('Failed to load sellers'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingRow label="sellers" />

  return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
        All Sellers
      </div>
      <div className="adm-table-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Store</th>
              <th>Owner</th>
              <th className="adm-hide-mobile">Products</th>
              <th>Revenue</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map(seller => (
              <tr key={seller.id}>
                <td style={{ color: T.text, fontWeight: 500 }}>{seller.storeName}</td>
                <td>{seller.user.name}</td>
                <td className="adm-hide-mobile" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {seller._count.products}
                </td>
                <td style={{ color: T.accent2, fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500 }}>
                  ${seller.totalEarnings.toFixed(2)}
                </td>
                <td style={{ color: T.accent4, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
                  {seller.rating.toFixed(1)}★
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   USERS TAB
══════════════════════════════════════════════════════════ */
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/admin/users')
      .then(({ data }) => setUsers(data.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingRow label="users" />

  return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
        All Users
      </div>
      <div className="adm-table-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th className="adm-hide-mobile">Email</th>
              <th>Role</th>
              <th>Orders</th>
              <th className="adm-hide-mobile">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ color: T.text, fontWeight: 500 }}>{user.name}</td>
                <td className="adm-hide-mobile" style={{ fontSize: 12 }}>{user.email}</td>
                <td><RoleBadge role={user.role} /></td>
                <td style={{ fontFamily: "'DM Mono', monospace" }}>{user._count.orders}</td>
                <td className="adm-hide-mobile" style={{ fontSize: 12 }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   LOADING / EMPTY STATES
══════════════════════════════════════════════════════════ */
function LoadingRow({ label }) {
  return (
    <div style={{ ...card, textAlign: 'center', padding: '40px 20px', color: T.textMuted, fontSize: 13 }}>
      <div style={{
        width: 32, height: 32,
        border: `2px solid ${T.accent}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'adm-spin 0.8s linear infinite',
        margin: '0 auto 12px',
      }} />
      Loading {label}...
      <style>{`@keyframes adm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function FullPageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: T.bg, flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40,
        border: `2px solid ${T.accent}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'adm-spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
        Loading dashboard...
      </span>
      <style>{`@keyframes adm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
export default function AdminDashBoard() {
  const { user } = useAuthStore()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { fetchDashboard() }, [])

  async function fetchDashboard() {
    try {
      const { data } = await apiClient.get('/admin/dashboard')
      setDashboard(data.data)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <><InjectStyles /><FullPageLoader /></>
  if (!dashboard) return (
    <div style={{ padding: 40, textAlign: 'center', color: T.accent3, fontFamily: "'DM Sans', sans-serif" }}>
      Failed to load dashboard
    </div>
  )

  const TABS = ['overview', 'orders', 'sellers', 'users']

  return (
    <div className="adm-root">
      <InjectStyles />

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 0',
        maxWidth: 1600, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: T.accent,
            boxShadow: `0 0 0 3px rgba(108,99,255,0.2)`,
          }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Admin Console
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '4px 10px',
            borderRadius: 20, background: 'rgba(108,99,255,0.15)',
            color: T.accent, border: `0.5px solid rgba(108,99,255,0.3)`,
            letterSpacing: '0.04em',
          }}>
            ● Live
          </span>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
        </div>
      </div>

      {/* ── Title ── */}
      <div style={{ padding: '20px 24px 0', maxWidth: 1600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.text, letterSpacing: -0.5 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
          Platform overview &amp; management
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ padding: '20px 24px 0', maxWidth: 1600, margin: '0 auto' }}>
        <div className="adm-stats-grid">
          <StatCard
            title="Total Users"
            value={dashboard.status.totalUsers.toLocaleString()}
            accentColor={T.accent}
            change="+12.4% this month"
          />
          <StatCard
            title="Total Sellers"
            value={dashboard.status.totalSellers.toLocaleString()}
            accentColor={T.accent2}
            change="+8.1% this month"
          />
          <StatCard
            title="Total Orders"
            value={dashboard.status.totalOrders.toLocaleString()}
            accentColor={T.accent4}
            change="+22.7% this month"
          />
          <StatCard
            title="Total Revenue"
            value={`$${dashboard.status.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            accentColor={T.accent3}
            change="+18.3% this month"
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ padding: '20px 24px 0', maxWidth: 1600, margin: '0 auto' }}>
        <div className="adm-tabs-wrap">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`adm-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: '16px 24px 0', maxWidth: 1600, margin: '0 auto' }}>
        {activeTab === 'overview' && <OverviewTab dashboard={dashboard} />}
        {activeTab === 'orders'   && <OrdersTab orders={dashboard.recentOrders} />}
        {activeTab === 'sellers'  && <SellersTab />}
        {activeTab === 'users'    && <UsersTab />}
      </div>
    </div>
  )
}