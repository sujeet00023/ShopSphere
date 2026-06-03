/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState } from "react"
import apiClient from "../../../utils/api"
import ProductGrid from "../../../components/ProductGrid"
import toast from "react-hot-toast"

export default function ProductPage(){
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [category, setCategory] = useState('')
    
    const [sortBy, setSortBy] = useState('newest')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  setCategory(params.get('category') || '')
}, [])

    useEffect(() =>{
        fetchProducts()

    },[category, sortBy, page])

    useEffect(() =>{
        fetchCategoies()
    }, [])

    async function fetchProducts() {
        try{
            setLoading(true)
            const params = {
                page,
                limit: 12,
                ...(category && {categoryId: category }),

            }
            const {data} = await apiClient.get('/products', {params })
            setProducts(data.data)
            setPagination(data.pagination)
        }catch (err){
            toast.error('Failed to load products')
        }finally {
            setLoading(false)
        }
        
    }


    async function fetchCategoies() {
        try{
            const {data} = await apiClient.get('/categories')
            setCategories(data.data)
        }catch(err){
            console.error('Failed to load categories')
        }
        
    }

    return(
        <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
          <p className="text-gray-600 mt-2">Discover thousands of quality products</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 sticky top-20">
              <h2 className="text-xl font-bold">Filters</h2>

              <div>
                <label className="block text-sm font-medium mb-3">Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setCategory('')
                  setSortBy('newest')
                  setPage(1)
                }}
                className="w-full bg-gray-200 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  Showing {products.length} products
                  {pagination && ` (Page ${pagination.page} of ${pagination.pages})`}
                </p>
              </div>

              <ProductGrid products={products} loading={loading} />

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setPage(p)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        page === p
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    )
}
