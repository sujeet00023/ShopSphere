'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '../utils/api'
import ProductGrid from '../components/ProductGrid'
import toast from 'react-hot-toast'

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/products?limit=8'),
        apiClient.get('/categories'),
      ])
      setProducts(productsRes.data.data)
      setCategories(categoriesRes.data.data)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary via-accent to-purple-600 text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold font-display">
              Shop Smart, Shop Fresh
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
              Discover thousands of products from trusted sellers. Fast shipping, secure payments, best prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/search"
                className="bg-primary/20 border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-primary/30 transition-colors"
              >
                Advanced Search
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48"></div>
      </section>

      {/* Trust Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-2">✓</div>
              <h3 className="font-bold text-gray-900">Wide Selection</h3>
              <p className="text-gray-600 text-sm">Thousands of products from top brands</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">💰</div>
              <h3 className="font-bold text-gray-900">Best Prices</h3>
              <p className="text-gray-600 text-sm">Competitive pricing and regular discounts</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🚚</div>
              <h3 className="font-bold text-gray-900">Fast Shipping</h3>
              <p className="text-gray-600 text-sm">Quick delivery to your doorstep</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🔒</div>
              <h3 className="font-bold text-gray-900">Secure Payment</h3>
              <p className="text-gray-600 text-sm">Protected with Stripe encryption</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900">
              Featured Products
            </h2>
            <p className="text-gray-600 mt-4">Explore our best sellers and trending items</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : products.length > 0 ? (
            <>
              <ProductGrid products={products} loading={loading} />
              
              <div className="text-center mt-12">
                <Link
                  href="/products"
                  className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  View All Products →
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No products available yet
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900">
                Shop by Category
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.slice(0, 6).map(category => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="group relative overflow-hidden rounded-lg h-64 md:h-80"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-2xl md:text-3xl font-bold text-white font-display">
                        {category.name}
                      </h3>
                      <p className="text-white/90 mt-2">Browse products</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary">10K+</div>
              <p className="text-gray-600 mt-2">Products Available</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent">500+</div>
              <p className="text-gray-600 mt-2">Trusted Sellers</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-purple-600">100K+</div>
              <p className="text-gray-600 mt-2">Happy Customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-accent text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-display">
            Ready to Start Shopping?
          </h2>
          <p className="text-lg opacity-90">
            Join thousands of satisfied customers and discover amazing products at great prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/search"
              className="bg-white/20 border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white/30 transition-colors"
            >
              Advanced Search
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-600">
              Get updates on new products, special offers, and exclusive deals delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-gray-500">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">About ShopSphere</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Policies</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm">
                &copy; 2026 ShopSphere. All rights reserved.
              </p>
              <div className="flex gap-6 mt-4 md:mt-0 text-sm">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}