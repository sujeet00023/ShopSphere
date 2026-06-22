'use client'
/* eslint-disable react-hooks/immutability */
import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../../../../store/authStore'
import apiClient from '../../../../utils/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

/* ── helpers ── */
const fmtINR = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtNum = n => Number(n || 0).toLocaleString('en-IN')
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })

/* ── Status / Role maps ── */
const STATUS_MAP = {
  PENDING:    { bg:'#fef5e7', color:'#c07a00', dot:'#c07a00' },
  CONFIRMED:  { bg:'#f0f4ff', color:'#5070d0', dot:'#5070d0' },
  PROCESSING: { bg:'#fff3e0', color:'#e06c00', dot:'#e06c00' },
  SHIPPED:    { bg:'#e8f0fe', color:'#1a6cff', dot:'#1a6cff' },
  DELIVERED:  { bg:'#edf7ed', color:'#2d7a2d', dot:'#2d7a2d' },
  CANCELLED:  { bg:'#fde8e8', color:'#c02020', dot:'#c02020' },
}
const ROLE_MAP = {
  ADMIN:  { bg:'rgba(108,99,255,0.1)', color:'#6c63ff' },
  SELLER: { bg:'rgba(45,122,45,0.1)',  color:'#2d7a2d' },
  USER:   { bg:'var(--mist)',          color:'var(--fog)' },
}

/* ── StatusBadge ── */
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { bg:'var(--mist)', color:'var(--fog)', dot:'var(--fog)' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:s.bg, color:s.color, textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
      {status}
    </span>
  )
}

/* ── RoleBadge ── */
function RoleBadge({ role }) {
  const r = ROLE_MAP[role] || ROLE_MAP.USER
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:r.bg, color:r.color, textTransform:'uppercase', letterSpacing:'0.04em' }}>
      {role}
    </span>
  )
}

/* ── ActiveBadge ── */
function ActiveBadge({ active }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background: active === false ? '#fde8e8' : '#edf7ed', color: active === false ? '#c02020' : '#2d7a2d', textTransform:'uppercase', letterSpacing:'0.04em' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background: active === false ? '#c02020' : '#2d7a2d', flexShrink:0 }} />
      {active === false ? 'Inactive' : 'Active'}
    </span>
  )
}

/* ── StatCard ── */
function StatCard({ title, value, icon, change, accent }) {
  return (
    <div style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'22px 24px', position:'relative', overflow:'hidden', transition:'border-color 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.07)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--stone)'; e.currentTarget.style.boxShadow='none' }}>
      {/* accent blob */}
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:accent, opacity:0.08, pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--fog)' }}>{title}</div>
        <div style={{ width:36, height:36, borderRadius:10, background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, opacity:0.9 }}>{icon}</div>
      </div>
      <div className="serif" style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.03em', color:'var(--ink)', lineHeight:1 }}>{value}</div>
      {change && (
        <div style={{ fontSize:12, color:'#2d7a2d', fontWeight:600, marginTop:8, display:'flex', alignItems:'center', gap:4 }}>
          ↑ {change}
        </div>
      )}
    </div>
  )
}

/* ── BarChart ── */
function BarChart({ data = [] }) {
  if (!data.length) return <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--fog)', fontSize:14 }}>No data</div>
  const max = Math.max(...data.map(d => d.revenue || 0), 1)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:180 }}>
      {data.map((d, i) => {
        const pct = Math.max(4, Math.round(((d.revenue||0) / max) * 100))
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%' }}
            title={`${d.month || months[i]}: ${fmtINR(d.revenue)}`}>
            <div style={{ flex:1, display:'flex', alignItems:'flex-end', width:'100%' }}>
              <div style={{ width:'100%', height:`${pct}%`, borderRadius:'4px 4px 0 0', background:'var(--mist)', borderTop:'2px solid var(--ink)', minHeight:4, transition:'background 0.2s', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--stone)'}
                onMouseLeave={e => e.currentTarget.style.background='var(--mist)'} />
            </div>
            <div style={{ fontSize:9, color:'var(--fog)', fontFamily:'DM Mono, monospace', whiteSpace:'nowrap' }}>
              {d.month || months[i]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── DonutChart ── */
function DonutChart({ orders = [] }) {
  const canvasRef = useRef(null)
  const STATUS_COLORS = [
    { label:'Delivered',  color:'#2d7a2d' },
    { label:'Shipped',    color:'#1a6cff' },
    { label:'Processing', color:'#e06c00' },
    { label:'Pending',    color:'#c07a00' },
    { label:'Confirmed',  color:'#5070d0' },
    { label:'Cancelled',  color:'#c02020' },
  ]
  const counts = {}
  orders.forEach(o => { counts[o.status] = (counts[o.status]||0) + 1 })
  const total = orders.length || 1
  const chartData = STATUS_COLORS.map(s => ({ ...s, val: counts[s.label.toUpperCase()]||0 })).filter(s => s.val > 0)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 130, 130)
    let start = -Math.PI / 2
    chartData.forEach(s => {
      const angle = (s.val / total) * Math.PI * 2
      ctx.beginPath(); ctx.moveTo(65,65)
      ctx.arc(65,65,55,start,start+angle)
      ctx.fillStyle = s.color; ctx.fill()
      start += angle
    })
    // hole
    ctx.beginPath(); ctx.arc(65,65,33,0,Math.PI*2)
    ctx.fillStyle = '#ffffff'; ctx.fill()
    // center text
    ctx.fillStyle = '#0a0a0a'
    ctx.font = "700 15px 'DM Mono', monospace"
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(total, 65, 65)
  }, [orders])

  return (
    <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
      <canvas ref={canvasRef} width={130} height={130} style={{ flexShrink:0 }} />
      <div style={{ display:'flex', flexDirection:'column', gap:7, flex:1, minWidth:130 }}>
        {chartData.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color, flexShrink:0 }} />
            <span style={{ color:'var(--fog)', flex:1 }}>{s.label}</span>
            <span style={{ color:'var(--ink)', fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:600 }}>
              {Math.round((s.val/total)*100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Loading spinner ── */
function Spinner({ label='Loading…' }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 0' }}>
      <div className="spinner" style={{ margin:'0 auto 14px' }} />
      <p style={{ color:'var(--fog)', fontSize:14 }}>{label}</p>
    </div>
  )
}

/* ── Shared table wrapper ── */
function TableWrap({ children }) {
  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        {children}
      </table>
    </div>
  )
}
const TH = ({ children, hide }) => (
  <th style={{ fontSize:10, fontWeight:700, color:'var(--fog)', textTransform:'uppercase', letterSpacing:'0.08em', padding:'0 14px 12px 0', textAlign:'left', borderBottom:'1.5px solid var(--stone)', whiteSpace:'nowrap' }}
    className={hide ? 'adm-hide-mobile' : ''}>
    {children}
  </th>
)
const TD = ({ children, hide, mono, bold }) => (
  <td style={{ padding:'13px 14px 13px 0', fontSize:13, color: bold ? 'var(--ink)' : 'var(--fog)', borderBottom:'1px solid var(--mist)', verticalAlign:'middle', fontFamily: mono ? 'DM Mono, monospace' : 'inherit', fontWeight: bold ? 600 : 400 }}
    className={hide ? 'adm-hide-mobile' : ''}>
    {children}
  </td>
)
const EmptyRow = ({ colSpan, label }) => (
  <tr>
    <td colSpan={colSpan} style={{ padding:'32px 0', textAlign:'center', color:'var(--fog)', fontSize:13 }}>
      {label}
    </td>
  </tr>
)

/* ── Modal ── */
function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,10,10,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, zIndex:1000 }}
      onClick={onClose}>
      <div style={{ background:'var(--paper)', borderRadius:16, padding:'28px', width:'100%', maxWidth:width, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.28)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h3 className="serif" style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.02em' }}>{title}</h3>
          <button onClick={onClose}
            style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--fog)', lineHeight:1, padding:4 }}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── ConfirmDialog ── */
function ConfirmDialog({ title, message, confirmLabel='Confirm', danger, loading, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} width={420}>
      <p style={{ fontSize:14, color:'var(--fog)', lineHeight:1.6, marginBottom:24 }}>{message}</p>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onCancel} disabled={loading}
          style={{ padding:'10px 18px', border:'1.5px solid var(--stone)', borderRadius:8, background:'var(--paper)', color:'var(--ink)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          style={{ padding:'10px 18px', border:'none', borderRadius:8, background: danger ? '#c02020' : 'var(--ink)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

/* ── SellerDetailModal ── */
function SellerDetailModal({ sellerId, onClose }) {
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(`/admin/sellers/${sellerId}`)
      .then(({ data }) => setSeller(data.data))
      .catch(() => toast.error('Failed to load seller details'))
      .finally(() => setLoading(false))
  }, [sellerId])

  return (
    <Modal title="Seller Details" onClose={onClose} width={640}>
      {loading ? <Spinner label="Loading seller…" /> : !seller ? (
        <p style={{ color:'var(--fog)', fontSize:14 }}>Couldn&lsquo;t load this seller.</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {seller.storeName?.slice(0,2).toUpperCase() || 'SE'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="serif" style={{ fontSize:18, fontWeight:900, letterSpacing:'-0.02em' }}>{seller.storeName}</div>
              <div style={{ fontSize:13, color:'var(--fog)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {seller.user?.name} · {seller.user?.email}
              </div>
            </div>
            <ActiveBadge active={seller.user?.isActive} />
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            <div style={{ background:'var(--mist)', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--fog)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Revenue</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#2d7a2d' }}>{fmtINR(seller.totalEarnings)}</div>
            </div>
            <div style={{ background:'var(--mist)', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--fog)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Products</div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>{seller._count?.products || 0}</div>
            </div>
            <div style={{ background:'var(--mist)', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--fog)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Rating</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#c07a00' }}>{Number(seller.rating||0).toFixed(1)}★</div>
            </div>
          </div>

          <div style={{ fontSize:12, color:'var(--fog)' }}>
            Store joined {fmtDate(seller.user?.createdAt)} · {seller._count?.orders || 0} total orders
          </div>

          {/* Products */}
          <div>
            <div className="sec-label" style={{ marginBottom:10 }}>Products ({seller.products?.length || 0})</div>
            {seller.products?.length ? (
              <div style={{ display:'flex', flexDirection:'column', gap:0, maxHeight:180, overflowY:'auto', border:'1px solid var(--mist)', borderRadius:10 }}>
                {seller.products.map(p => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13, padding:'10px 12px', borderBottom:'1px solid var(--mist)' }}>
                    <span style={{ color:'var(--ink)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, marginRight:10 }}>{p.name}</span>
                    <span style={{ color:'var(--fog)', fontFamily:'DM Mono, monospace', fontSize:12, flexShrink:0 }}>{fmtINR(p.price)} · {p.sold} sold</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:13, color:'var(--fog)' }}>No products listed yet.</p>
            )}
          </div>

          {/* Recent orders */}
          <div>
            <div className="sec-label" style={{ marginBottom:10 }}>Recent Orders</div>
            {seller.orders?.length ? (
              <div style={{ display:'flex', flexDirection:'column', gap:0, border:'1px solid var(--mist)', borderRadius:10 }}>
                {seller.orders.map(o => (
                  <div key={o.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13, padding:'10px 12px', borderBottom:'1px solid var(--mist)', gap:10 }}>
                    <span style={{ color:'var(--sky)', fontFamily:'DM Mono, monospace', fontWeight:600, flexShrink:0 }}>{o.orderNumber}</span>
                    <span style={{ color:'var(--ink)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.customer?.name}</span>
                    <span style={{ color:'var(--fog)', fontFamily:'DM Mono, monospace', fontSize:12, flexShrink:0 }}>{fmtINR(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:13, color:'var(--fog)' }}>No orders yet.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ══════════════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════════════ */
function OverviewTab({ dashboard }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }} className="adm-2col">
        <div style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'24px' }}>
          <div className="sec-label" style={{ marginBottom:18 }}>Monthly Revenue</div>
          <BarChart data={dashboard.revenueByMonth} />
        </div>
        <div style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'24px' }}>
          <div className="sec-label" style={{ marginBottom:18 }}>Order Status Distribution</div>
          <DonutChart orders={dashboard.recentOrders} />
        </div>
      </div>

      {/* Category management card */}
      <div style={{ background:'var(--ink)', borderRadius:16, padding:'24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', marginBottom:8 }}>Quick Action</div>
          <h3 className="serif" style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', marginBottom:6 }}>Category Management</h3>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>Create, edit, and manage product categories used by sellers.</p>
        </div>
        <Link href="/pages/admin/categories"
          style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 24px', background:'var(--ember)', color:'#fff', borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:15, whiteSpace:'nowrap', transition:'opacity 0.2s, transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none' }}>
          Manage Categories →
        </Link>
      </div>

      {/* Top Products */}
      <div style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'24px' }}>
        <div className="sec-label" style={{ marginBottom:18 }}>Top 5 Products by Sales</div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {(dashboard.topProducts || []).map((product, idx) => (
            <div key={product.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', borderRadius:10, transition:'background 0.15s', cursor:'default' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--mist)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ fontSize:13, fontFamily:'DM Mono, monospace', color:'var(--fog)', width:20, flexShrink:0, fontWeight:600 }}>
                {idx+1}
              </span>
              {product.thumbnail && (
                <img src={product.thumbnail} alt={product.name} style={{ width:36, height:36, borderRadius:8, objectFit:'cover', flexShrink:0, border:'1px solid var(--stone)' }} />
              )}
              <span style={{ fontSize:14, fontWeight:600, color:'var(--ink)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {product.name}
              </span>
              <span style={{ fontSize:13, color:'var(--fog)', fontFamily:'DM Mono, monospace', flexShrink:0 }}>
                {fmtINR(product.price)}
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:'#2d7a2d', flexShrink:0, fontFamily:'DM Mono, monospace' }}>
                {product.sold} sold
              </span>
              <span style={{ fontSize:13, color:'#c07a00', flexShrink:0 }}>
                {Number(product.rating||0).toFixed(1)}★
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ORDERS TAB
══════════════════════════════════════════════════════ */
function OrdersTab({ orders }) {
  return (
    <div style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'24px' }}>
      <div className="sec-label" style={{ marginBottom:18 }}>Recent Orders</div>
      <TableWrap>
        <thead>
          <tr>
            <TH>Order #</TH>
            <TH>Customer</TH>
            <TH hide>Amount</TH>
            <TH hide>Items</TH>
            <TH>Status</TH>
            <TH hide>Date</TH>
          </tr>
        </thead>
        <tbody>
          {(orders||[]).length === 0 && <EmptyRow colSpan={6} label="No orders yet." />}
          {(orders||[]).map(order => (
            <tr key={order.id} style={{ transition:'background 0.12s' }}
              onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background='var(--mist)')}
              onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background='transparent')}>
              <TD mono><span style={{ color:'var(--sky)', fontWeight:600 }}>{order.orderNumber}</span></TD>
              <TD bold>{order.customer?.name}</TD>
              <TD hide mono>{fmtINR(order.total)}</TD>
              <TD hide>{order.items?.length || 0} items</TD>
              <TD><StatusBadge status={order.status} /></TD>
              <TD hide>{fmtDate(order.createdAt)}</TD>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   SELLERS TAB
══════════════════════════════════════════════════════ */
function SellersTab() {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [viewingSellerId, setViewingSellerId] = useState(null)

  useEffect(() => {
    apiClient.get('/admin/sellers')
      .then(({ data }) => setSellers(data.data))
      .catch(() => toast.error('Failed to load sellers'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = sellers.filter(s =>
    s.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div className="sec-label">All Sellers ({sellers.length})</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sellers…"
            style={{ padding:'9px 14px', border:'1.5px solid var(--stone)', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'var(--ink)', background:'var(--paper)', width:220, transition:'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor='var(--ink)'}
            onBlur={e => e.target.style.borderColor='var(--stone)'} />
        </div>
        {loading ? <Spinner label="Loading sellers…" /> : (
          <TableWrap>
            <thead>
              <tr>
                <TH>Store</TH>
                <TH>Owner</TH>
                <TH hide>Products</TH>
                <TH>Revenue</TH>
                <TH hide>Rating</TH>
                <TH>Status</TH>
                <TH>Actions</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow colSpan={7} label="No sellers found." />}
              {filtered.map(seller => (
                <tr key={seller.id}
                  onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background='var(--mist)')}
                  onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background='transparent')}>
                  <TD bold>{seller.storeName}</TD>
                  <TD>{seller.user?.name}</TD>
                  <TD hide mono>{seller._count?.products || 0}</TD>
                  <TD mono><span style={{ color:'#2d7a2d', fontWeight:700 }}>{fmtINR(seller.totalEarnings)}</span></TD>
                  <TD hide mono><span style={{ color:'#c07a00' }}>{Number(seller.rating||0).toFixed(1)}★</span></TD>
                  <TD><ActiveBadge active={seller.user?.isActive} /></TD>
                  <TD>
                    <button onClick={() => setViewingSellerId(seller.id)}
                      style={{ padding:'7px 14px', border:'1.5px solid var(--stone)', borderRadius:8, background:'var(--paper)', color:'var(--ink)', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='var(--ink)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='var(--stone)'}>
                      View Details
                    </button>
                  </TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>

      {viewingSellerId && (
        <SellerDetailModal sellerId={viewingSellerId} onClose={() => setViewingSellerId(null)} />
      )}
    </>
  )
}

/* ══════════════════════════════════════════════════════
   USERS TAB
══════════════════════════════════════════════════════ */
function UsersTab() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [confirmUser, setConfirmUser] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    apiClient.get('/admin/users')
      .then(({ data }) => setUsers(data.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  async function handleToggleStatus(user) {
    const nextActive = user.isActive === false ? true : false
    setUpdatingId(user.id)
    try {
      await apiClient.patch(`/admin/users/${user.id}/status`, { isActive: nextActive })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: nextActive } : u))
      toast.success(nextActive ? 'User reactivated' : 'User deactivated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    } finally {
      setUpdatingId(null)
      setConfirmUser(null)
    }
  }

  return (
    <>
      <div style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div className="sec-label">All Users ({users.length})</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {['ALL','USER','SELLER','ADMIN'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                style={{ padding:'7px 14px', border:'1.5px solid var(--stone)', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', background: roleFilter===r ? 'var(--ink)' : 'var(--paper)', color: roleFilter===r ? '#fff' : 'var(--fog)', transition:'all 0.15s' }}>
                {r}
              </button>
            ))}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
              style={{ padding:'9px 14px', border:'1.5px solid var(--stone)', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'var(--ink)', background:'var(--paper)', width:200, transition:'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor='var(--ink)'}
              onBlur={e => e.target.style.borderColor='var(--stone)'} />
          </div>
        </div>
        {loading ? <Spinner label="Loading users…" /> : (
          <TableWrap>
            <thead>
              <tr>
                <TH>Name</TH>
                <TH hide>Email</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Orders</TH>
                <TH hide>Joined</TH>
                <TH>Actions</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow colSpan={7} label="No users found." />}
              {filtered.map(user => (
                <tr key={user.id}
                  onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background='var(--mist)')}
                  onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background='transparent')}>
                  <TD bold>{user.name}</TD>
                  <TD hide>{user.email}</TD>
                  <TD><RoleBadge role={user.role} /></TD>
                  <TD><ActiveBadge active={user.isActive} /></TD>
                  <TD mono>{user._count?.orders || 0}</TD>
                  <TD hide>{fmtDate(user.createdAt)}</TD>
                  <TD>
                    <button disabled={updatingId === user.id} onClick={() => setConfirmUser(user)}
                      style={{ padding:'7px 14px', border:'1.5px solid', borderColor: user.isActive === false ? 'var(--stone)' : '#f0c9c9', borderRadius:8, background:'var(--paper)', color: user.isActive === false ? 'var(--ink)' : '#c02020', fontWeight:700, fontSize:12, cursor: updatingId === user.id ? 'default' : 'pointer', fontFamily:'inherit', whiteSpace:'nowrap', opacity: updatingId === user.id ? 0.5 : 1 }}>
                      {user.isActive === false ? 'Reactivate' : 'Deactivate'}
                    </button>
                  </TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>

      {confirmUser && (
        <ConfirmDialog
          title={confirmUser.isActive === false ? 'Reactivate user?' : 'Deactivate user?'}
          message={
            confirmUser.isActive === false
              ? `${confirmUser.name} will regain access and be able to log in again.`
              : `${confirmUser.name} will be signed out and unable to log in. Their orders and data are kept, and you can reactivate the account anytime.`
          }
          confirmLabel={confirmUser.isActive === false ? 'Reactivate' : 'Deactivate'}
          danger={confirmUser.isActive !== false}
          loading={updatingId === confirmUser.id}
          onConfirm={() => handleToggleStatus(confirmUser)}
          onCancel={() => setConfirmUser(null)}
        />
      )}
    </>
  )
}

/* ══════════════════════════════════════════════════════
   PRODUCTS TAB
══════════════════════════════════════════════════════ */
function ProductsTab() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    apiClient.get('/admin/products')
      .then(({ data }) => setProducts(data.data))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ background:'var(--paper)', border:'1.5px solid var(--stone)', borderRadius:16, padding:'24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div className="sec-label">All Products ({products.length})</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
          style={{ padding:'9px 14px', border:'1.5px solid var(--stone)', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'var(--ink)', background:'var(--paper)', width:220, transition:'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor='var(--ink)'}
          onBlur={e => e.target.style.borderColor='var(--stone)'} />
      </div>
      {loading ? <Spinner label="Loading products…" /> : (
        <TableWrap>
          <thead>
            <tr>
              <TH>Product</TH>
              <TH>Price</TH>
              <TH hide>Stock</TH>
              <TH hide>Sold</TH>
              <TH>Status</TH>
              <TH hide>Rating</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <EmptyRow colSpan={6} label="No products found." />}
            {filtered.map(p => (
              <tr key={p.id}
                onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background='var(--mist)')}
                onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background='transparent')}>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {p.thumbnail && <img src={p.thumbnail} alt={p.name} style={{ width:32, height:32, borderRadius:6, objectFit:'cover', border:'1px solid var(--stone)' }} />}
                    <span style={{ fontWeight:600, color:'var(--ink)', fontSize:13 }}>{p.name}</span>
                  </div>
                </TD>
                <TD mono>{fmtINR(p.price)}</TD>
                <TD hide mono>{p.stock}</TD>
                <TD hide mono>{p.sold}</TD>
                <TD>
                  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background: p.isActive ? '#edf7ed' : 'var(--mist)', color: p.isActive ? '#2d7a2d' : 'var(--fog)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TD>
                <TD hide mono><span style={{ color:'#c07a00' }}>{Number(p.rating||0).toFixed(1)}★</span></TD>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════ */
const TABS = [
  { id:'overview',  label:'Overview',  icon:'◎' },
  { id:'orders',    label:'Orders',    icon:'◈' },
  { id:'products',  label:'Products',  icon:'✦' },
  { id:'sellers',   label:'Sellers',   icon:'🏪' },
  { id:'users',     label:'Users',     icon:'👥' },
]

export default function AdminDashBoard() {
  const { user } = useAuthStore()
  const [dashboard,  setDashboard]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('overview')
  const [mobileMenu, setMobileMenu] = useState(false)

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

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--paper)' }}>
      <div className="spinner" />
      <p style={{ color:'var(--fog)', fontSize:15 }}>Loading dashboard…</p>
    </div>
  )

  if (!dashboard) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--paper)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <div className="serif" style={{ fontSize:24, fontWeight:900 }}>Failed to load dashboard</div>
        <button onClick={fetchDashboard} style={{ marginTop:20, padding:'12px 24px', background:'var(--ink)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Retry</button>
      </div>
    </div>
  )

  const { status } = dashboard

  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)' }}>

      {/* ── Top bar ── */}
      <div className="top-bar" style={{ justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Link href="/" className="back-link">← Home</Link>
          <div style={{ width:1, height:18, background:'var(--stone)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#2d7a2d', boxShadow:'0 0 0 3px rgba(45,122,45,0.2)' }} />
            <span style={{ fontSize:12, fontWeight:700, color:'var(--fog)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Admin Console</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/pages/admin/categories"
            style={{ padding:'8px 16px', border:'1.5px solid var(--stone)', borderRadius:8, fontSize:13, fontWeight:600, color:'var(--ink)', textDecoration:'none', transition:'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--ink)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--stone)'}>
            Categories
          </Link>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>
            {user?.name?.slice(0,2).toUpperCase() || 'AD'}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'clamp(32px,5vw,52px) 24px' }}>

        {/* ── Page heading ── */}
        <div className="fade-up" style={{ marginBottom:32 }}>
          <div className="divider" style={{ marginBottom:14 }} />
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <h1 className="serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1 }}>
                Dashboard
              </h1>
              <p style={{ color:'var(--fog)', fontSize:15, marginTop:6 }}>Platform overview &amp; management</p>
            </div>
            <button onClick={fetchDashboard}
              style={{ padding:'10px 18px', border:'1.5px solid var(--stone)', borderRadius:8, background:'var(--paper)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'var(--fog)', transition:'all 0.15s', display:'flex', alignItems:'center', gap:6 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.color='var(--ink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--stone)'; e.currentTarget.style.color='var(--fog)' }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }} className="adm-stats-grid">
          <StatCard title="Total Users"    value={fmtNum(status.totalUsers)}    icon="👥" accent="rgba(108,99,255,0.15)"  change="+12.4% this month" />
          <StatCard title="Total Sellers"  value={fmtNum(status.totalSellers)}  icon="🏪" accent="rgba(45,122,45,0.15)"   change="+8.1% this month" />
          <StatCard title="Total Orders"   value={fmtNum(status.totalOrders)}   icon="📦" accent="rgba(192,122,0,0.15)"   change="+22.7% this month" />
          <StatCard title="Total Revenue"  value={fmtINR(status.totalRevenue)}  icon="₹"  accent="rgba(232,67,10,0.12)"   change="+18.3% this month" />
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:4, marginBottom:24, overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:10, border:'1.5px solid', borderColor: activeTab===tab.id ? 'var(--ink)' : 'transparent', background: activeTab===tab.id ? 'var(--ink)' : 'transparent', color: activeTab===tab.id ? '#fff' : 'var(--fog)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', transition:'all 0.15s' }}
              onMouseEnter={e => { if (activeTab!==tab.id) { e.currentTarget.style.color='var(--ink)'; e.currentTarget.style.borderColor='var(--stone)' }}}
              onMouseLeave={e => { if (activeTab!==tab.id) { e.currentTarget.style.color='var(--fog)'; e.currentTarget.style.borderColor='transparent' }}}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="fade-up">
          {activeTab === 'overview'  && <OverviewTab dashboard={dashboard} />}
          {activeTab === 'orders'    && <OrdersTab orders={dashboard.recentOrders} />}
          {activeTab === 'products'  && <ProductsTab />}
          {activeTab === 'sellers'   && <SellersTab />}
          {activeTab === 'users'     && <UsersTab />}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .adm-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .adm-2col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 520px) {
          .adm-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .adm-hide-mobile { display: none !important; }
        }
        @media (max-width: 380px) {
          .adm-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}