'use client'

import Link from 'next/link'
import {useState} from 'react'
import { useCartStore } from '../store/cartStore'
import apiClient from '../utils/api'
import toast from 'react-hot-toast'

export default function ProductGrid({ products =[], loading}){
    const { addToCart } = useCartStore()

   const handleAddToCart = async (product) => {
  try {
    await apiClient.post('/cart', {
      productId: product.id,
      quantity: 1,
    })

    toast.success(`${product.name} added to cart`)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add to cart')
  }
}

    if(loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) =>(
                <div key={i} className='bg-gray-200 rounded-lg h-80 animate-pulse' />
            ))}
            </div>
        )
    }

    if(products.length === 0){
        return (
            <div className="text-center py-16 ">
            <p className='text-gray-500 text-lg'>No Products found</p>
            </div>
        )
    }


    return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => handleAddToCart(product)}
        />
      ))}
    </div>
    )

    function ProductCard({product, onAddToCart }) {
    const discountedPrice = product.price - (product.price * ( product.discountPct / 100 ))

        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
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
        {product.stock < 5 && product.stock > 0 && (
          <div className="absolute bottom-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Low Stock
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <p className="text-white font-bold">Out of Stock</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase font-semibold">
          {product.category?.name}
        </p>

        {/* Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-2 cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">
            {'⭐'.repeat(Math.round(product.rating))}
          </span>
          <span className="text-sm text-gray-600">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            ${discountedPrice.toFixed(2)}
          </span>
          {product.discountPct > 0 && (
            <span className="text-sm text-gray-500 line-through">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Seller */}
        <p className="text-xs text-gray-600">
          by <span className="font-medium">{product.seller?.storeName}</span>
        </p>

        {/* Add to Cart Button */}
        <button
          onClick={() => handleAddToCart(product)}
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
    }
    
}