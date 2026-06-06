'use client'

import { useState } from "react"
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import apiClient from "../../../../utils/api"
import { useAuthStore } from "../../../../store/authStore"
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showAdminCode, setShowAdminCode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    adminCode: '', // For admin registration
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate admin code if registering as admin
      if (formData.role === 'ADMIN') {
        if (!formData.adminCode) {
          toast.error('Admin code is required')
          setLoading(false)
          return
        }
        if (formData.adminCode !== process.env.NEXT_PUBLIC_ADMIN_CODE && formData.adminCode !== 'admin123') {
          toast.error('Invalid admin code')
          setLoading(false)
          return
        }
      }

      const { data } = await apiClient.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      localStorage.setItem('token', data.token)
      login(data.user)

      toast.success(`${formData.role.charAt(0) + formData.role.slice(1).toLowerCase()} account created successfully!`)
      
      // Redirect based on role
      if (formData.role === 'SELLER') {
        router.push('/seller/dashboard')
      } else if (formData.role === 'ADMIN') {
        router.push('/pages/admin/dashboard')
      } else {
        router.push('/')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join ShopSphere and start shopping</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              required
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Account Type *
            </label>
            <select
              value={formData.role}
              onChange={(e) => {
                setFormData({ ...formData, role: e.target.value })
                setShowAdminCode(e.target.value === 'ADMIN')
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
            >
              <option value="CUSTOMER">👤 Customer - Shop Products</option>
              <option value="SELLER">🏪 Seller - Sell Products</option>
              <option value="ADMIN">⚙️ Admin - Manage Platform</option>
            </select>
            <p className="text-xs text-gray-600 mt-2">
              {formData.role === 'CUSTOMER' && 'Browse and purchase products from sellers'}
              {formData.role === 'SELLER' && 'Create and manage your store'}
              {formData.role === 'ADMIN' && 'Manage users, categories, and orders'}
            </p>
          </div>

          {/* Admin Code (Only for Admin) */}
          {showAdminCode && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-800 mb-3">
                Admin registration requires a special code. Contact the platform owner for access.
              </p>
              <input
                type="password"
                value={formData.adminCode}
                onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
                placeholder="Enter admin code"
                className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}