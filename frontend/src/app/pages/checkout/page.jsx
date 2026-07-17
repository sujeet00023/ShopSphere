/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect } from 'react'
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
  const [cartItems, setCartItems] = useState([])
const [cartSummary, setCartSummary] = useState({
  subtotal: 0,
  itemCount: 0
})
 
  
const [wallet, setWallet] = useState({ balance: 0 })
const [useWallet, setUseWallet] = useState(true) // Default: use wallet
const [walletAmountToUse, setWalletAmountToUse] = useState(0)
const subtotal = cartSummary.subtotal
const tax = subtotal * 0.1
const total = subtotal + tax

// Calculate wallet usage
  const maxWalletUsable = Math.min(wallet.balance, total)
  const amountToPayWithCard = Math.max(0, total - (useWallet ? walletAmountToUse : 0))
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

// Fetch Cart + Wallet
const fetchCart = async () => {
  try {
    const [cartRes, walletRes] = await Promise.all([
      apiClient.get('/cart'),
      apiClient.get('/users/wallet')
    ])

    setCartItems(cartRes.data?.data || [])
    setCartSummary({
      subtotal: cartRes.data?.subtotal || 0,
      itemCount: cartRes.data?.itemCount || 0
    })

    setWallet(walletRes.data?.data || { balance: 0 })
  } catch (err) {
    console.error(err)
    toast.error('Failed to load checkout data')
  }
}

useEffect(() => {
    fetchCart()
}, [])

if (cartItems === 0) return (
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
    const orderPayload = {
      items: cartItems.map(item => ({
        productId: item.productId ?? item.id,
        quantity: item.quantity,
        price: item.product?.price ?? item.price,
      })),
      shipping: { ...formData },
      useWallet: useWallet,
      walletAmount: useWallet ? walletAmountToUse : 0,
    }

    const response = await apiClient.post('/orders', orderPayload)

    // Handle multiple possible response structures
    let orderId

    if (response.data?.data?.[0]?.id) {
      orderId = response.data.data[0].id
    } else if (response.data?.data?.id) {
      orderId = response.data.data.id
    } else if (response.data?.id) {
      orderId = response.data.id
    } else if (response.data?.orderNumber) {
      orderId = response.data.orderNumber
    } else {
      throw new Error('Could not get order ID from response')
    }

    // If remaining amount to pay via card
    if (amountToPayWithCard > 0) {
      await apiClient.post('/stripe/create-payment-intent', { orderId })
    }

    toast.success('Order placed successfully!')

    // Refresh data
    await fetchCart()

    router.push(`/pages/orders/${orderId}`)
  } catch (err) {
    console.error('Checkout Error:', err)
    toast.error(err.response?.data?.message || 'Checkout failed. Please try again.')
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
    {/* Wallet Section */}
    <div className="section-card" style={{ marginBottom: 24, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div className="section-title flex items-center gap-3">
        💰 Your Wallet
        <span className="text-2xl font-bold text-emerald-600">
          ₹{wallet.balance.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="checkbox"
          id="useWallet"
          checked={useWallet}
          onChange={(e) => {
            setUseWallet(e.target.checked)
            if (e.target.checked) {
              setWalletAmountToUse(Math.min(wallet.balance, total))
            } else {
              setWalletAmountToUse(0)
            }
          }}
          className="w-5 h-5 accent-emerald-600"
        />
        <label htmlFor="useWallet" className="font-medium cursor-pointer">
          Use wallet balance for this order
        </label>
      </div>

      {useWallet && (
        <div className="mt-5">
          <label className="block text-sm font-medium mb-2">Amount to use from wallet</label>
          <input
            type="range"
            min="0"
            max={Math.min(wallet.balance, total)}
            step="0.01"
            value={walletAmountToUse}
            onChange={(e) => setWalletAmountToUse(parseFloat(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-sm mt-1">
            <span>₹0</span>
            <span className="font-semibold text-emerald-600">
              ₹{walletAmountToUse.toFixed(2)}
            </span>
            <span>₹{Math.min(wallet.balance, total).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>

    {/* Remaining Amount to Pay */}
    {amountToPayWithCard > 0 && (
      <div className="section-card">
        <div className="section-title">Pay Remaining with Card</div>
        <div className="text-lg font-semibold text-gray-900 mt-2">
          ₹{amountToPayWithCard.toFixed(2)}
        </div>

        {/* Test Card Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6 text-sm">
          <strong>Test Mode:</strong> Use card number <span className="font-mono">4242 4242 4242 4242</span><br />
          Any future expiry date • Any CVC
        </div>

        {/* Card Fields */}
        <div className="mt-6 space-y-5">
          <Field label="Cardholder Name">
            <input
              className="field-input"
              type="text"
              value={paymentData.cardName}
              onChange={updPayment('cardName')}
              placeholder="John Doe"
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

          <div className="grid grid-cols-2 gap-4">
            <Field label="Expiry Date">
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
    )}

    {/* Submit Button */}
    <button
      type="submit"
      disabled={loading}
      className="submit-btn w-full mt-8"
    >
      {loading ? (
        <>Processing Order...</>
      ) : (
        `Complete Payment • ₹${total.toFixed(2)}`
      )}
    </button>
  </div>
)}
            </div>

            {/* ── RIGHT: Order Summary ── */}
            <div className="summary-card-checkout fade-up d2">
              <div className="sec-label" style={{ marginBottom: 18 }}>Order Summary</div>

              {/* Items */}
              <div style={{ marginBottom: 16 }}>
                {cartItems.map(item => {
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