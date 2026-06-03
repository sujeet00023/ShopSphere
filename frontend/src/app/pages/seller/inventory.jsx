'use client'

import { useEffect, useState } from "react"
import apiClient from "../../../utils/api"
import toast  from "react-hot-toast"

export default function InventoryManagement(){
    const [inventory, setInventory] = useState(null)
    const [alerts, setAlerts] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [editingProduct, setEditingProduct] = useState(null)

    const [newStock, setNewStock] = useState('')

    useEffect(() =>{
        fetchInventory()
    }, [])

    async function fetchInventory() {
        try{
            const [invRes, alertRes] = await Promise.all([
                apiClient.get('/inventory'),
                apiClient.get('/inventory/alerts'),
            ])
            setInventory(invRes.data.data)
            setAlerts(alertRes.data.data)

        }catch(err) {
            toast.error('Failed to load inventory ')
        }finally {
            setLoading(false)
        }
        
    }

    async function updateStock(productId, stock) {
        try{
            await apiClient.patch(`/inventory/${productId}`, {stock: parseInt(stock)})
            toast.success('Stock Updated')
            setEditingProduct(null)
            fetchInventory()
        }catch(err) {
            toast.error('Failed to update stock')
        }
        
    }
    if(loading) return <div className="text-center py-12">Loading.....</div>

    return (
        <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory Management</h1>

      {alerts && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-900 mb-2">Stock Alerts</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded">
              <p className="text-gray-600 text-sm">Critical</p>
              <p className="text-2xl font-bold text-red-600">{alerts.critical}</p>
            </div>
            <div className="bg-white p-4 rounded">
              <p className="text-gray-600 text-sm">High</p>
              <p className="text-2xl font-bold text-yellow-600">{alerts.high}</p>
            </div>
            <div className="bg-white p-4 rounded">
              <p className="text-gray-600 text-sm">Total Alerts</p>
              <p className="text-2xl font-bold text-orange-600">{alerts.totalAlerts}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['overview', 'inStock', 'lowStock', 'outOfStock', 'alerts'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'inStock'
              ? 'In Stock'
              : tab === 'lowStock'
                ? 'Low Stock'
                : tab === 'outOfStock'
                  ? 'Out of Stock'
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && inventory && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Total Products</p>
            <p className="text-3xl font-bold mt-2">{inventory.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">In Stock</p>
            <p className="text-3xl font-bold mt-2 text-green-600">{inventory.inStock.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Low Stock</p>
            <p className="text-3xl font-bold mt-2 text-yellow-600">{inventory.lowStock.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Out of Stock</p>
            <p className="text-3xl font-bold mt-2 text-red-600">{inventory.outOfStock.length}</p>
          </div>
        </div>
      )}

      {activeTab === 'inStock' && inventory && (
        <ProductTable
          products={inventory.inStock}
          editingProduct={editingProduct}
          newStock={newStock}
          onEdit={setEditingProduct}
          onStockChange={setNewStock}
          onSave={(id) => updateStock(id, newStock)}
        />
      )}

      {activeTab === 'lowStock' && inventory && (
        <ProductTable
          products={inventory.lowStock}
          editingProduct={editingProduct}
          newStock={newStock}
          onEdit={setEditingProduct}
          onStockChange={setNewStock}
          onSave={(id) => updateStock(id, newStock)}
        />
      )}

      {activeTab === 'outOfStock' && inventory && (
        <ProductTable
          products={inventory.outOfStock}
          editingProduct={editingProduct}
          newStock={newStock}
          onEdit={setEditingProduct}
          onStockChange={setNewStock}
          onSave={(id) => updateStock(id, newStock)}
        />
      )}

      {activeTab === 'alerts' && alerts && (
        <div className="space-y-4">
          {alerts.alerts.map(alert => (
            <div
              key={alert.productId}
              className={`p-4 rounded-lg border ${
                alert.urgency === 'CRITICAL'
                  ? 'bg-red-50 border-red-200'
                  : alert.urgency === 'HIGH'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">{alert.productName}</p>
                  <p className="text-sm text-gray-600">
                    Current Stock: <span className="font-bold">{alert.currentStock}</span>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    alert.urgency === 'CRITICAL'
                      ? 'bg-red-500 text-white'
                      : alert.urgency === 'HIGH'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-orange-500 text-white'
                  }`}
                >
                  {alert.urgency}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    )

    function ProductTable({ products, editingProduct, newStock, onEdit, onStockChange, onSave}){
        return(
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Product</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Price</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Stock</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Sold</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Views</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map(product => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
              <td className="px-6 py-4">${product.price.toFixed(2)}</td>
              <td className="px-6 py-4">
                {editingProduct === product.id ? (
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => onStockChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded w-20"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      product.stock === 0
                        ? 'bg-red-100 text-red-800'
                        : product.stock <= 10
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {product.stock}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">{product.sold}</td>
              <td className="px-6 py-4">{product.views}</td>
              <td className="px-6 py-4">
                {editingProduct === product.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSave(product.id)}
                      className="text-green-600 hover:text-green-800 font-medium text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => onEdit(null)}
                      className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onEdit(product.id)
                      onStockChange(product.stock)
                    }}
                    className="text-primary hover:text-primary/80 font-medium text-sm"
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
}