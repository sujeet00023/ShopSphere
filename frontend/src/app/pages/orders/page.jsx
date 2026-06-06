/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '../../../utils/api'
import { useAuthStore } from '../../../store/authStore'
import toast from 'react-hot-toast'

const statusClass = s => {
  const map = { DELIVERED:'s-delivered', SHIPPED:'s-shipped', PROCESSING:'s-processing', PENDING:'s-pending', CONFIRMED:'s-confirmed' }
  return map[s?.toUpperCase()] || 's-placed'
}
const statusDot = { DELIVERED:'#2d7a2d', SHIPPED:'#1a6cff', PROCESSING:'#e06c00', PENDING:'#c07a00', CONFIRMED:'#5070d0' }

export default function OrdersPage() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => { if (user) fetchOrders() }, [user])

  async function fetchOrders() {
    try {
      const { data } = await apiClient.get('/orders')
      setOrders(data.data)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--mist)' }}>
      <div style={{ textAlign:'center' }}>
        <div className="serif" style={{ fontSize:48, fontWeight:900, marginBottom:16 }}>Sign In</div>
        <p style={{ color:'var(--fog)', marginBottom:24 }}>Please sign in to view your orders</p>
        <Link href="/pages/auth/login" className="btn btn-ink">Sign In →</Link>
      </div>
    </div>
  )

  const filters = ['ALL','PENDING','PROCESSING','SHIPPED','DELIVERED']
  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status?.toUpperCase() === filter)

  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)' }}>

      {/* Top bar */}
      <div className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Link href="/" className="back-link">← Back</Link>
          <div style={{ width:1, height:20, background:'var(--stone)' }} />
          <span style={{ fontSize:13, fontWeight:600, color:'var(--fog)' }}>My Orders</span>
        </div>
        <Link href="/pages/products" className="btn btn-outline" style={{ fontSize:13, padding:'9px 18px' }}>
          Continue Shopping
        </Link>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(40px,6vw,64px) 24px' }}>

        {/* Title */}
        <div className="fade-up" style={{ marginBottom:40 }}>
          <div className="divider" style={{ marginBottom:16 }} />
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <h1 className="serif" style={{ fontSize:'clamp(2.4rem,5vw,3.6rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1 }}>
                Your Orders
              </h1>
              <p style={{ color:'var(--fog)', fontSize:16, marginTop:8 }}>
                {orders.length} order{orders.length !== 1 ? 's' : ''} placed
              </p>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        {!loading && orders.length > 0 && (
          <div style={{ display:'flex', gap:8, marginBottom:32, flexWrap:'wrap' }}>
            {filters.map(f => (
              <button
                key={f}
                className={`filter-pill${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? 'All Orders' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}

        {/* Table header */}
        {!loading && filtered.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:16, padding:'0 28px', marginBottom:12 }}>
            {['Order','Date','Items','Total','Status'].map((h, i) => (
              <div key={h} className="sec-label" style={{ textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div className="spinner" style={{ margin:'0 auto 16px' }} />
            <p style={{ color:'var(--fog)', fontSize:15 }}>Loading your orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', border:'1.5px dashed var(--stone)', borderRadius:16 }}>
            <div style={{ fontSize:56, marginBottom:20 }}>📦</div>
            <h2 className="serif" style={{ fontSize:28, fontWeight:900, marginBottom:12 }}>
              {filter !== 'ALL' ? `No ${filter.toLowerCase()} orders` : 'No orders yet'}
            </h2>
            <p style={{ color:'var(--fog)', marginBottom:28 }}>
              {filter !== 'ALL' ? 'Try a different filter' : 'Start shopping to see your orders here'}
            </p>
            <Link href="/pages/products" className="btn btn-ink">Browse Products →</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map((order, i) => (
              <Link
                key={order.id}
                href={`/pages/orders/${order.id}`}
                className="order-row fade-up"
                style={{ animationDelay:`${i * 0.05}s` }}
              >
                <div>
                  <div className="col-label">Order</div>
                  <div className="col-value" style={{ color:'var(--sky)' }}>#{order.orderNumber}</div>
                </div>
                <div>
                  <div className="col-label">Date</div>
                  <div className="col-value" style={{ fontSize:14 }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                </div>
                <div className="hide-mobile">
                  <div className="col-label">Items</div>
                  <div className="col-value">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div className="col-label">Total</div>
                  <div className="col-value">₹{order.total?.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span className={`status-badge ${statusClass(order.status)}`}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:statusDot[order.status?.toUpperCase()] || 'var(--fog)', display:'inline-block', flexShrink:0 }} />
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Summary footer */}
        {!loading && orders.length > 0 && (
          <div style={{ marginTop:48, padding:'24px 28px', background:'var(--mist)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ fontSize:14, color:'var(--fog)' }}>
              Showing <strong style={{ color:'var(--ink)' }}>{filtered.length}</strong> of <strong style={{ color:'var(--ink)' }}>{orders.length}</strong> orders
            </div>
            <div style={{ display:'flex', gap:24 }}>
              {[
                ['Total Spent', `₹${orders.reduce((s,o) => s + (o.total||0), 0).toLocaleString('en-IN')}`],
                ['Orders', orders.length],
              ].map(([l,v]) => (
                <div key={l} style={{ textAlign:'right' }}>
                  <div className="sec-label">{l}</div>
                  <div className="serif" style={{ fontSize:20, fontWeight:900, color:'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}