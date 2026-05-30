'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import apiClient from '../../utils/api'
import {LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Cell } from  'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2']


export default function AdminDashBoard(){
    const {user} = useAuthStore()
    const [dashboard, setDashboard] = useState(null)
    const [loading, setLoading] = useState(true)
    const[activeTab, setActiveTab] = useState('overview')


    useEffect(() =>{
        fetchDashboard()
    }, [])

    async function FetchDashboard() {
        try{
            const {data} = await apiClient.get('/admin/dashboard')
            setDashboard(data.data)

        }catch (err) {
            toast.error('Failed to load dashboard ')
        }finally {
            setLoading(false)
        }
        
    }

    if(loading){
        return (
            <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
        )
    }

    if(!loading){
        return <div className="p-8 text-center text-red-600">Failed to load dashboard</div>
    }

    return (
        <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={dashboard.stats.totalUsers}
          icon="👥"
          color="from-blue-50 to-blue-100"
        />
        <StatCard
          title="Total Sellers"
          value={dashboard.stats.totalSellers}
          icon="🏪"
          color="from-purple-50 to-purple-100"
        />
        <StatCard
          title="Total Orders"
          value={dashboard.stats.totalOrders}
          icon="📦"
          color="from-green-50 to-green-100"
        />
        <StatCard
          title="Total Revenue"
          value={`$${dashboard.stats.totalRevenue.toFixed(2)}`}
          icon="💰"
          color="from-amber-50 to-amber-100"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['overview', 'orders', 'sellers', 'users'].map(tab => (
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
              <LineChart data={dashboard.revenueByMonth}>
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
            <h2 className="text-lg font-semibold mb-4">Top 5 Products</h2>
            <div className="space-y-3">
              {dashboard.topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{idx + 1}. {product.name}</div>
                    <div className="text-xs text-gray-500">${product.price} • {product.sold} sold</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{product.rating}⭐</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <RecentOrdersSection orders={dashboard.recentOrders} />
      )}

      {activeTab === 'sellers' && (
        <SellersSection />
      )}

      {activeTab === 'users' && (
        <UsersSection />
      )}
    </div>
    )
}

function StatCard({title, value, icon, color }){
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

function RecentOrdersSection({orders}){
    return(
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Order</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Items</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-primary">{order.orderNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{order.customer.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} items</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    )
}

function SellersSection(){
    const [seller, setSellers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() =>{
        async function fetchSeller() {
            try{
                const {data} = await apiClient.get('/admin/seller')
                setSellers(data.data)
            }catch (err){
                toast.error('Failed to load seller')
            }finally{
                setLoading(false)
            }
            
        }
        fetchSeller()
    }, [])


    if(loading) return <div className='text-center py-12'>Loading seller...</div>

    return(
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold">All Sellers</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Store</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Products</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sellers.map(seller => (
              <tr key={seller.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{seller.storeName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{seller.user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{seller._count.products}</td>
                <td className="px-6 py-4 text-sm font-semibold text-primary">${seller.totalEarnings.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">⭐ {seller.rating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    )
}

function UsersSection(){
    const[users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)


    useEffect(() =>{
        async function fetchUser() {
            try{
                const {data} = await apiClient.get('/admin/users')
                setUsers(data.data)
            }catch(err){
                toast.error('Failed to load users')
            }finally {
                setLoading(false)
            }
            
        }
        fetchUsers()
    }, [])

    if(loading) return <div className='text-center py-12'>Loading users</div>

    return(
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold">All Users</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user._count.orders}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    )
}

function getStatusColor(status){
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