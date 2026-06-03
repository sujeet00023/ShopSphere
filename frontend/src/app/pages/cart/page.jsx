'use client'

import Link from "next/link"
import { useCartStore } from "../../../store/cartStore"
import { useAuthStore } from "../../../store/authStore"
import { useRouter } from 'next/navigation'


export default function CartPage() {
    const router = useRouter()
    const {user} = useAuthStore()
    const {items, removeFromCart, updateQuantity, clearCart, getTotals} = useCartStore()
    const {subtotal, tax, total } = getTotals()

    if(items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <Link
              href="pages/products"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-bold hover:opacity-90"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
        )
    }


    return (
        <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {items.map(item => (
                  <div key={item.id} className="p-6 flex gap-6 hover:bg-gray-50">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded"
                    />

                    <div className="flex-1 space-y-2">
                      <Link
                        href={`/products/${item.id}`}
                        className="font-bold text-gray-900 hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-gray-600">
                        ${item.price.toFixed(2)} each
                      </p>

                      <div className="flex items-center gap-2 text-sm">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="px-3">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <p className="font-bold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/products"
              className="text-primary font-medium hover:underline"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 sticky top-20">
              <h2 className="text-xl font-bold">Order Summary</h2>

              <div className="space-y-2 border-b border-gray-200 pb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>

              <button
                onClick={() => {
                  if (user) {
                    router.push('/pages/checkout')
                  } else {
                    router.push('/pages/auth/login')
                  }
                }}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:opacity-90"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={clearCart}
                className="w-full bg-gray-200 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
}