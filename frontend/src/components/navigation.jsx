/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { useRouter } from 'next/navigation'

export default function Navigation(){
    const router = useRouter()
    const {user, logout } = useAuthStore()
    const {items} = useCartStore()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [dropdownOpen, setDropDownOpen] = useState(false)

    const cartCount = items.length

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [router])

    const handleLogout = () =>{
        logout()
        setDropDownOpen(false)
        setMobileMenuOpen(false)
        router.push('/pages/auth/login')
    }

    return (
        <nav  className="bg-white border-b border-gray-200 sticky top-0 z-40"> 
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              🛍️
            </div>
            <span className="font-bold text-xl hidden sm:inline text-gray-900">ShopSphere</span>
          </Link>
        

        {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/pages/products" className="text-gray-700 hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary transition-colors">
              Contact
            </Link>
          </div>


           <div className="flex items-center gap-4">
            {/* Cart */}
            <Link
              href="/pages/cart"
              className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

 {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropDownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-900">{user.name}</span>
                </button>


                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-2 z-50">
                    <p className="px-4 py-2 text-xs text-gray-600 border-b border-gray-200">
                      {user.email}
                    </p>

                    <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      👤 Profile
                    </Link>

                    {user.role === 'SELLER' && (
                      <Link href="/pages/seller/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                        🏪 Seller Dashboard
                      </Link>
                    )}

                    {user.role === 'ADMIN' && (
                      <Link href="/pages/admin/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                        ⚙️ Admin Dashboard
                      </Link>
                    )}

                    <Link href="/pages/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      📦 My Orders
                    </Link>

                    <Link href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      ⚙️ Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 border-t border-gray-200"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/pages/auth/login"
                  className="hidden sm:block px-4 py-2 text-primary font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/pages/auth/register"
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Join
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <Link
              href="/pages/products"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Products
            </Link>
            <Link
              href="/about"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Contact
            </Link>
            {!user && (
              <Link
                href="/pages/auth/login"
                className="block px-4 py-2 text-primary font-medium hover:bg-blue-50 rounded-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
        </nav>
    )

    

    
}