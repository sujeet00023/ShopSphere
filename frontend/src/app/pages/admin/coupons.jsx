'use client'

import { useEffect, useState } from "react"
import apiClient from "../../../utils/api"
import toast from "react-hot-toast"

export default function CouponManagement(){
    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(ture)
    const [showForm, setShowForm] = useState(false)
    const [formData, setformData] = useState({
        code: '',
        discountValue: 'PERCENTAGE',
        minOrderValue: 10,
        maxUses: null,
        expireAt: '',
    })

    useEffect(() =>{
        fetchCoupons()
    }, [])

    async function fetchCoupons() {
        try{
            const {data} = await apiClient.get('/coupons')
            setCoupons(data.data)

        }catch(err) {
            toast.error('Failed to load coupons')
        }finally {
            setLoading(false)
        }
        
    }

    async function handleSubmit(e) {
        e.preventDefault()
        try{
            await apiClient.post ('/coupons', formData)
            toast.success('coupons created')
            setformData({
                code: '',
                discountType:'PERCENTAGE',
                discountValue:10,
                discountType: 0,
                maxUser: null,
                expireAt: '',
            })
            setShowForm(false)
            fetchCoupons()
        }catch (err){
            toast.error(err.response?.data?.message || 'Failed to create coupon')

        }
        
    }

    async function deleteCoupon(id) {
        if(!confirm('Delete this coupon?')) return
        try {
            await apiClient.delete(`/coupons/${id}`)
            toast.success('Coupon delete')
        }catch(err){
            toast.error('Failed to delete coupon')
        }
    }
    if(loading) return <div className="text-center py-12">Loading....</div>

    return(
        <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          + Create Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Coupon Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER2026"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Discount Value</label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                placeholder="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Min Order Value ($)</label>
              <input
                type="number"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) })}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Uses</label>
              <input
                type="number"
                value={formData.maxUses || ''}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Unlimited"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Expires At</label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:opacity-90">
              Create Coupon
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Discount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Min Order</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Used / Max</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Expires</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.map(coupon => (
              <tr key={coupon.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-primary">{coupon.code}</td>
                <td className="px-6 py-4">
                  {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                </td>
                <td className="px-6 py-4">${coupon.minOrderValue}</td>
                <td className="px-6 py-4">
                  {coupon.usedCount} / {coupon.maxUses || '∞'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => deleteCoupon(coupon.id)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {coupons.length === 0 && <div className="text-center py-12 text-gray-500">No coupons yet</div>}
    </div>
    )
}