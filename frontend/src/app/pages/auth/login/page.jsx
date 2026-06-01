'use client'

import { useState } from "react"
import Link from "next/link"
import {useRouter} from 'next/navigation'
import { useAuthStore } from "../../../../store/authStore"
import apiClient from "../../../../utils/api"
import toast from "react-hot-toast"

export default function LoginPage(){
    const router = useRouter()
    const {login} = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

  async function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)

  try {
    await login(
      formData.email,
      formData.password
    )

    toast.success('Login successful')
    router.push('/')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}


    return(
        <div className="min-h-screen bg-gradient-to-br from-primary to-accent flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your ShopSphere account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary font-bold hover:underline">
              Create one now
            </Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-bold text-blue-900 mb-2">Demo Accounts:</p>
          <p className="text-blue-800">Customer: customer@example.com / password123</p>
          <p className="text-blue-800">Seller: seller1@example.com / password123</p>
          <p className="text-blue-800">Admin: admin@example.com / password123</p>
        </div>
      </div>
    </div>
    )
}

