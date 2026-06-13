/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '../../../../utils/api'
import { useCartStore } from '../../../../store/cartStore'
import ProductReviews from '../../../../components/ProductRevirw'
import Recommendations from '../../../../components/Recommendations'
import toast from 'react-hot-toast'

export default function ProductDetailsPage() {
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState(null)
  const { addToCart } = useCartStore()

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  async function fetchProduct() {
    try {
      const { data } = await apiClient.get(`/products/${params.id}`)
      setProduct(data.data)
      setSelectedImage(data.data.thumbnail)
    } catch (err) {
      toast.error('Product not found')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    toast.success(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`)
    setQuantity(1)
  }

  const handleFavorite = async () => {
  try {
    if (!isFavorite) {
      await apiClient.post('/users/wishlist', {
        productId: product.id,
      })

      setIsFavorite(true)
      toast.success('Added to wishlist')
    } else {
      // You'll need wishlist item id for this
      await apiClient.delete(`/users/wishlist/${wishlistItemId}`)

      setIsFavorite(false)
      toast.success('Removed from wishlist')
    }
  } catch (err) {
    toast.error(
      err.response?.data?.message || 'Wishlist operation failed'
    )
  }
}

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.desc,
          url: window.location.href,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Error sharing product')
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Product link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</p>
          <p className="text-gray-600 mb-6">Sorry, we couldn&lsquo;t find this product.</p>
          <Link href="/products" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const discountedPrice = product.price - (product.price * (product.discountPct / 100))
  const discountAmount = (product.price * (product.discountPct / 100)).toFixed(2)

  // Format currency in Indian Rupees
  const formatINR = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium transition">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/products" className="text-blue-600 hover:text-blue-700 font-medium transition">
            Products
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Enhanced Image Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-shadow group">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Discount Badge */}
              {product.discountPct > 0 && (
                <div className="absolute top-6 right-6 bg-gradient-to-br from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  <div className="text-xs opacity-90">Save</div>
                  <div className="text-lg">{product.discountPct}%</div>
                </div>
              )}

              {/* Stock Badge */}
              <div className="absolute bottom-6 left-6">
                {product.stock > 0 ? (
                  <div className="bg-white bg-opacity-95 backdrop-blur-sm text-green-600 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ✓ {product.stock} in stock
                  </div>
                ) : (
                  <div className="bg-white bg-opacity-95 backdrop-blur-sm text-red-600 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Out of Stock
                  </div>
                )}
              </div>
            </div>

            {/* Image Thumbnail (for future gallery expansion) */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedImage(product.thumbnail)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                  selectedImage === product.thumbnail
                    ? 'border-blue-600 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img src={product.thumbnail} alt="Main" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              {product.category && (
                <div className="inline-block">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {product.category.name}
                  </span>
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-600 text-lg">
                by <span className="font-semibold text-gray-900">{product.seller?.storeName || 'Seller'}</span>
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.round(product.rating) ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-gray-700 font-semibold ml-2">{product.rating.toFixed(1)}</span>
              </div>
              <div className="text-gray-600">
                ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                  {formatINR(discountedPrice)}
                </span>
                {product.discountPct > 0 && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatINR(product.price)}
                  </span>
                )}
              </div>
              {product.discountPct > 0 && (
                <div className="text-sm text-green-600 font-semibold">
                  You save {formatINR(discountAmount)}
                </div>
              )}
              <div className="text-xs text-gray-600 pt-2">
                Inclusive of all taxes
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">About this product</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {product.longDesc || product.desc}
              </p>
            </div>

            {/* Key Features / Specs */}
            {product.specs && (
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(product.specs).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="pb-3 border-b border-gray-100">
                      <p className="text-gray-600 text-xs uppercase tracking-wider mb-1">{key}</p>
                      <p className="text-gray-900 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart & Actions */}
            {product.stock > 0 && (
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                  <label className="font-semibold text-gray-900">Quantity</label>
                  <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-bold transition"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-bold transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  🛒 Add to Cart
                </button>
              </div>
            )}

            {/* Favorite & Share Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleFavorite}
                className={`py-3 px-4 rounded-xl font-semibold transition-all border-2 flex items-center justify-center gap-2 ${
                  isFavorite
                    ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {isFavorite ? '❤️' : '🤍'} Wishlist
              </button>
              <button
                onClick={handleShare}
                className="py-3 px-4 rounded-xl font-semibold transition-all border-2 border-gray-200 text-gray-700 hover:border-gray-300 flex items-center justify-center gap-2 bg-white"
              >
                📤 Share
              </button>
            </div>

            {/* Trust & Delivery Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center py-4">
                <div className="text-2xl mb-2">🚚</div>
                <p className="text-xs text-gray-600 font-medium">Free Delivery</p>
                <p className="text-xs text-gray-500">Orders above ₹500</p>
              </div>
              <div className="text-center py-4">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-xs text-gray-600 font-medium">7-Day Returns</p>
                <p className="text-xs text-gray-500">Easy exchanges</p>
              </div>
              <div className="text-center py-4">
                <div className="text-2xl mb-2">🔒</div>
                <p className="text-xs text-gray-600 font-medium">Secure Payment</p>
                <p className="text-xs text-gray-500">100% protected</p>
              </div>
              <div className="text-center py-4">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-xs text-gray-600 font-medium">24/7 Support</p>
                <p className="text-xs text-gray-500">Chat with us</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-16"></div>

        {/* Reviews Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
          <ProductReviews productId={params.id} />
        </div>

        {/* Recommendations */}
        <div className="space-y-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Bought Together</h2>
            <Recommendations productId={params.id} type="frequently-bought" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Similar Products</h2>
            <Recommendations productId={params.id} type="similar" />
          </div>
        </div>
      </div>
    </div>
  )
}