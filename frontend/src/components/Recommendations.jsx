/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import apiClient from "../utils/api"
import { useCartStore } from "../store/cartStore"
import toast from "react-hot-toast"

export default function Recommendations({ productId, type = 'similar'}) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(ture)
    const [title, setTitle] = useState('')
    const {addToCart } = useCartStore()

    useEffect(() =>{
        fetchRecommendations()
    }, [productId, type])

    async function  fetchRecommendations() {
        try{
            setLoading(true)
            let data
            let titleText = ''

            switch (type){
                case 'similar':
                    ({data}) = await apiClient.get(`/recommendations/similar/${productId}`)
                    titleText = 'Similar Products'
                    break
                case 'frequently-brought':
                    ({data}) = await apiClient.get(`/recommendations/frequently-brought/${productId}`)
                    titleText = 'Frequently Brought Together'
                    break
                case 'bestsellers':({ data } = await apiClient.get('/recommendations/bestsellers'))
                   titleText = 'Best Sellers'
                   break
                case 'personalized':
                  ({ data } = await apiClient.get('/recommendations/personalized'))
                  titleText = 'Recommended For You'
                  break
                 default:
                 return
            }
             setProducts(data.data)
      setTitle(titleText)
    } catch (err) {
      console.error('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
        
    }
     if (loading) return <div className="text-center py-8 text-gray-500">Loading recommendations...</div>

  if (products.length === 0) return null

 return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(product => {
          const discountedPrice = product.price - (product.price * (product.discountPct / 100))

          return (
            <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform"
                />
                {product.discountPct > 0 && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{product.discountPct}%
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-2 cursor-pointer">
                    {product.name}
                  </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">{'⭐'.repeat(Math.round(product.rating))}</span>
                  <span className="text-sm text-gray-600">({product.reviewCount})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-900">${discountedPrice.toFixed(2)}</span>
                  {product.discountPct > 0 && (
                    <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
                  )}
                </div>

                {/* Seller */}
                <p className="text-xs text-gray-600">by {product.seller?.storeName}</p>

                {/* Add to Cart */}
                <button
                  onClick={() => {
                    addToCart(product, 1)
                    toast.success('Added to cart!')
                  }}
                  disabled={product.stock === 0}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    product.stock === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:opacity-90'
                  }`}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}