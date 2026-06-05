'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCartStore } from '../store/cartStore'
import apiClient from '../utils/api'
import toast from 'react-hot-toast'

/* ── helpers ── */
const fmtINR = n => `₹${Number(n).toLocaleString('en-IN')}`

function StarRating({ rating }) {
  const full  = Math.round(rating)
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:11, color: i <= full ? '#f59e0b' : '#e2e8f0' }}>★</span>
      ))}
    </div>
  )
}

function ProductCard({ product, onAddToCart }) {
  const [adding, setAdding] = useState(false)
  const discounted = product.discountPct > 0
    ? product.price * (1 - product.discountPct / 100)
    : null
  const outOfStock = product.stock === 0
  const lowStock   = product.stock > 0 && product.stock < 5

  async function handleClick(e) {
    e.preventDefault()          // don't navigate
    e.stopPropagation()
    setAdding(true)
    await onAddToCart()
    setAdding(false)
  }

  return (
    <Link
      href={`/pages/products/${product.id}`}
      style={{ textDecoration:'none', color:'inherit', display:'flex' }}
    >
      <div className="product-card" style={{ width:'100%' }}>
        {/* Image */}
        <div className="product-card-img-wrap">
          <img
            src={product.thumbnail}
            alt={product.name}
            className="product-card-img"
          />
          {product.discountPct > 0 && (
            <span className="product-badge product-badge-discount">
              -{product.discountPct}%
            </span>
          )}
          {lowStock && !outOfStock && (
            <span className="product-badge product-badge-low" style={{ top:'auto', bottom:12, right:'auto', left:12 }}>
              Only {product.stock} left
            </span>
          )}
          {outOfStock && (
            <div className="product-oos-overlay">
              <span>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-card-body">
          {product.category?.name && (
            <span className="product-cat">{product.category.name}</span>
          )}
          <h3 className="product-name">{product.name}</h3>

          <div style={{ display:'flex', alignItems:'center', gap:6, margin:'6px 0 10px' }}>
            <StarRating rating={product.rating} />
            <span style={{ fontSize:12, color:'var(--fog)' }}>({product.reviewCount})</span>
          </div>

          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:6 }}>
            <span className="product-price">
              {discounted ? fmtINR(discounted) : fmtINR(product.price)}
            </span>
            {discounted && (
              <span className="product-price-orig">{fmtINR(product.price)}</span>
            )}
          </div>

          {product.seller?.storeName && (
            <p style={{ fontSize:12, color:'var(--fog)', marginBottom:14 }}>
              by <span style={{ fontWeight:600 }}>{product.seller.storeName}</span>
            </p>
          )}

          <button
            onClick={handleClick}
            disabled={outOfStock || adding}
            className={`product-atc-btn${outOfStock ? ' product-atc-disabled' : ''}`}
          >
            {adding ? (
              <span style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
                <span className="spinner-sm" /> Adding…
              </span>
            ) : outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}

export default function ProductGrid({ products = [], loading }) {
  const { addToCart } = useCartStore()

  /**
   * THE FIX:
   * 1. POST to backend API (persists to DB)
   * 2. addToCart(product, 1) — syncs local Zustand store so CartPage sees it
   * Both must happen together.
   */
  async function handleAddToCart(product) {
    try {
      await apiClient.post('/cart', {
        productId: product.id,
        quantity: 1,
      })
      // ✅ also update local store so cart page reflects immediately
      addToCart(product, 1)
      toast.success(`${product.name} added to cart`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    }
  }

  if (loading) {
    return (
      <div className="product-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="product-skeleton" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'64px 0' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
        <p style={{ color:'var(--fog)', fontSize:16 }}>No products found</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => handleAddToCart(product)}
        />
      ))}
    </div>
  )
}