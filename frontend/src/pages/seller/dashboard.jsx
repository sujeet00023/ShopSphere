/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState } from 'react'
import apiClient from '../../utils/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export default function SellerDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        apiClient.get('/seller/dashboard'),
        apiClient.get('/seller/analytics'),
      ])
      setDashboard(dashRes.data.data)
      setAnalytics(analyticsRes.data.data)
    } catch (err) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return <div className="p-8 text-center text-red-600">Failed to load dashboard</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold">{dashboard.store.name}</h1>
        <p className="mt-2 opacity-90">{dashboard.store.description}</p>
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-sm opacity-75">Rating</p>
            <p className="text-2xl font-bold">⭐ {dashboard.store.rating.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Products</p>
            <p className="text-2xl font-bold">{dashboard.store.totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Orders"
          value={dashboard.stats.totalOrders}
          icon="📦"
          color="from-blue-50 to-blue-100"
        />
        <StatCard
          title="Total Revenue"
          value={`$${dashboard.stats.totalRevenue.toFixed(2)}`}
          icon="💰"
          color="from-green-50 to-green-100"
        />
        <StatCard
          title="Average Order Value"
          value={`$${dashboard.stats.averageOrderValue}`}
          icon="📊"
          color="from-purple-50 to-purple-100"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['overview', 'orders', 'analytics', 'reviews'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboard.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Top Products</h2>
            <div className="space-y-3">
              {dashboard.topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{idx + 1}. {product.name}</div>
                    <div className="text-xs text-gray-500">Stock: {product.stock} • Sold: {product.sold}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">${product.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <OrdersSection />
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Total Products"
              value={analytics.products}
              icon="📦"
            />
            <AnalyticsCard
              title="Total Views"
              value={analytics.views}
              icon="👁️"
            />
            <AnalyticsCard
              title="Conversions"
              value={analytics.conversions}
              icon="✅"
            />
            <AnalyticsCard
              title="Conversion Rate"
              value={`${analytics.conversionRate}%`}
              icon="📈"
            />
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Order Status Distribution</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(analytics.statusDistribution).map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded">
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <ReviewsSection />
      )}
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-lg border border-gray-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

function AnalyticsCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  )
}

function OrdersSection() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  async function fetchOrders() {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const { data } = await apiClient.get('/seller/orders', { params })
      setOrders(data.data)
    } catch (err) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(orderId, newStatus) {
    try {
      await apiClient.patch(`/seller/orders/${orderId}/status`, { status: newStatus })
      toast.success('Order updated')
      fetchOrders()
    } catch (err) {
      toast.error('Failed to update order')
    }
  }

  if (loading) return <div className="text-center py-12">Loading orders...</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['all', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'all' ? 'All Orders' : status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Items</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-primary">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{order.customer.name}</div>
                    <div className="text-xs text-gray-500">{order.customer.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} items</td>
                  <td className="px-6 py-4 text-sm font-semibold">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ReviewsSection() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    try {
      const { data } = await apiClient.get('/seller/reviews')
      setReviews(data.data)
    } catch (err) {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading reviews...</div>

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={review.user.avatar || `https://ui-avatars.com/api/?name=${review.user.name}`}
                  alt={review.user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{review.user.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">{'⭐'.repeat(review.rating)}</span>
                    <span className="text-gray-500 text-sm">{review.rating} stars</span>
                  </div>
                </div>
              </div>
              <p className="font-semibold text-gray-900 mb-2">{review.title}</p>
              <p className="text-gray-600 text-sm mb-3">{review.comment}</p>
              <p className="text-xs text-gray-500">
                On product: <span className="font-medium">{review.product.name}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}

      {reviews.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No reviews yet
        </div>
      )}
    </div>
  )
}

function getStatusColor(status) {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-cyan-100 text-cyan-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
