'use client'

import { useEffect, useState } from 'react'
import apiClient from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ProductReviews({ productId }) {
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [sort, setSort] = useState('helpful')

  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [productId, sort])

  async function fetchReviews() {
    try {
      const { data } = await apiClient.get(`/reviews/product/${productId}?sort=${sort}`)
      setReviews(data.data)
    } catch (err) {
      console.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const { data } = await apiClient.get(`/reviews/stats/${productId}`)
      setStats(data.data)
    } catch (err) {
      console.error('Failed to fetch review stats')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('Please log in to leave a review')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post('/reviews', {
        productId,
        ...formData,
      })
      toast.success('Review posted successfully!')
      setFormData({ rating: 5, title: '', comment: '' })
      setShowForm(false)
      fetchReviews()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post review')
    } finally {
      setSubmitting(false)
    }
  }

  async function markHelpful(reviewId) {
    try {
      await apiClient.patch(`/reviews/${reviewId}/helpful`)
      fetchReviews()
    } catch (err) {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      {stats && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Rating Summary */}
            <div>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-gray-900">{stats.average}</div>
                <div>
                  <div className="text-yellow-400 text-2xl mb-2">
                    {'⭐'.repeat(Math.round(stats.average))}
                  </div>
                  <p className="text-gray-600 text-sm">{stats.total} reviews</p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-12">{rating}⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.distribution[rating] / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{stats.distribution[rating]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {user && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          ✍️ Write a Review
        </button>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating })}
                  className="text-3xl hover:scale-110 transition-transform"
                >
                  <span className={formData.rating >= rating ? 'text-yellow-400' : 'text-gray-300'}>⭐</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Comment</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Share more details about your experience"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">Showing {reviews.length} reviews</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="helpful">Most Helpful</option>
            <option value="newest">Newest First</option>
            <option value="highest-rated">Highest Rated</option>
            <option value="lowest-rated">Lowest Rated</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Reviewer Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={review.user.avatar || `https://ui-avatars.com/api/?name=${review.user.name}`}
                      alt={review.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{review.user.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">{'⭐'.repeat(review.rating)}</span>
                        <span className="text-gray-500 text-sm">{review.rating} stars</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
                  {review.comment && <p className="text-gray-700 mb-3 text-sm">{review.comment}</p>}

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Review"
                          className="w-20 h-20 rounded object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {/* Helpful Button */}
                  <button
                    onClick={() => markHelpful(review.id)}
                    className="text-sm text-gray-600 hover:text-primary transition-colors"
                  >
                    👍 Helpful ({review.helpful})
                  </button>
                </div>

                {/* Review Date */}
                <p className="text-xs text-gray-500 ml-4">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}