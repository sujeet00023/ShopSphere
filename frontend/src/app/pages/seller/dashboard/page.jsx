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

/* ─────────────────────────────────────────
   SELLER DASHBOARD (root)
───────────────────────────────────────── */
export default function SellerDashboard() {
  const [dashboard, setDashboard]   = useState(null)
  const [analytics, setAnalytics]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [activeSection, setActiveSection] = useState('overview')

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7F7FA]">
      <div className="text-center">
        <div className="w-10 h-10 border-[3px] border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
    { id: 'inventory',  label: 'Inventory',  icon: '🗂' },
    { id: 'analytics',  label: 'Analytics',  icon: '📊' },
    { id: 'reviews',    label: 'Reviews',    icon: '💬' },
  ]

  return (
    <div className="flex min-h-screen bg-[#F7F7FA] font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            sell<span className="text-[#6C63FF]">hub</span>
          </span>
        </div>

        {/* Store chip */}
        <div className="mx-3 mt-3 bg-[#F3F2FF] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#A78BFA] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {dashboard.store.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{dashboard.store.name}</p>
            <p className="text-[11px] text-[#6C63FF] font-medium">
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
                  ? 'bg-[#F3F2FF] text-[#6C63FF]'
                  : 'text-gray-500 hover:bg-[#F3F2FF] hover:text-[#6C63FF]'
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
            <div className="w-8 h-8 rounded-full bg-[#F0EFFE] flex items-center justify-center text-xs font-semibold text-[#6C63FF]">
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
            <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#6C63FF] hover:border-[#C4C0FF] hover:bg-[#F3F2FF] transition-all">
              🔔
            </button>
            <span className="text-[12px] font-medium text-white bg-[#6C63FF] rounded-full px-3 py-1">
              Live
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-7 flex flex-col gap-5">
          {activeSection === 'overview'  && <OverviewSection  dashboard={dashboard} />}
          {activeSection === 'products' && <ProductsSection />}
          {activeSection === 'orders'    && <OrdersSection />}
          {activeSection === 'inventory' && <InventorySection />}
          {activeSection === 'analytics' && <AnalyticsSection analytics={analytics} />}
          {activeSection === 'reviews'   && <ReviewsSection />}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   OVERVIEW
───────────────────────────────────────── */
function OverviewSection({ dashboard }) {
  const kpis = [
    { label: 'Total Revenue',      value: `$${dashboard.stats.totalRevenue.toFixed(2)}`,   badge: '+12.4%', up: true,  bg: 'bg-[#F3F2FF]', text: 'text-[#6C63FF]' },
    { label: 'Total Orders',       value: dashboard.stats.totalOrders,                      badge: '+8.1%',  up: true,  bg: 'bg-[#EDFBF0]', text: 'text-[#16A34A]' },
    { label: 'Avg. Order Value',   value: `$${dashboard.stats.averageOrderValue}`,          badge: '-2.3%',  up: false, bg: 'bg-[#FEF9EC]', text: 'text-[#D97706]' },
    { label: 'Store Rating',       value: `⭐ ${dashboard.store.rating.toFixed(1)}`,       badge: '+0.2',   up: true,  bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{k.value}</p>
            <p className={`text-[12px] font-medium mt-1.5 ${k.up ? 'text-green-600' : 'text-red-500'}`}>
              {k.badge} <span className="text-gray-400 font-normal">vs last month</span>
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[13px] font-semibold text-gray-900 mb-1">Monthly Revenue</p>
          <p className="text-[11px] text-gray-400 mb-4">Last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboard.monthlyRevenue} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#ADADB8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#ADADB8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E2E8', boxShadow: 'none' }}
                cursor={{ fill: '#F3F2FF' }}
              />
              <Bar dataKey="revenue" fill="#6C63FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[13px] font-semibold text-gray-900 mb-1">Top Products</p>
          <p className="text-[11px] text-gray-400 mb-4">By sales performance</p>
          <div className="flex flex-col gap-2">
            {dashboard.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                <span className="text-[11px] font-bold text-gray-300 font-mono w-5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-400">Stock: {p.stock} · Sold: {p.sold}</p>
                </div>
                <span className="text-[13px] font-bold text-[#6C63FF] font-mono">${p.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   ORDERS
───────────────────────────────────────── */
function OrdersSection() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => { fetchOrders() }, [filter])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
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
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-gray-900">All Orders</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Manage and update order statuses</p>
        </div>
        <button className="text-[12px] font-medium text-[#6C63FF] border border-[#C4C0FF] px-3 py-1.5 rounded-lg hover:bg-[#F3F2FF] transition-all">
          Export
        </button>
      </div>

      {/* Filter pills */}
      <div className="px-6 py-3 border-b border-gray-100 flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all ${
              filter === s
                ? 'bg-[#6C63FF] text-white border-[#6C63FF]'
                : 'text-gray-500 border-gray-200 hover:border-[#C4C0FF] hover:text-[#6C63FF] hover:bg-[#F3F2FF]'
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
              <tr className="border-b border-gray-100">
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-[12px] font-semibold text-[#6C63FF] font-mono">
                    {order.orderNumber}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-medium text-gray-900">{order.customer.name}</p>
                    <p className="text-[11px] text-gray-400">{order.customer.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">{order.items.length}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-900 font-mono">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <OrderStatusPill status={order.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className="text-[12px] px-2 py-1.5 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#6C63FF] transition-all bg-white"
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

function OrderStatusPill({ status }) {
  const map = {
    PENDING:    'bg-amber-50 text-amber-700',
    CONFIRMED:  'bg-blue-50 text-blue-700',
    PROCESSING: 'bg-purple-50 text-purple-700',
    SHIPPED:    'bg-teal-50 text-teal-700',
    DELIVERED:  'bg-green-50 text-green-700',
    CANCELLED:  'bg-red-50 text-red-700',
  }
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

/* ─────────────────────────────────────────
   INVENTORY
───────────────────────────────────────── */
function InventorySection() {
  const [inventory, setInventory] = useState(null)
  const [alerts, setAlerts]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingId, setEditingId] = useState(null)
  const [newStock, setNewStock]   = useState('')

  useEffect(() => { fetchInventory() }, [])

  async function fetchInventory() {
    try {
      const [invRes, alertRes] = await Promise.all([
        apiClient.get('/inventory'),
        apiClient.get('/inventory/alerts'),
      ])
      setInventory(invRes.data.data)
      setAlerts(alertRef.data.data)
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  async function updateStock(productId, stock) {
    try {
      await apiClient.patch(`/inventory/${productId}`, { stock: parseInt(stock) })
      toast.success('Stock updated')
      setEditingId(null)
      fetchInventory()
    } catch {
      toast.error('Failed to update stock')
    }
  }

  if (loading) return (
    <div className="text-center py-12 text-gray-400 text-sm">Loading inventory…</div>
  )

  const tabs = [
    { id: 'overview',    label: 'Overview' },
    { id: 'products', label: 'Products', icon: '🛍️' },
    { id: 'inStock',     label: 'In Stock' },
    { id: 'lowStock',    label: 'Low Stock' },
    { id: 'outOfStock',  label: 'Out of Stock' },
    { id: 'alerts',      label: 'Alerts' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      {inventory && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[
            { label: 'Total Products', value: inventory.total,              color: 'text-gray-900' },
            { label: 'In Stock',       value: inventory.inStock.length,     color: 'text-green-600' },
            { label: 'Low Stock',      value: inventory.lowStock.length,    color: 'text-amber-600' },
            { label: 'Out of Stock',   value: inventory.outOfStock.length,  color: 'text-red-500' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
              <p className={`text-3xl font-bold tracking-tight ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alert strip */}
      {alerts && (
        <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-5 py-3">
          <p className="text-[12px] font-medium text-red-700">
            🔔 Stock alerts require your attention
          </p>
          <div className="flex gap-2">
            <span className="text-[11px] font-semibold bg-red-500 text-white rounded-full px-2.5 py-0.5">
              {alerts.critical} Critical
            </span>
            <span className="text-[11px] font-semibold bg-amber-500 text-white rounded-full px-2.5 py-0.5">
              {alerts.high} High
            </span>
          </div>
        </div>
      )}

      {/* Tabbed card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-[14px] font-semibold text-gray-900">Inventory Management</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Click Edit to update stock levels</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 px-3 text-[13px] font-medium border-b-2 mr-1 transition-all ${
                activeTab === t.id
                  ? 'border-[#6C63FF] text-[#6C63FF]'
                  : 'border-transparent text-gray-400 hover:text-[#6C63FF]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && inventory && (
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total',        value: inventory.total,             color: 'text-gray-900' },
              { label: 'In Stock',     value: inventory.inStock.length,    color: 'text-green-600' },
              { label: 'Low Stock',    value: inventory.lowStock.length,   color: 'text-amber-600' },
              { label: 'Out of Stock', value: inventory.outOfStock.length, color: 'text-red-500' },
            ].map(k => (
              <div key={k.label} className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-center">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[11px] text-gray-400 mt-1">{k.label}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'inStock'    && inventory && (
          <InventoryTable
            products={inventory.inStock}
            editingId={editingId} newStock={newStock}
            onEdit={(id, cur) => { setEditingId(id); setNewStock(cur) }}
            onStockChange={setNewStock}
            onSave={id => updateStock(id, newStock)}
            onCancel={() => setEditingId(null)}
          />
        )}

        {activeTab === 'lowStock'   && inventory && (
          <InventoryTable
            products={inventory.lowStock}
            editingId={editingId} newStock={newStock}
            onEdit={(id, cur) => { setEditingId(id); setNewStock(cur) }}
            onStockChange={setNewStock}
            onSave={id => updateStock(id, newStock)}
            onCancel={() => setEditingId(null)}
          />
        )}

        {activeTab === 'outOfStock' && inventory && (
          <InventoryTable
            products={inventory.outOfStock}
            editingId={editingId} newStock={newStock}
            onEdit={(id, cur) => { setEditingId(id); setNewStock(cur) }}
            onStockChange={setNewStock}
            onSave={id => updateStock(id, newStock)}
            onCancel={() => setEditingId(null)}
          />
        )}

        {activeTab === 'alerts' && alerts && (
          <div className="p-5 flex flex-col gap-2.5">
            {alerts.alerts.map(alert => (
              <div
                key={alert.productId}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                  alert.urgency === 'CRITICAL'
                    ? 'bg-red-50 border-red-100'
                    : alert.urgency === 'HIGH'
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-orange-50 border-orange-100'
                }`}
              >
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">{alert.productName}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Current stock: <span className="font-bold">{alert.currentStock}</span>
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full text-white ${
                  alert.urgency === 'CRITICAL' ? 'bg-red-500'
                  : alert.urgency === 'HIGH'   ? 'bg-amber-500'
                  : 'bg-orange-500'
                }`}>
                  {alert.urgency}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InventoryTable({ products, editingId, newStock, onEdit, onStockChange, onSave, onCancel }) {
  function stockPillClass(stock) {
    if (stock === 0)   return 'bg-red-50 text-red-700'
    if (stock <= 10)   return 'bg-amber-50 text-amber-700'
    return 'bg-green-50 text-green-700'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {['Product', 'Price', 'Stock', 'Sold', 'Views', 'Action'].map(h => (
              <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map(product => (
            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 text-[13px] font-medium text-gray-900">{product.name}</td>
              <td className="px-5 py-3.5 text-[12px] font-mono text-gray-700">${product.price.toFixed(2)}</td>
              <td className="px-5 py-3.5">
                {editingId === product.id ? (
                  <input
                    type="number"
                    value={newStock}
                    onChange={e => onStockChange(e.target.value)}
                    autoFocus
                    className="w-20 px-2 py-1 text-[12px] border border-[#C4C0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 font-mono"
                  />
                ) : (
                  <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full ${stockPillClass(product.stock)}`}>
                    {product.stock === 0 ? 'Out' : product.stock}
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5 text-[13px] text-gray-600">{product.sold}</td>
              <td className="px-5 py-3.5 text-[13px] text-gray-600">{product.views}</td>
              <td className="px-5 py-3.5">
                {editingId === product.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSave(product.id)}
                      className="text-[12px] font-semibold text-green-600 hover:text-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={onCancel}
                      className="text-[12px] font-medium text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onEdit(product.id, product.stock)}
                    className="text-[12px] font-semibold text-[#6C63FF] hover:text-[#5148E8]"
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─────────────────────────────────────────
   ANALYTICS
───────────────────────────────────────── */
function AnalyticsSection({ analytics }) {
  if (!analytics) return <div className="text-center py-12 text-gray-400 text-sm">No analytics data</div>

  const COLORS = ['#6C63FF', '#16A34A', '#D97706', '#EF4444', '#2563EB', '#9333EA']

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          [
  { label: 'Total Products', value: analytics.products ?? 0 },

  { label: 'Total Views', value: (analytics.views ?? 0).toLocaleString() },
  { label: 'Conversions', value: (analytics.conversions ?? 0).toLocaleString() },
  { label: 'Conversion Rate', value: `${analytics.conversionRate ?? 0}%` },
]
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Status distribution */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-[13px] font-semibold text-gray-900 mb-1">Order Status Distribution</p>
        <p className="text-[11px] text-gray-400 mb-5">Current breakdown</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(analytics.statusDistribution).map(([status, count], i) => (
            <div key={status} className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>{count}</p>
              <p className="text-[11px] text-gray-400 capitalize mt-1">{status.toLowerCase()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   REVIEWS
───────────────────────────────────────── */
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
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
            <p className={`text-2xl font-bold tracking-tight ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-[14px] font-semibold text-gray-900">Customer Reviews</p>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No reviews yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reviews.map(review => (
              <div key={review.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <img
                    src={review.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user.name)}&background=F0EFFE&color=6C63FF`}
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

/* ─────────────────────────────────────────
   PRODUCTS
───────────────────────────────────────── */
function ProductsSection() {
  const router = useRouter()

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
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
          className="bg-[#6C63FF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#584ff5] transition"
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