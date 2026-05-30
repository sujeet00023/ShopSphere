/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import apiClient from "../../utils/api"
import toast from "react-hot-toast"

const STATUS_STEPS = ['PENDING', "CONFIRMED", "PROCESSING", 'SHIPPED', 'DELIVERED']

export default function OrderTracking(){
    const params = useParams()
    const[order, setOrders] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect (() =>{
        fetchOrder()
    }, [params.id])


    async function fetchOrder() {
try{
    const {data} = await apiClient.get(`/orders/${params.id}`)
    setOrders(data.data)
}        catch(err){
    toast.error('Failed to load orders')
}finally{
    setLoading(false)
}
    }

    if(loading){
        return(
            <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
        )
    }

    if(!order){
        return <div className="p-8 text-center text-red-600">Orders not found</div>
    }

    const currentStepIndex = STATUS_STEPS.indexOf(order.status)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
      {/* Order Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Order Number</p>
            <p className="text-2xl font-bold text-gray-900">{order.orderNumber}</p>
            <p className="text-sm text-gray-600 mt-4">Order Date</p>
            <p className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className={`text-lg font-semibold mt-1 ${getStatusTextColor(order.status)}`}>
              {order.status}
            </p>
            <p className="text-sm text-gray-600 mt-4">Payment Status</p>
            <p className={`text-lg font-semibold mt-1 ${
              order.paymentStatus === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {order.paymentStatus}
            </p>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-6">Order Timeline</h2>
        <div className="relative">
          <div className="flex items-start">
            {STATUS_STEPS.map((step, index) => (
              <div key={step} className="flex-1 relative">
                {/* Step Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index <= currentStepIndex
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index <= currentStepIndex ? '✓' : index + 1}
                </div>

                {/* Step Label */}
                <p className={`mt-3 text-center text-sm font-medium ${
                  index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step}
                </p>

                {/* Connector */}
                {index < STATUS_STEPS.length - 1 && (
                  <div className={`absolute top-5 left-1/2 w-1/2 h-0.5 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Order Items</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {order.items.map(item => (
            <div key={item.id} className="p-6 flex gap-4">
              <img
                src={item.product.thumbnail}
                alt={item.product.name}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                <p className="text-sm text-gray-600">Price: ${item.price.toFixed(2)} each</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${item.total.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>${order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>${order.shipping.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-primary">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
        <div className="text-gray-900 space-y-1">
          <p className="font-semibold">{order.shipping.fullName}</p>
          <p>{order.shipping.street}</p>
          <p>{order.shipping.city}, {order.shipping.state} {order.shipping.zipCode}</p>
          <p>{order.shipping.country}</p>
          <p className="text-sm text-gray-600 mt-3">Phone: {order.shipping.phone}</p>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-gray-700 mb-4">Need help with your order?</p>
        <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:opacity-90">
          Contact Support
        </button>
      </div>
    </div>
    )

    function getStatusTextColor(status){
        const colors ={
            PENDING: 'text-yellow-600',
    CONFIRMED: 'text-blue-600',
    PROCESSING: 'text-purple-600',
    SHIPPED: 'text-cyan-600',
    DELIVERED: 'text-green-600',
    CANCELLED: 'text-red-600',
        }
        return colors[status] || 'text-gray-600'
    }
}