/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import apiClient from '../../../../utils/api'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

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

/* ─── REFUND MODAL ──────────────────────────────────────────────── */
function RefundModal({ isOpen, order, onConfirm, onCancel, loading }) {
  const [refundAmount, setRefundAmount] = useState(order?.total || 0)
  const [reason, setReason] = useState('User cancelled order')
  const [notes, setNotes] = useState('')

  if (!isOpen || !order) return null

  const handleSubmit = () => {
    if (!refundAmount || refundAmount <= 0) {
      toast.error('Please enter a valid refund amount')
      return
    }
    onConfirm(refundAmount, reason, notes)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <h2 className="text-lg font-bold text-gray-900">Process Refund</h2>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Order info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Order Details</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</span>
              <span className="text-sm font-bold text-primary">₹{order.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Refund amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Refund Amount</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
              max={order.total}
              step="0.01"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Max: ₹{order.total.toLocaleString('en-IN')}</p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition text-sm"
            >
              <option>User cancelled order</option>
              <option>Partial refund</option>
              <option>Product defect</option>
              <option>Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Internal Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any internal notes about this refund..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Process Refund
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── RETURN STATUS BADGE ──────────────────────────────────────────── */
function ReturnStatusBadge({ status }) {
  const statusMap = {
    'RETURN_REQUESTED': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🔄 Return Requested' },
    'RETURN_APPROVED': { bg: 'bg-blue-100', text: 'text-blue-800', label: '✓ Approved' },
    'RETURN_REJECTED': { bg: 'bg-red-100', text: 'text-red-800', label: '✗ Rejected' },
    'REFUND_COMPLETED': { bg: 'bg-green-100', text: 'text-green-800', label: '💰 Refunded' },
  }
  
  const config = statusMap[status]
  if (!config) return null
  
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

export default function SellerDashboard() {
  const [dashboard, setDashboard]   = useState(null)
  const [analytics, setAnalytics]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [actionModal, setActionModal] = useState({ isOpen: false, returnId: null, action: null })
  const [refundModal, setRefundModal] = useState({ isOpen: false, order: null })
  const [refundLoading, setRefundLoading] = useState(false)

  useEffect(() => { fetchDashboard() }, [])

  async function fetchDashboard() {
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        apiClient.get('/seller/dashboard'),
        apiClient.get('/seller/analytics'),
      ])
      setDashboard(dashRes.data.data)
      setAnalytics(analyticsRes.data.data)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function handleProcessRefund(orderId, refundAmount, reason, notes) {
    setRefundLoading(true)
    try {
      await apiClient.post(`/seller/orders/${orderId}/process-refund`, {
        refundAmount,
        reason,
        notes
      })
      toast.success('Refund processed successfully')
      setRefundModal({ isOpen: false, order: null })
      fetchDashboard()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process refund')
    } finally {
      setRefundLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400 font-medium">Loading your dashboard…</p>
      </div>
    </div>
  )

  if (!dashboard) return (
    <div className="p-8 text-center text-red-500 text-sm">Failed to load dashboard</div>
  )

  const navItems = [
    { id: 'overview',   label: 'Overview',   icon: '▦' },
    { id: 'products', label: 'Products', icon: '🛍️' },
    { id: 'orders',     label: 'Orders',     icon: '📦' },
    { id: 'cancelled',  label: 'Cancelled',  icon: '❌' },
    { id: 'inventory',  label: 'Inventory',  icon: '🗂' },
    { id: 'returns',    label: 'Returns',    icon: '🔄' },
    { id: 'analytics',  label: 'Analytics',  icon: '📊' },
    { id: 'reviews',    label: 'Reviews',    icon: '💬' },
  ]

  return (
    <div className="flex min-h-screen bg-white font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            sell<span className="text-primary">hub</span>
          </span>
        </div>

        {/* Store chip */}
        <div className="mx-3 mt-3 bg-blue-50 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
            {dashboard.store.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{dashboard.store.name}</p>
            <p className="text-[11px] text-primary font-medium">
              ⭐ {dashboard.store.rating.toFixed(1)} · {dashboard.store.totalProducts} products
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          <p className="text-[10px] font-semibold tracking-widest text-gray-300 uppercase px-2 pb-1">Main</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                activeSection === item.id
                  ? 'bg-blue-50 text-primary'
                  : 'text-gray-500 hover:bg-blue-50 hover:text-primary'
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-semibold text-primary">
              S
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-900">Seller</p>
              <p className="text-[11px] text-gray-400">Seller Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-7 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-[15px] font-semibold text-gray-900 capitalize">
            {navItems.find(n => n.id === activeSection)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary hover:bg-blue-50 transition-all">
              🔔
            </button>
            <span className="text-[12px] font-medium text-white bg-primary rounded-full px-3 py-1">
              Live
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-7 flex flex-col gap-5 overflow-y-auto">
          {activeSection === 'overview'  && <OverviewSection  dashboard={dashboard} />}
          {activeSection === 'products' && <ProductsSection />}
          {activeSection === 'orders'    && <OrdersSection />}
          {activeSection === 'cancelled' && <CancelledOrdersSection setRefundModal={setRefundModal} />}
          {activeSection === 'inventory' && <InventorySection />}
          {activeSection === 'returns' && <ReturnsSection actionModal={actionModal} setActionModal={setActionModal} fetchDashboard={fetchDashboard} />}
          {activeSection === 'analytics' && <AnalyticsSection analytics={analytics} />}
          {activeSection === 'reviews'   && <ReviewsSection />}
        </div>
      </div>

      {/* Action Modal */}
      <ConfirmationModal
        isOpen={actionModal.isOpen}
        title={actionModal.action === 'approve' ? 'Approve Return?' : actionModal.action === 'reject' ? 'Reject Return?' : 'Complete Refund?'}
        message={
          actionModal.action === 'approve' ? 'Approve this return request. Customer can now ship the item back.' :
          actionModal.action === 'reject' ? 'Reject this return. Customer will be notified.' :
          'Process the refund to customer. This action cannot be undone.'
        }
        onConfirm={() => handleActionConfirm(actionModal)}
        onCancel={() => setActionModal({ isOpen: false, returnId: null, action: null })}
        confirmText={actionModal.action === 'approve' ? 'Approve' : actionModal.action === 'reject' ? 'Reject' : 'Complete Refund'}
        cancelText="Cancel"
        isDanger={actionModal.action === 'reject'}
      />

      {/* Refund Modal */}
      <RefundModal
        isOpen={refundModal.isOpen}
        order={refundModal.order}
        onConfirm={(amount, reason, notes) => handleProcessRefund(refundModal.order.id, amount, reason, notes)}
        onCancel={() => setRefundModal({ isOpen: false, order: null })}
        loading={refundLoading}
      />
    </div>
  )

  async function handleActionConfirm(modal) {
    if (!modal.returnId || !modal.action) return

    try {
      const endpoint = modal.action === 'approve' 
        ? `/seller/returns/${modal.returnId}/approve`
        : modal.action === 'reject'
        ? `/seller/returns/${modal.returnId}/reject`
        : `/seller/returns/${modal.returnId}/complete-refund`

      await apiClient.patch(endpoint, {})
      
      const messages = {
        approve: 'Return approved',
        reject: 'Return rejected',
        refund: 'Refund completed'
      }
      
      toast.success(messages[modal.action])
      setActionModal({ isOpen: false, returnId: null, action: null })
      fetchDashboard()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process return')
    }
  }
}

/* ─── OVERVIEW SECTION ──────────────────────────────────────────── */
function OverviewSection({ dashboard }) {
  const kpis = [
    { label: 'Total Revenue',      value: `₹${Number(dashboard.stats.averageOrderValue).toLocaleString('en-IN')}`,   badge: '+12.4%', up: true,  bg: 'border-l-4 border-primary', icon: '💰' },
    { label: 'Total Orders',       value: dashboard.stats.totalOrders,                      badge: '+8.1%',  up: true,  bg: 'border-l-4 border-accent', icon: '📦' },
    { label: 'Avg. Order Value',   value: `₹${Number(dashboard.stats.averageOrderValue).toLocaleString('en-IN')}`,          badge: '-2.3%',  up: false, bg: 'border-l-4 border-yellow-500', icon: '📊' },
    { label: 'Store Rating',       value: `⭐ ${dashboard.store.rating.toFixed(1)}`,       badge: '+0.2',   up: true,  bg: 'border-l-4 border-green-500', icon: '⭐' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {kpis.map(k => (
          <div key={k.label} className={`bg-white rounded-xl border ${k.bg} p-5 hover:shadow-lg transition`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{k.label}</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight mt-2">{k.value}</p>
              </div>
              <span className="text-2xl">{k.icon}</span>
            </div>
            <p className={`text-[12px] font-medium ${k.up ? 'text-green-600' : 'text-red-500'}`}>
              {k.badge} <span className="text-gray-400 font-normal">vs last month</span>
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
          <p className="text-[13px] font-semibold text-gray-900 mb-1">Monthly Revenue</p>
          <p className="text-[11px] text-gray-400 mb-4">Last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboard.monthlyRevenue} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#ADADB8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#ADADB8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E2E8', boxShadow: 'none' }}
                cursor={{ fill: '#F3F2FF' }}
              />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
          <p className="text-[13px] font-semibold text-gray-900 mb-1">Top Products</p>
          <p className="text-[11px] text-gray-400 mb-4">By sales performance</p>
          <div className="flex flex-col gap-2">
            {dashboard.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 hover:bg-gray-100 transition">
                <span className="text-[11px] font-bold text-gray-300 font-mono w-5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-400">Stock: {p.stock} · Sold: {p.sold}</p>
                </div>
                <span className="text-[13px] font-bold text-primary font-mono">
                  ₹{p.price.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── PRODUCTS SECTION ──────────────────────────────────────────── */
function ProductsSection() {
  const router = useRouter()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Product Management
          </h2>
          <p className="text-sm text-gray-500">
            Add and manage your products
          </p>
        </div>

        <button
          onClick={() => router.push('/pages/products/create')}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
        >
          + Add Product
        </button>
      </div>

      <div className="text-center py-12 text-gray-500">
        Click &quot;Add Product&quot; to create a new product.
      </div>
    </div>
  )
}

/* ─── ORDERS SECTION ──────────────────────────────────────────── */
function OrdersSection() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => { fetchOrders() }, [filter])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = { status: filter !== 'all' ? filter : undefined, cancelled: false }
      const { data } = await apiClient.get('/seller/orders', { params })
      setOrders(data.data)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(orderId, status) {
    try {
      await apiClient.patch(`/seller/orders/${orderId}/status`, { status })
      toast.success('Order updated')
      fetchOrders()
    } catch {
      toast.error('Failed to update order')
    }
  }

  const statuses = ['all', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-gray-900">Active Orders</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Manage and update order statuses</p>
        </div>
        <button className="text-[12px] font-medium text-primary border border-primary px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
          Export
        </button>
      </div>

      {/* Filter pills */}
      <div className="px-6 py-3 border-b border-gray-200 flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all ${
              filter === s
                ? 'bg-primary text-white border-primary'
                : 'text-gray-500 border-gray-200 hover:border-primary hover:text-primary hover:bg-blue-50'
            }`}
          >
            {s === 'all' ? 'All Orders' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading orders…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-[12px] font-semibold text-primary font-mono">
                    {order.orderNumber}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-medium text-gray-900">{order.customer.name}</p>
                    <p className="text-[11px] text-gray-400">{order.customer.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">{order.items.length}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-900 font-mono">
                    ₹{order.total.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-50 text-green-700' :
                      order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700' :
                      order.status === 'PROCESSING' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className="text-[12px] px-2 py-1.5 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-primary transition-all bg-white"
                    >
                      {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── CANCELLED ORDERS SECTION (NEW) ──────────────────────────────────────────── */
function CancelledOrdersSection({ setRefundModal }) {
  const [cancelledOrders, setCancelledOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchCancelledOrders() }, [filter])

  async function fetchCancelledOrders() {
    setLoading(true)
    try {
      const params = { cancelled: true }
      if (filter !== 'all') params.refundStatus = filter
      const { data } = await apiClient.get('/seller/orders', { params })
      setCancelledOrders(data.data)
    } catch (err) {
      toast.error('Failed to load cancelled orders')
      setCancelledOrders([])
    } finally {
      setLoading(false)
    }
  }

  const refundStatuses = ['all', 'PENDING_REFUND', 'REFUND_PROCESSED', 'REFUND_FAILED']

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
        <p className="text-[13px] font-semibold text-gray-900 mb-4">Filter Cancelled Orders</p>
        <div className="flex gap-2 flex-wrap">
          {refundStatuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                filter === status
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-blue-50'
              }`}
            >
              {status === 'all' ? 'All Cancelled' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading cancelled orders…</div>
      ) : cancelledOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center hover:shadow-lg transition">
          <p className="text-gray-500">No cancelled orders in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cancelledOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-gray-900">Order #{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cancelled: {new Date(order.cancelledAt || order.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                    ❌ Cancelled
                  </span>
                  <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    order.refundStatus === 'REFUND_PROCESSED' ? 'bg-green-50 text-green-700' :
                    order.refundStatus === 'REFUND_FAILED' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {order.refundStatus === 'REFUND_PROCESSED' ? '💰 Refunded' :
                     order.refundStatus === 'REFUND_FAILED' ? '❌ Failed' :
                     '⏳ Pending'}
                  </span>
                </div>
              </div>

              {/* Order details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-gray-200 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Customer</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">{order.customer.name}</p>
                  <p className="text-xs text-gray-500">{order.customer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Items</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">{order.items.length} item(s)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Order Amount</p>
                  <p className="text-sm font-bold text-primary mt-1">₹{order.total.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Refunded Amount</p>
                  <p className="text-sm font-bold text-green-600 mt-1">
                    ₹{(order.refundedAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Refund history */}
              {order.refundHistory && order.refundHistory.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Refund History</p>
                  <div className="space-y-1">
                    {order.refundHistory.map((refund, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                        <p className="font-medium text-gray-900">
                          ₹{refund.amount.toLocaleString('en-IN')} - {refund.reason}
                        </p>
                        <p className="text-gray-500">
                          {new Date(refund.processedAt).toLocaleString()} · Status: {refund.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {order.refundStatus === 'PENDING_REFUND' && (
                  <button
                    onClick={() => setRefundModal({ isOpen: true, order })}
                    className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    💰 Process Refund
                  </button>
                )}

                {order.refundStatus === 'REFUND_PROCESSED' && (
                  <button
                    disabled
                    className="px-4 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 cursor-default"
                  >
                    ✓ Refund Processed
                  </button>
                )}

                {order.refundStatus === 'REFUND_FAILED' && (
                  <>
                    <button
                      onClick={() => setRefundModal({ isOpen: true, order })}
                      className="px-4 py-2 text-sm font-medium bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                    >
                      🔄 Retry Refund
                    </button>
                    <button
                      disabled
                      className="px-4 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 cursor-default"
                    >
                      ❌ Refund Failed
                    </button>
                  </>
                )}

                <button className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-blue-50 transition">
                  💬 Contact Customer
                </button>

                <button className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  📋 View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── INVENTORY SECTION ──────────────────────────────────────────── */
function InventorySection() {
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchInventory() }, [])

  async function fetchInventory() {
    try {
      const { data } = await apiClient.get('/inventory')
      setInventory(data.data)
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading inventory…</div>
  if (!inventory) return <div className="text-center py-12 text-red-400">Failed to load inventory</div>

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
      <div className="mb-6">
        <p className="text-[14px] font-semibold text-gray-900">Inventory Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', value: inventory.total, color: 'text-gray-900' },
          { label: 'In Stock', value: inventory.inStock.length, color: 'text-green-600' },
          { label: 'Low Stock', value: inventory.lowStock.length, color: 'text-yellow-600' },
          { label: 'Out of Stock', value: inventory.outOfStock.length, color: 'text-red-500' },
        ].map(k => (
          <div key={k.label} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-100 transition">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── RETURNS SECTION ──────────────────────────────────────────── */
function ReturnsSection({ actionModal, setActionModal, fetchDashboard }) {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchReturns() }, [filter])

  async function fetchReturns() {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const { data } = await apiClient.get('/seller/returns', { params })
      setReturns(data.data || [])
    } catch (err) {
      toast.error('Failed to load returns')
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  function openActionModal(returnId, action) {
    setActionModal({ isOpen: true, returnId, action })
  }

  const filterOptions = ['all', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'REFUND_COMPLETED']

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
        <p className="text-[13px] font-semibold text-gray-900 mb-4">Filter Returns</p>
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map(option => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                filter === option
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-blue-50'
              }`}
            >
              {option === 'all' ? 'All Returns' : option.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Returns list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading returns…</div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center hover:shadow-lg transition">
          <p className="text-gray-500">No returns in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map(ret => (
            <div key={ret.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-gray-900">Order #{ret.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Return requested: {new Date(ret.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ReturnStatusBadge status={ret.status} />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-gray-200 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Reason</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">{ret.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Product</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">{ret.productname}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Refund Amount</p>
                  <p className="text-sm font-bold text-primary mt-1">₹{ret.refundAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Customer</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">{ret.customer.name}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {ret.status === 'RETURN_REQUESTED' && (
                  <>
                    <button
                      onClick={() => openActionModal(ret.id, 'approve')}
                      className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => openActionModal(ret.id, 'reject')}
                      className="px-4 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      ✗ Reject
                    </button>
                  </>
                )}

                {ret.status === 'RETURN_APPROVED' && (
                  <button
                    onClick={() => openActionModal(ret.id, 'refund')}
                    className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition"
                  >
                    💰 Complete Refund
                  </button>
                )}

                {(ret.status === 'RETURN_REJECTED' || ret.status === 'REFUND_COMPLETED') && (
                  <button
                    disabled
                    className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg cursor-default"
                  >
                    {ret.status === 'RETURN_REJECTED' ? '✗ Rejected' : '✓ Refunded'}
                  </button>
                )}

                <button className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-blue-50 transition">
                  💬 Contact Customer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── ANALYTICS SECTION ──────────────────────────────────────────── */
function AnalyticsSection({ analytics }) {
  if (!analytics) return <div className="text-center py-12 text-gray-400 text-sm">No analytics data</div>

  const COLORS = ['#2563eb', '#16a34a', '#d97706', '#ef4444', '#2563eb', '#9333ea']

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Products', value: analytics.products ?? 0 },
          { label: 'Total Views', value: (analytics.views ?? 0).toLocaleString() },
          { label: 'Conversions', value: (analytics.conversions ?? 0).toLocaleString() },
          { label: 'Conversion Rate', value: `${analytics.conversionRate ?? 0}%` },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Status distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
        <p className="text-[13px] font-semibold text-gray-900 mb-1">Order Status Distribution</p>
        <p className="text-[11px] text-gray-400 mb-5">Current breakdown</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(analytics.statusDistribution || {}).map(([status, count], i) => (
            <div key={status} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-100 transition">
              <p className="text-2xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>{count}</p>
              <p className="text-[11px] text-gray-400 capitalize mt-1">{status.toLowerCase()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── REVIEWS SECTION ──────────────────────────────────────────── */
function ReviewsSection() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReviews() }, [])

  async function fetchReviews() {
    try {
      const { data } = await apiClient.get('/seller/reviews')
      setReviews(data.data)
    } catch {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading reviews…</div>

  return (
    <div className="flex flex-col gap-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        {[
          { label: 'Average Rating',    value: '4.8 ⭐', color: 'text-gray-900' },
          { label: '5-Star Reviews',    value: '298',    color: 'text-green-600' },
          { label: 'Pending Response',  value: '7',      color: 'text-red-500' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
            <p className={`text-2xl font-bold tracking-tight ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-[14px] font-semibold text-gray-900">Customer Reviews</p>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No reviews yet</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map(review => (
              <div key={review.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-3">
                  <img
                    src={review.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user.name)}&background=E8E8FF&color=2563EB`}
                    alt={review.user.name}
                    className="w-9 h-9 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-gray-900">{review.user.name}</p>
                      <p className="text-[11px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-amber-400 text-sm mt-0.5">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                    <p className="text-[13px] font-medium text-gray-900 mt-2">{review.title}</p>
                    <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{review.comment}</p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      On: <span className="font-medium text-gray-600">{review.product.name}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}