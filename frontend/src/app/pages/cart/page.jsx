/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../store/authStore'
import { useRouter } from 'next/navigation'
import apiClient from '../../../utils/api'
import toast from 'react-hot-toast'

const getName     = i => i.product?.name        ?? i.name        ?? '—'
const getThumb    = i => i.product?.thumbnail   ?? i.thumbnail   ?? null
const getPrice    = i => i.product?.price       ?? i.price       ?? 0
const getDiscount = i => i.product?.discountPct ?? i.discountPct ?? 0
const getStock    = i => i.product?.stock       ?? i.stock       ?? 99
const fmtINR      = n => `₹${Number(n).toLocaleString('en-IN')}`

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [cartItems, setCartItems] = useState([])
  const [cartSummary, setCartSummary] = useState({
  subtotal: 0,
  itemCount: 0
})

const subtotal = cartSummary.subtotal || 0
const tax = subtotal * 0.1
const total = subtotal + tax

  const [loading, setLoading] = useState(true)
  


  const fetchCart = async () => {
  try {
    const { data } = await apiClient.get('/cart')

    setCartItems(data.data)

    setCartSummary({
      subtotal: data.subtotal,
      itemCount: data.itemCount
    })
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}


const removeCartItem = async (cartItemId) => {
  try {
    await apiClient.delete(`/cart/${cartItemId}`)

    fetchCart()

    window.dispatchEvent(new Event('cartUpdated'))

    toast.success('Item removed')
  } catch (err) {
    toast.error('Failed to remove item')
  }
}


const updateCartQuantity = async (cartItemId, quantity) => {
  try {
    await apiClient.put(`/cart/${cartItemId}`, {
      quantity
    })

    fetchCart()

    window.dispatchEvent(new Event('cartUpdated'))
  } catch (err) {
    toast.error('Failed to update quantity')
  }
}

const clearEntireCart = async () => {
  try {
    await apiClient.delete('/cart')

    fetchCart()

    window.dispatchEvent(new Event('cartUpdated'))

    toast.success('Cart cleared')
  } catch (err) {
    toast.error('Failed to clear cart')
  }
}

useEffect(() => {
  fetchCart()

  const refreshCart = () => fetchCart()

  window.addEventListener('cartUpdated', refreshCart)

  return () =>
    window.removeEventListener('cartUpdated', refreshCart)
}, [])

  if (cartItems.length === 0) return (
    <div style={{ minHeight:'100vh', background:'var(--paper)' }}>
      <div style={{ maxWidth:640, margin:'0 auto', padding:'100px 24px', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🛒</div>
        <div className="divider" style={{ margin:'0 auto 20px' }} />
        <h2 className="serif" style={{ fontSize:36, fontWeight:900, letterSpacing:'-0.03em', marginBottom:12 }}>
          Your cart is empty
        </h2>
        <p style={{ color:'var(--fog)', fontSize:16, lineHeight:1.7, marginBottom:32 }}>
          Looks like you haven&lsquo;t added anything yet. Discover thousands of great products!
        </p>
        <Link href="/pages/products"
          className="btn btn-ink"
          style={{ fontSize:15 }}>
          Browse Products →
        </Link>
      </div>
    </div>
  )

 const itemCount = cartSummary.itemCount

  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)' }}>

      {/* Sticky top bar */}
      <div className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Link href="/pages/products" className="back-link">← Shop</Link>
          <div style={{ width:1, height:18, background:'var(--stone)' }} />
          <span style={{ fontSize:13, fontWeight:600, color:'var(--fog)' }}>
            Cart{' '}
            <span className="count-badge" style={{ marginLeft:4 }}>{itemCount}</span>
          </span>
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{fmtINR(total)}</span>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(32px,5vw,56px) 24px' }}>

        {/* Heading */}
        <div className="fade-up" style={{ marginBottom:36 }}>
          <div className="divider" style={{ marginBottom:14 }} />
          <h1 className="serif" style={{ fontSize:'clamp(2.2rem,5vw,3.2rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1 }}>
            Shopping Cart
          </h1>
          <p style={{ color:'var(--fog)', fontSize:15, marginTop:8 }}>
            {itemCount} item{itemCount !== 1 ? 's' : ''} in your bag
          </p>
        </div>

        <div className="cart-layout" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:40, alignItems:'start' }}>

          {/* Items */}
          <div className="fade-up d1">
            <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:12, borderBottom:'1.5px solid var(--stone)', marginBottom:4 }}>
              <span className="sec-label">Product</span>
              <span className="sec-label">Total</span>
            </div>

            {cartItems.map((item, idx) => {
              const name      = getName(item)
              const thumb     = getThumb(item)
              const price     = getPrice(item)
              const discount  = getDiscount(item)
              const stock     = getStock(item)
              const lineTotal = price * item.quantity
              const discounted = discount > 0 ? price * (1 - discount / 100) : null

              return (
                <div key={item.id} className="cart-card" style={{ animationDelay:`${idx * 0.06}s` }}>

                  {/* Thumbnail */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    {thumb
                      ? <img src={thumb} alt={name} className="prod-img" />
                      : <div className="prod-img" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>📦</div>
                    }
                    {discount > 0 && (
                      <span className="discount-pill" style={{ position:'absolute', top:-6, right:-6 }}>
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:10 }}>
                    <div>
                      <Link href={`/pages/products/${item.productId ?? item.id}`}
                        style={{ fontWeight:700, fontSize:15, color:'var(--ink)', textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', transition:'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--sky)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--ink)'}
                      >
                        {name}
                      </Link>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                        {discounted ? (
                          <>
                            <span style={{ fontSize:14, fontWeight:700, color:'var(--ember)' }}>{fmtINR(discounted)}</span>
                            <span style={{ fontSize:13, color:'var(--fog)', textDecoration:'line-through' }}>{fmtINR(price)}</span>
                          </>
                        ) : (
                          <span style={{ fontSize:14, color:'var(--fog)', fontWeight:500 }}>{fmtINR(price)} each</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                      <div className="qty-wrap">
                        <button className="qty-btn" onClick={() =>  updateCartQuantity(item.id, Math.max(1, item.quantity - 1))} aria-label="Decrease">−</button>
                        <span className="qty-num">{item.quantity}</span>
                        <button className="qty-btn" onClick={() =>  updateCartQuantity(item.id, Math.min(stock, item.quantity + 1))} aria-label="Increase">+</button>
                      </div>
                      {stock <= 5 && (
                        <span style={{ fontSize:12, color:'var(--ember)', fontWeight:600 }}>Only {stock} left!</span>
                      )}
                      <button className="remove-btn" onClick={() => removeCartItem(item.id)}>
                        <span>✕</span> Remove
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div className="serif" style={{ fontSize:18, fontWeight:900, letterSpacing:'-0.02em' }}>
                      {fmtINR(lineTotal)}
                    </div>
                  </div>
                </div>
              )
            })}

            <div style={{ marginTop:24 }}>
              <Link href="/pages/products" className="back-link">← Continue Shopping</Link>
            </div>
          </div>

          {/* Summary */}
          <div className="cart-summary-dark fade-up d2">
            <div className="sec-label" style={{ color:'rgba(255,255,255,0.35)', marginBottom:20 }}>Order Summary</div>

            {/* Per-item breakdown */}
            <div style={{ borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:16, marginBottom:16 }}>
              {cartItems.map(item => {
                const name     = getName(item)
                const price    = getPrice(item)
                const disc     = getDiscount(item)
                const effPrice = disc > 0 ? price * (1 - disc / 100) : price
                return (
                  <div key={item.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.5)', padding:'5px 0', gap:8 }}>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                      {name} ×{item.quantity}
                    </span>
                    <span style={{ flexShrink:0 }}>{fmtINR(effPrice * item.quantity)}</span>
                  </div>
                )
              })}
            </div>

            <div className="cart-sum-row"><span>Subtotal</span><span>{fmtINR(subtotal)}</span></div>
            <div className="cart-sum-row"><span>Tax (10%)</span><span>{fmtINR(tax)}</span></div>
            <div className="cart-sum-row">
              <span>Shipping</span>
              <span style={{ color:'#6fcf97', fontWeight:700 }}>Free</span>
            </div>

            <div style={{ borderTop:'1px solid rgba(255,255,255,0.12)', marginTop:12, paddingTop:18, display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:24 }}>
              <span className="serif" style={{ fontSize:22, fontWeight:900 }}>Total</span>
              <span className="serif" style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.02em' }}>{fmtINR(total)}</span>
            </div>

            <button className="checkout-btn"
              onClick={() => router.push(user ? '/pages/checkout' : '/pages/auth/login')}>
              {user ? 'Proceed to Checkout →' : 'Sign in to Checkout'}
            </button>

            <button className="clear-btn" style={{ marginTop:12 }} onClick={clearEntireCart}>
              Clear Cart
            </button>

            <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:8 }}>
              {['🔒 Secure Checkout','🚚 Free Shipping','↩ Easy Returns'].map(b => (
                <div key={b} style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}