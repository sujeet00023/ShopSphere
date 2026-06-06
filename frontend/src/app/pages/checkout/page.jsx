'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '../../../utils/api'
import { useCartStore } from '../../../store/cartStore'
import { useAuthStore } from '../../../store/authStore'
import toast from 'react-hot-toast'

/* ✅ FIX: Field is defined OUTSIDE CheckoutPage so it is never re-created
   on re-render. When defined inside, React treats it as a new component
   type every render → unmounts + remounts the input → focus lost. */
function Field({ label, children, span }) {
  return (
    <div className="field-wrap" style={span ? { gridColumn: `span ${span}` } : {}}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items, getTotals, clearCart } = useCartStore()
  const { total, subtotal, tax } = getTotals()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email:    user?.email || '',
    phone:    '',
    street:   '',
    city:     '',
    state:    '',
    zipCode:  '',
    country:  'India',
  })

  const [paymentData, setPaymentData] = useState({
    cardName:   '',
    cardNumber: '',
    expiry:     '',
    cvc:        '',
  })

  /* Stable updater — uses functional form so no stale closure issues */
  const updForm    = (key) => (e) => setFormData(prev    => ({ ...prev, [key]: e.target.value }))
  const updPayment = (key) => (e) => setPaymentData(prev => ({ ...prev, [key]: e.target.value }))

  if (items.length === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>🛒</div>
      <div className="serif" style={{ fontSize: 32, fontWeight: 900 }}>Your cart is empty</div>
      <p style={{ color: 'var(--fog)', fontSize: 16, marginBottom: 8 }}>Add some items before checking out.</p>
      <a href="/pages/cart" style={{ fontSize: 15, fontWeight: 700, color: 'var(--sky)', textDecoration: 'none' }}>← Back to Cart</a>
    </div>
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await apiClient.post('/orders', {
        items: items.map(item => ({
          productId: item.productId ?? item.id,
          quantity:  item.quantity,
          price:     item.product?.price ?? item.price,
        })),
        shipping: { ...formData },
      })
      const orderId = data.data[0].id
      await apiClient.post('/stripe/create-payment-intent', { orderId })
      toast.success('Order placed successfully!')
      clearCart()
      router.push(`/pages/orders/${orderId}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>

      {/* ── Top bar ── */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/pages/cart" className="back-link">← Cart</a>
          <div style={{ width: 1, height: 18, background: 'var(--stone)' }} />
          <div className="serif" style={{ fontSize: 18, fontWeight: 900 }}>Checkout</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          {[['1', 'Shipping'], ['2', 'Payment']].map(([n, label], idx) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: step >= +n ? 'var(--ink)' : 'var(--stone)',
                color: step >= +n ? '#fff' : 'var(--fog)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, transition: 'background 0.2s',
              }}>{n}</div>
              <span style={{ fontWeight: 600, color: step >= +n ? 'var(--ink)' : 'var(--fog)' }}>{label}</span>
              {idx === 0 && <div style={{ width: 24, height: 1.5, background: 'var(--stone)', margin: '0 4px' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px,5vw,52px) 24px' }}>
        <form onSubmit={handleSubmit}>
          <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

            {/* ── LEFT: Form ── */}
            <div>
              <div className="fade-up" style={{ marginBottom: 28 }}>
                <div className="divider" style={{ marginBottom: 14 }} />
                <h1 className="serif" style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>
                  {step === 1 ? 'Shipping Info' : 'Payment'}
                </h1>
              </div>

              {/* ── Step 1: Shipping ── */}
              {step === 1 && (
                <div className="fade-up d1">
                  <div className="section-card">
                    <div className="section-title">Delivery Details</div>
                    <div style={{ display: 'grid', gap: 16 }}>

                      <Field label="Full Name">
                        <input
                          className="field-input"
                          type="text"
                          value={formData.fullName}
                          onChange={updForm('fullName')}
                          placeholder="John Doe"
                          required
                        />
                      </Field>

                      <div className="grid-2">
                        <Field label="Email">
                          <input
                            className="field-input"
                            type="email"
                            value={formData.email}
                            onChange={updForm('email')}
                            placeholder="john@email.com"
                            required
                          />
                        </Field>
                        <Field label="Phone">
                          <input
                            className="field-input"
                            type="tel"
                            value={formData.phone}
                            onChange={updForm('phone')}
                            placeholder="+91 9876543210"
                            required
                          />
                        </Field>
                      </div>

                      <Field label="Street Address">
                        <input
                          className="field-input"
                          type="text"
                          value={formData.street}
                          onChange={updForm('street')}
                          placeholder="123 Main Street, Apt 4B"
                          required
                        />
                      </Field>

                      <div className="grid-3">
                        <Field label="City">
                          <input
                            className="field-input"
                            type="text"
                            value={formData.city}
                            onChange={updForm('city')}
                            placeholder="Mumbai"
                            required
                          />
                        </Field>
                        <Field label="State">
                          <input
                            className="field-input"
                            type="text"
                            value={formData.state}
                            onChange={updForm('state')}
                            placeholder="Maharashtra"
                            required
                          />
                        </Field>
                        <Field label="ZIP Code">
                          <input
                            className="field-input"
                            type="text"
                            value={formData.zipCode}
                            onChange={updForm('zipCode')}
                            placeholder="400001"
                            required
                          />
                        </Field>
                      </div>

                      <Field label="Country">
                        <input
                          className="field-input"
                          type="text"
                          value={formData.country}
                          onChange={updForm('country')}
                          required
                        />
                      </Field>

                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="submit-btn"
                  >
                    Continue to Payment →
                  </button>
                </div>
              )}

              {/* ── Step 2: Payment ── */}
              {step === 2 && (
                <div className="fade-up d1">
                  {/* Test card notice */}
                  <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>🔵</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 4 }}>Test Mode</div>
                      <div className="mono" style={{ fontSize: 13, color: '#3b5fc0' }}>
                        4242 4242 4242 4242 · Any future date · Any CVC
                      </div>
                    </div>
                  </div>

                  <div className="section-card">
                    <div className="section-title">Card Details</div>
                    <div style={{ display: 'grid', gap: 16 }}>

                      <Field label="Cardholder Name">
                        <input
                          className="field-input"
                          type="text"
                          value={paymentData.cardName}
                          onChange={updPayment('cardName')}
                          placeholder="Name on card"
                          required
                        />
                      </Field>

                      <Field label="Card Number">
                        <input
                          className="field-input mono"
                          type="text"
                          value={paymentData.cardNumber}
                          onChange={updPayment('cardNumber')}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          required
                        />
                      </Field>

                      <div className="grid-2">
                        <Field label="Expiry">
                          <input
                            className="field-input mono"
                            type="text"
                            value={paymentData.expiry}
                            onChange={updPayment('expiry')}
                            placeholder="MM / YY"
                            maxLength={5}
                            required
                          />
                        </Field>
                        <Field label="CVC">
                          <input
                            className="field-input mono"
                            type="text"
                            value={paymentData.cvc}
                            onChange={updPayment('cvc')}
                            placeholder="123"
                            maxLength={4}
                            required
                          />
                        </Field>
                      </div>

                    </div>
                  </div>

                  {/* Security badges */}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                    {['🔒 SSL Encrypted', '🛡️ Stripe Secured', '✓ PCI Compliant'].map(b => (
                      <span key={b} style={{ fontSize: 12, color: 'var(--fog)', fontWeight: 500 }}>{b}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{ padding: '16px 24px', border: '1.5px solid var(--stone)', borderRadius: 10, background: 'var(--paper)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--stone)'}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="submit-btn"
                      style={{ flex: 1 }}
                    >
                      {loading
                        ? <><span className="spinner-sm" /> Processing…</>
                        : `Place Order · ₹${total.toFixed(2)}`
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Order Summary ── */}
            <div className="summary-card-checkout fade-up d2">
              <div className="sec-label" style={{ marginBottom: 18 }}>Order Summary</div>

              {/* Items */}
              <div style={{ marginBottom: 16 }}>
                {items.map(item => {
                  const name  = item.product?.name      ?? item.name      ?? '—'
                  const thumb = item.product?.thumbnail ?? item.thumbnail ?? null
                  const price = item.product?.price     ?? item.price     ?? 0
                  return (
                    <div key={item.id} className="cart-item-mini">
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--stone)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {thumb
                          ? <img src={thumb} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '📦'
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                        <div style={{ fontSize: 12, color: 'var(--fog)', marginTop: 2 }}>×{item.quantity}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        ₹{(price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1.5px solid var(--stone)', paddingTop: 14, marginBottom: 14 }}>
                {[
                  ['Subtotal', `₹${subtotal?.toFixed(2)}`],
                  ['Tax',      `₹${tax?.toFixed(2)}`],
                  ['Shipping', 'Free'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--fog)', padding: '6px 0' }}>
                    <span>{l}</span>
                    <span style={{ color: v === 'Free' ? '#3d7a5c' : 'var(--ink)', fontWeight: v === 'Free' ? 700 : 400 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1.5px solid var(--stone)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="serif" style={{ fontSize: 20, fontWeight: 900 }}>Total</span>
                <span className="serif" style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em' }}>
                  ₹{total.toFixed(2)}
                </span>
              </div>

              {/* Shipping address preview */}
              {step === 2 && formData.street && (
                <div style={{ marginTop: 20, background: 'var(--paper)', borderRadius: 10, padding: '14px 16px', fontSize: 13, lineHeight: 1.8, border: '1px solid var(--stone)' }}>
                  <div className="sec-label" style={{ marginBottom: 6 }}>Ships to</div>
                  <div style={{ fontWeight: 600 }}>{formData.fullName}</div>
                  <div style={{ color: 'var(--fog)' }}>{formData.street}</div>
                  <div style={{ color: 'var(--fog)' }}>{formData.city}, {formData.state} {formData.zipCode}</div>
                </div>
              )}

              <div style={{ marginTop: 20, fontSize: 12, color: 'var(--fog)', lineHeight: 1.7, textAlign: 'center' }}>
                🔒 Your payment info is encrypted and secure
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}