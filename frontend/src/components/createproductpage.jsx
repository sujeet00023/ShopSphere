/* eslint-disable react-hooks/immutability */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '../../../../../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function CreateProductPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    desc: '',
    longDesc: '',
    price: '',
    thumbnail: '',
    stock: '',
    categoryId: '',
    discountPct: '0',
  })

  useEffect(() => {
    if (user?.role !== 'SELLER') {
      router.push('/')
      return
    }
    fetchCategories()
  }, [user, router])

  async function fetchCategories() {
    try {
      const { data } = await apiClient.get('/categories')
      setCategories(data.data)
    } catch (err) {
      toast.error('Failed to load categories')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await apiClient.post('/products', {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discountPct: parseFloat(formData.discountPct),
      })

      toast.success('Product created successfully!')
      router.push(`/products/${data.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-white rounded-t-2xl p-8">
          <h1 className="text-3xl md:text-4xl font-bold">Create New Product</h1>
          <p className="text-white/80 mt-2">Add a new product to your store</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl p-8 shadow-lg space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Wireless Headphones"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              required
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Short Description *
            </label>
            <textarea
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              placeholder="Brief description for product listing"
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              required
            />
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Long Description
            </label>
            <textarea
              value={formData.longDesc}
              onChange={(e) => setFormData({ ...formData, longDesc: e.target.value })}
              placeholder="Detailed product description"
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99.99"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                required
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                required
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Discount (%) 
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.discountPct}
                onChange={(e) => setFormData({ ...formData, discountPct: e.target.value })}
                placeholder="10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Product Image URL *
            </label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              required
            />
            {formData.thumbnail && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <img
                  src={formData.thumbnail}
                  alt="Product preview"
                  className="w-full md:w-48 h-48 object-cover rounded-lg border border-gray-200"
                  onError={() => toast.error('Invalid image URL')}
                />
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">💡 Image URL Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use high-quality product images</li>
              <li>Recommended size: 500x500px or larger</li>
              <li>Support: JPG, PNG formats</li>
              <li>Use: <code className="bg-blue-100 px-2 py-1 rounded">https://</code> URLs</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-accent text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating Product...' : '✨ Create Product'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📚 Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Product Name</h4>
              <p className="text-gray-600 text-sm">
                Use a clear, descriptive name that helps customers find your product.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600 text-sm">
                Write compelling descriptions that highlight features and benefits.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Stock Management</h4>
              <p className="text-gray-600 text-sm">
                Keep track of inventory. Low stock alerts will notify you when quantity is running out.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Pricing Strategy</h4>
              <p className="text-gray-600 text-sm">
                Set competitive prices with optional discounts to boost sales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}