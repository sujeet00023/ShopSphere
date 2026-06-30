/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '../../../../utils/api'
import { useAuthStore } from '../../../../store/authStore'
import toast from 'react-hot-toast'

const statusClass = s =>
  ({ pending:'s-pending', processing:'s-processing', shipped:'s-shipped', delivered:'s-delivered', confirmed:'s-confirmed', cancelled:'s-cancelled', placed:'s-placed' })[s?.toLowerCase()] || 's-placed'

const STEPS = [
  { status:'placed',     label:'Placed',     icon:'✦' },
  { status:'confirmed',  label:'Confirmed',  icon:'◎' },
  { status:'processing', label:'Processing', icon:'⚙' },
  { status:'shipped',    label:'Shipped',    icon:'◈' },
  { status:'delivered',  label:'Delivered',  icon:'✓' },
]
const STEP_ORDER = STEPS.map(s => s.status)

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user,  hydrated  } = useAuthStore()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hydrated) return
    if (!user) { router.push('/pages/auth/login'); return }
    fetchOrder()
  }, [hydrated , user , params.id])

  async function fetchOrder() {
    try {
      const { data } = await apiClient.get(`/orders/${params.id}`)
      setOrder(data.data)
    } catch {
      toast.error('Failed to load order')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }
async function handleDownloadInvoice() {
  try {
    const response = await apiClient.get(
      `/invoices/${order.id}/download`,
      { responseType: 'blob' }
    )

    const url = window.URL.createObjectURL(new Blob([response.data]))

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `invoice-${order.orderNumber}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(url)
  } catch (err) {
    toast.error('Failed to download invoice')
  }
}

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div className="spinner" />
      <p style={{ color:'var(--fog)', fontSize:15 }}>Loading order…</p>
    </div>
  )

  if (!order) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div className="serif" style={{ fontSize:40, fontWeight:900 }}>Order Not Found</div>
      <Link href="/pages/orders" className="back-link">← Back to Orders</Link>
    </div>
  )

  const currentStep = STEP_ORDER.indexOf(order.status?.toLowerCase())
  const progressPct = currentStep >= 0 ? ((currentStep + 1) / STEP_ORDER.length) * 100 : 0

  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)' }}>

      {/* Sticky top bar */}
      <div className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Link href="/pages/orders" className="back-link">← Orders</Link>
          <div style={{ width:1, height:18, background:'var(--stone)' }} />
          <span style={{ fontSize:13, fontWeight:600, color:'var(--fog)' }}>#{order.orderNumber}</span>
        </div>
        <span className={`status-badge ${statusClass(order.status)}`}>{order.status}</span>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(36px,5vw,56px) 24px' }}>

        {/* Page title */}
        <div className="fade-up" style={{ marginBottom:40 }}>
          <div className="divider" style={{ marginBottom:16 }} />
          <div className="header-row" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div>
              <h1 className="serif" style={{ fontSize:'clamp(2rem,5vw,3.2rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1 }}>
                Order Detail
              </h1>
              <p style={{ color:'var(--fog)', fontSize:15, marginTop:8 }}>
                Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div className="sec-label" style={{ marginBottom:4 }}>Order Total</div>
              <div className="serif" style={{ fontSize:32, fontWeight:900, letterSpacing:'-0.02em' }}>
                ₹{order.total?.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card fade-up d1" style={{ marginBottom:24 }}>
          <div className="sec-label" style={{ marginBottom:16 }}>Order Status</div>
          <div style={{ height:3, background:'var(--stone)', borderRadius:2, marginBottom:32, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressPct}%`, background:'var(--ink)', borderRadius:2, transition:'width 0.8s ease' }} />
          </div>
          <div style={{ display:'flex', alignItems:'flex-start' }}>
            {STEPS.map((step, idx) => {
              const isDone   = idx < currentStep
              const isActive = idx === currentStep
              return (
                <div key={step.status} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                  {idx < STEPS.length - 1 && (
                    <div style={{ position:'absolute', top:22, left:'50%', width:'100%', height:2, background:isDone ? 'var(--ink)' : 'var(--stone)', zIndex:0, transition:'background 0.4s' }} />
                  )}
                  <div className={`tl-step-circle${isActive ? ' active' : isDone ? ' done' : ''}`}>
                    {step.icon}
                  </div>
                  <div className="tl-label" style={{ marginTop:10, fontSize:12, fontWeight:600, color:isActive ? 'var(--ember)' : isDone ? 'var(--ink)' : 'var(--fog)', textAlign:'center' }}>
                    {step.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main grid */}
        <div className="detail-grid" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24, alignItems:'start' }}>

          {/* LEFT */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

            {/* Order Items */}
            <div className="card fade-up d2">
              <div className="sec-label" style={{ marginBottom:4 }}>Items ({order.items?.length || 0})</div>
              <div>
                {order.items?.map((item, idx) => (
                  <Link key={idx} href={`/products/${item.productId}`} className="item-row">
                    <div style={{ width:64, height:64, flexShrink:0, borderRadius:10, overflow:'hidden', background:'var(--mist)' }}>
                      {item.product?.thumbnail
                        ? <img src={item.product.thumbnail} alt={item.product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>📦</div>
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.product?.name}
                      </div>
                      <div style={{ fontSize:13, color:'var(--fog)', marginTop:3 }}>
                        Qty: {item.quantity}{item.variant ? ` · ${item.variant}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontWeight:700, fontSize:15 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize:12, color:'var(--fog)', marginTop:2 }}>₹{item.price?.toLocaleString('en-IN')} each</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card fade-up d2">
              <div className="sec-label" style={{ marginBottom:16 }}>Shipping Address</div>
              <div style={{ fontSize:15, lineHeight:1.9 }}>
                <div style={{ fontWeight:700 }}>{order.shipping?.fullName}</div>
                <div style={{ color:'var(--fog)' }}>{order.shipping?.street}</div>
                <div style={{ color:'var(--fog)' }}>{order.shipping?.city}, {order.shipping?.state} {order.shipping?.zipCode}</div>
                <div style={{ color:'var(--fog)' }}>{order.shipping?.country}</div>
                <div style={{ fontWeight:600, marginTop:8 }}>{order.shipping?.phone}</div>
              </div>
            </div>

            {/* Tracking */}
            <div className="card fade-up d2">
              <div className="sec-label" style={{ marginBottom:16 }}>Tracking</div>
              {order.trackingNumber ? (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                    <div style={{ fontSize:24 }}>📦</div>
                    <div>
                      <div className="mono" style={{ fontSize:16, fontWeight:600, color:'var(--sky)', letterSpacing:'0.04em' }}>{order.trackingNumber}</div>
                      <div style={{ fontSize:13, color:'var(--fog)', marginTop:2 }}>via {order.carrier || 'Standard Shipping'}</div>
                    </div>
                  </div>
                  <a href="#" style={{ fontSize:14, fontWeight:600, color:'var(--sky)', textDecoration:'none' }}>Track Package →</a>
                </div>
              ) : (
                <p style={{ color:'var(--fog)', fontSize:14 }}>Tracking number will be available once your order ships.</p>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

            {/* Order total dark card */}
            <div className="card-dark fade-up d2">
              <div className="sec-label" style={{ color:'rgba(255,255,255,0.35)', marginBottom:20 }}>Summary</div>
              {[
                ['Subtotal',  `₹${order.subtotal?.toLocaleString('en-IN')}`],
                ['Shipping',  `₹${order.shippingCost?.toLocaleString('en-IN') || '0'}`],
                ...(order.tax      > 0 ? [['Tax',      `₹${order.tax?.toLocaleString('en-IN')}`,      false]] : []),
                ...(order.discount > 0 ? [['Discount', `-₹${order.discount?.toLocaleString('en-IN')}`, true ]] : []),
              ].map(([l, v, green]) => (
                <div key={l} className="sum-row">
                  <span style={{ color:'rgba(255,255,255,0.55)' }}>{l}</span>
                  <span style={{ fontWeight:600, color: green ? '#6fcf97' : 'var(--paper)' }}>{v}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.12)', marginTop:4, paddingTop:16, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span className="serif" style={{ fontSize:20, fontWeight:900 }}>Total</span>
                <span className="serif" style={{ fontSize:24, fontWeight:900 }}>₹{order.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="card fade-up d3">
              <div className="sec-label" style={{ marginBottom:16 }}>Payment</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ fontSize:24 }}>💳</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:15 }}>{order.paymentMethod || 'Credit Card'}</div>
                  <div style={{ fontSize:13, color:'var(--fog)' }}>···· {order.cardLast4 || '****'}</div>
                </div>
              </div>
              <div style={{ background:'#edf7ed', border:'1px solid #c3e6c3', borderRadius:8, padding:'10px 14px' }}>
                <span style={{ color:'var(--green)', fontWeight:700, fontSize:13 }}>✓ Payment Successful</span>
              </div>
            </div>

            {/* Actions */}
            <div className="fade-up d3">
              <div className="sec-label" style={{ marginBottom:14 }}>Actions</div>
              <div className="actions-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <button onClick={handleDownloadInvoice} className="action-btn action-btn-primary">
                  <span className="icon">📄</span>Invoice
                </button>
                <Link href="/pages/products" className="action-btn">
                  <span className="icon">🛒</span>Reorder
                </Link>
                <Link href="/pages/products" className="action-btn" style={{ gridColumn:'1/-1' }}>
                  <span className="icon">🛍️</span>Continue Shopping
                </Link>
              </div>
            </div>

            {/* Help */}
            <div style={{ background:'var(--mist)', border:'1.5px solid var(--stone)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontWeight:700, marginBottom:6, fontSize:15 }}>Need help?</div>
              <p style={{ fontSize:14, color:'var(--fog)', lineHeight:1.7, marginBottom:14 }}>Our support team is available 24/7 for any order questions.</p>
              <button style={{ background:'none', border:'none', color:'var(--sky)', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', padding:0 }}>
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}