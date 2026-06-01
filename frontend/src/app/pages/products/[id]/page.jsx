/* eslint-disable react-hooks/immutability */
'use client'

import {useEffect, useState} from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '../../../../utils/api'
import { useCartStore } from '../../../../store/cartStore'
import ProductReviews from '../../../../components/ProductRevirw'
import Recommendations from '../../../../components/Recommendations'
import toast from 'react-hot-toast'

export default function ProductDetailsPage(){
    const params = useParams()
    const [product, setProduct] = useState(null)
    const [quantity, setQuantity] = useState(1)
    const {addToCart } = useCartStore()

    useEffect(() =>{
        fetchProduct()
    }, [params.id])

    async function fetchProduct() {
        try{
            const {data}  = await apiClient.get(`/products/${params.id}`)
            setProduct(data.data)
        }catch (err) {
            toast.error('Product not found ')
        }finally {
            setLoading(false)
        }
        

        const handleAddToCart = () =>{
            addToCart(product, quantity)
            toast.success(`Added ${quantity} to cart `)
            setQuantity(1)
        }

        if(loading){
            return (
                 <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
            )
        }

        if(!loading) {
            return (
                <div className="text-center py-12">
        <p className="text-red-600">Product not found</p>
      </div>
            )
        }
    }

    const discountedPrice = product.price - (product.price * (product.discountPct / 100))

    return (
         <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm">
          <Link href="/" className="text-primary hover:underline">Home</Link>
          {' / '}
          <Link href="/products" className="text-primary hover:underline">Products</Link>
          {' / '}
          <span className="text-gray-600">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
              <img
                src={product.thumbnail}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.discountPct > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{product.discountPct}%
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 uppercase">{product.category?.name}</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
              <p className="text-gray-600 mt-2">by {product.seller?.storeName}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="text-yellow-400">
                {'⭐'.repeat(Math.round(product.rating))}
              </div>
              <span className="text-gray-600">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  ${discountedPrice.toFixed(2)}
                </span>
                {product.discountPct > 0 && (
                  <span className="text-xl text-gray-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Stock */}
            <div>
              {product.stock > 0 ? (
                <p className="text-green-600 font-semibold">
                  ✓ In Stock ({product.stock} available)
                </p>
              ) : (
                <p className="text-red-600 font-semibold">Out of Stock</p>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{product.longDesc || product.desc}</p>
            </div>

            {/* Add to Cart */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="font-medium">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="px-4 py-1">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  🛒 Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 pt-12">
          <ProductReviews productId={params.id} />
        </div>

        {/* Recommendations */}
        <div className="mt-16 pt-12 border-t border-gray-200 space-y-12">
          <Recommendations productId={params.id} type="frequently-bought" />
          <Recommendations productId={params.id} type="similar" />
        </div>
      </div>
    </div>
    )

}