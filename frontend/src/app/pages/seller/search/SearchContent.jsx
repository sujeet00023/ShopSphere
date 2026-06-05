/* eslint-disable react-hooks/immutability */
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import apiClient from "../../../../utils/api"
import ProductGrid from "../../../../components/ProductGrid"
import toast from 'react-hot-toast'

export default function AdvancedSearch() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '0')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '999999')
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '0')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance')
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchSearch()
  }, [query, category, minPrice, maxPrice, minRating, sortBy, inStock, page])

  useEffect(() => {
    fetchFilters()
  }, [category])

  async function fetchSearch() {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/search/advanced', {
        params: {
          q: query,
          category,
          minPrice,
          maxPrice,
          minRating,
          sortBy,
          inStock: inStock ? 'true' : 'false',
          page,
          limit: 12,
        },
      })
      setProducts(data.data)
      setPagination(data.pagination)
    } catch (err) {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  async function fetchFilters() {
    try {
      const { data } = await apiClient.get('/search/filters', {
        params: { categoryId: category },
      })
      setFilters(data.data)
    } catch (err) {
      console.error('Failed to load filters')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 sticky top-20">
          <h2 className="text-xl font-bold">Filters</h2>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Category */}
          {filters?.categories && (
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Categories</option>
                {filters.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <div className="space-y-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value)
                  setPage(1)
                }}
                placeholder="Min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value)
                  setPage(1)
                }}
                placeholder="Max"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Rating</label>
            <select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {filters?.ratings?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* In Stock */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked)
                  setPage(1)
                }}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">In Stock Only</span>
            </label>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {filters?.sortOptions?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setQuery('')
              setCategory('')
              setMinPrice('0')
              setMaxPrice('999999')
              setMinRating('0')
              setInStock(false)
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Showing {products.length} of {pagination?.total || 0} products
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
  )
}
