/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient from '../../../../utils/api'
import { useAuthStore } from '../../../../store/authStore'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/* ─── CONFIRMATION MODAL ──────────────────────────────────────────── */
function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, isDanger }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mt-6 ${
          isDanger ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          <span className="text-2xl">{isDanger ? '❌' : '❓'}</span>
        </div>

        <div className="p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition-all text-sm ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                : 'bg-primary hover:opacity-90 active:scale-95'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserDashboardPage() {
  const router = useRouter()
  const { user, logout, hydrated  } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editProfile, setEditProfile] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [cancelModal, setCancelModal] = useState({ isOpen: false, orderId: null, orderNumber: '' })

  useEffect(() => {
    if (!hydrated) return

    if (!user) {
      router.push('/pages/auth/login')
      return
    }

    fetchDashboard()
  }, [user, hydrated, router])

  async function fetchDashboard() {
    try {
      const { data } = await apiClient.get('/users/dashboard')
      setDashboard(data.data)
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: data.data?.profile?.phone || '',
      })
    } catch (err) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function handleProfileUpdate(e) {
    e.preventDefault()
    try {
      await apiClient.put('/users/profile', formData)
      toast.success('Profile updated successfully')
      setEditProfile(false)
      fetchDashboard()
    } catch (err) {
      toast.error('Failed to update profile')
    }
  }

  const handleAddToCart = async (e, item) => {
    e.preventDefault()

    try {
      await apiClient.post('/cart', {
        productId: item.productId,
        quantity: 1
      })
      window.dispatchEvent(new Event('cartUpdated'))
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to add to cart'
      )
    }
  }

  const handleRemoveWishlist = async (e, wishlistId) => {
    e.preventDefault()

    try {
      await apiClient.delete(`/users/wishlist/${wishlistId}`)

      setDashboard(prev => ({
        ...prev,
        wishlist: prev.wishlist.filter(
          item => item.id !== wishlistId
        ),
        stats: {
          ...prev.stats,
          wishlistCount: Math.max(
            0,
            prev.stats.wishlistCount - 1
          )
        }
      }))

      toast.success('Removed from wishlist')
    } catch (err) {
      toast.error('Failed to remove item')
    }
  }

  // Cancel order handler
  function openCancelModal(orderId, orderNumber) {
    setCancelModal({ isOpen: true, orderId, orderNumber })
  }

  function closeCancelModal() {
    setCancelModal({ isOpen: false, orderId: null, orderNumber: '' })
  }

  async function handleCancelConfirm() {
    if (!cancelModal.orderId) return

    try {
      await apiClient.patch(`/orders/${cancelModal.orderId}/cancel`, {})
      toast.success('Order cancelled successfully')
      closeCancelModal()
      fetchDashboard()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order')
    }
  }

  // Return request handler
  async function handleReturnRequest(orderId) {
    try {
      await apiClient.post(`/orders/${orderId}/return-request`, {})
      toast.success('Return request submitted')
      fetchDashboard()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request return')
    }
  }

  // Check if order can be cancelled
  const canCancelOrder = (order) => {
    return ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)
  }

  // Check if order can request return (delivered within 7 days)
  const canRequestReturn = (order) => {
    if (order.status !== 'DELIVERED') return false
    if (order.refundStatus && order.refundStatus !== 'NONE') return false
    
    const deliveredDate = new Date(order.deliveredAt || order.updatedAt)
    const currentDate = new Date()
    const daysDiff = Math.floor((currentDate - deliveredDate) / (1000 * 60 * 60 * 24))
    
    return daysDiff <= 7
  }

  // Get refund status badge
  const getRefundStatusBadge = (refundStatus) => {
    const statusMap = {
      'NONE': null,
      'RETURN_REQUESTED': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🔄 Return Requested' },
      'RETURN_APPROVED': { bg: 'bg-blue-100', text: 'text-blue-800', label: '✓ Return Approved' },
      'RETURN_REJECTED': { bg: 'bg-red-100', text: 'text-red-800', label: '✗ Return Rejected' },
      'REFUND_COMPLETED': { bg: 'bg-green-100', text: 'text-green-800', label: '💰 Refund Completed' },
    }
    
    const config = statusMap[refundStatus]
    if (!config) return null
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Sample chart data
  const spendingData = [
    { month: 'Jan', amount: 250 },
    { month: 'Feb', amount: 450 },
    { month: 'Mar', amount: 320 },
    { month: 'Apr', amount: 680 },
    { month: 'May', amount: 540 },
    { month: 'Jun', amount: 890 },
  ]

  return (
    <div className="min-h-screen bg-white">
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={cancelModal.isOpen}
        title="Cancel Order?"
        message={`Are you sure you want to cancel order #${cancelModal.orderNumber}? This action cannot be undone.`}
        onConfirm={handleCancelConfirm}
        onCancel={closeCancelModal}
        confirmText="Cancel Order"
        cancelText="Keep Order"
        isDanger={true}
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Welcome back, {user?.name}!</h1>
              <p className="text-white/80 mt-2">Manage your account and orders</p>
            </div>
            <button
              onClick={() => {
                logout()
                router.push('/')
              }}
              className="bg-white text-primary px-6 py-3 rounded-lg font-bold hover:opacity-90 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          
          {/* Total Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-primary hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Orders</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{dashboard?.stats?.totalOrders || 0}</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">All time purchases</p>
          </div>

          {/* Total Spent */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-accent hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Spent</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  ₹{Number(dashboard?.stats?.totalSpent || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">All purchases combined</p>
          </div>

          {/* Wishlist Items */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Wishlist Items</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{dashboard?.stats?.wishlistCount || 0}</p>
              </div>
              <div className="text-3xl">❤️</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Saved for later</p>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Pending Orders</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{dashboard?.stats?.pendingOrders || 0}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">In progress</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {['overview', 'orders', 'wishlist', 'addresses', 'profile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-semibold capitalize transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'orders' && '📦 Orders'}
              {tab === 'wishlist' && '❤️ Wishlist'}
              {tab === 'addresses' && '🏠 Addresses'}
              {tab === 'profile' && '👤 Profile'}
            </button>
          ))}
        </div>

        {/* TAB: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Spending Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Spending Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                <Link href="/orders" className="text-primary hover:underline font-semibold">
                  View all →
                </Link>
              </div>
              
              {dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Order ID</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Date</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Amount</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentOrders.map(order => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-4 px-4 font-semibold text-primary">#{order.id}</td>
                          <td className="py-4 px-4 text-gray-700">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 font-bold text-gray-900">₹{Number(order.total).toLocaleString('en-IN')}</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Link 
                              href={`/pages/orders/${order.id}`}
                              className="text-primary hover:underline font-semibold text-sm"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <Link href="/products" className="text-primary hover:underline font-semibold">
                    Start shopping →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>
            
            {dashboard?.orders && dashboard.orders.length > 0 ? (
              <div className="space-y-4">
                {dashboard.orders.map(order => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-primary hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{Number(order.total).toLocaleString('en-IN')}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Refund status if exists */}
                    {order.refundStatus && order.refundStatus !== 'NONE' && (
                      <div className="mb-4 pb-4 border-b border-gray-100">
                        <p className="text-xs text-gray-600 font-semibold mb-2">Return & Refund Status</p>
                        {getRefundStatusBadge(order.refundStatus)}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Link 
                        href={`/pages/orders/${order.id}`}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:opacity-90 transition"
                      >
                        View Details
                      </Link>

                      {/* Cancel button */}
                      {canCancelOrder(order) && (
                        <button
                          onClick={() => openCancelModal(order.id, order.id)}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition"
                        >
                          🚫 Cancel Order
                        </button>
                      )}

                      {/* Return request button */}
                      {canRequestReturn(order) && !['RETURN_REQUESTED', 'RETURN_APPROVED', 'REFUND_COMPLETED'].includes(order.refundStatus) && (
                        <button
                          onClick={() => handleReturnRequest(order.id)}
                          className="px-4 py-2 border border-amber-300 text-amber-600 rounded-lg font-semibold text-sm hover:bg-amber-50 transition"
                        >
                          🔄 Request Return
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No orders found</p>
                <Link href="/products" className="text-primary hover:underline font-semibold">
                  Browse products →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB: Wishlist */}
        {activeTab === 'wishlist' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>
            
            {dashboard?.wishlist && dashboard.wishlist.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboard.wishlist.map(item => (
                  <Link
                    key={item.id}
                    href={`/products/${item.productId}`}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition group"
                  >
                    <div className="w-full h-40 bg-gray-100 overflow-hidden">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 line-clamp-2">{item.productName}</p>
                      <p className="text-primary font-bold mt-2">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          minimumFractionDigits: 0,
                        }).format(item.price)}
                      </p>
                      <button
                        onClick={(e) => handleAddToCart(e, item)}
                        className="w-full mt-4 bg-primary text-white py-2 rounded font-semibold hover:opacity-90 transition"
                      >
                        Add to Cart
                      </button>

                      <button
                        onClick={(e) => handleRemoveWishlist(e, item.id)}
                        className="w-full mt-2 border border-red-500 text-red-500 py-2 rounded font-semibold hover:bg-red-50 transition"
                      >
                        Remove Wishlist
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                <Link href="/products" className="text-primary hover:underline font-semibold">
                  Add items →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB: Addresses */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
              <button className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition">
                + Add Address
              </button>
            </div>
            
            {dashboard?.addresses && dashboard.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboard.addresses.map(address => (
                  <div key={address.id} className="border border-gray-200 rounded-lg p-6 hover:border-primary transition">
                    <h3 className="font-bold text-gray-900 mb-3">{address.label || 'Home'}</h3>
                    <p className="text-gray-700 text-sm">{address.address}</p>
                    <p className="text-gray-700 text-sm">{address.city}, {address.state} {address.zipCode}</p>
                    <p className="text-gray-700 text-sm">{address.country}</p>
                    <p className="text-gray-700 text-sm font-semibold mt-3">{address.phone}</p>
                    <div className="flex gap-3 mt-4">
                      <button className="text-primary hover:underline font-semibold text-sm">Edit</button>
                      <button className="text-red-600 hover:underline font-semibold text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No saved addresses</p>
                <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition">
                  + Add Your First Address
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
            
            {editProfile ? (
              <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditProfile(false)}
                    className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 max-w-2xl">
                
                {/* Name */}
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-gray-600 text-sm">Full Name</p>
                  <p className="text-gray-900 font-semibold text-lg mt-1">{user?.name}</p>
                </div>

                {/* Email */}
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-gray-600 text-sm">Email Address</p>
                  <p className="text-gray-900 font-semibold text-lg mt-1">{user?.email}</p>
                </div>

                {/* Phone */}
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-gray-600 text-sm">Phone Number</p>
                  <p className="text-gray-900 font-semibold text-lg mt-1">
                    {dashboard?.profile?.phone || 'Not set'}
                  </p>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => setEditProfile(true)}
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}