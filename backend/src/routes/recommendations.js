import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// ── GET /api/recommendations/trending (trending products) ────────────────
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { views: 'desc' },
      take: parseInt(limit),
      include: { category: true, seller: { select: { storeName: true } } },
    })

    res.json({ data: products })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trending products.' })
  }
})

// ── GET /api/recommendations/bestsellers (best selling products) ─────────
router.get('/bestsellers', async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sold: 'desc' },
      take: parseInt(limit),
      include: { category: true, seller: { select: { storeName: true } } },
    })

    res.json({ data: products })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bestsellers.' })
  }
})

// ── GET /api/recommendations/toprated (top rated products) ───────────────
router.get('/toprated', async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const products = await prisma.product.findMany({
      where: { isActive: true, reviewCount: { gt: 0 } },
      orderBy: { rating: 'desc' },
      take: parseInt(limit),
      include: { category: true, seller: { select: { storeName: true } } },
    })

    res.json({ data: products })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch top rated.' })
  }
})

// ── GET /api/recommendations/similar/:productId (similar products) ───────
router.get('/similar/:productId', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.productId },
    })

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    // Find similar products in same category
    const similar = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: req.params.productId },
        isActive: true,
      },
      orderBy: { rating: 'desc' },
      take: 6,
      include: { category: true, seller: { select: { storeName: true } } },
    })

    res.json({ data: similar })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch similar products.' })
  }
})

// ── GET /api/recommendations/personalized (personalized for user) ────────
router.get('/personalized', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query

    // Get user's order history
    const userOrders = await prisma.order.findMany({
      where: { customerId: req.user.id },
      include: { items: { include: { product: { select: { categoryId: true } } } } },
    })

    // Get categories from purchases
    const categorySet = new Set()
    userOrders.forEach(order => {
      order.items.forEach(item => {
        categorySet.add(item.product.categoryId)
      })
    })

    // If user has no purchases, get trending products
    if (categorySet.size === 0) {
      const trending = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { views: 'desc' },
        take: parseInt(limit),
        include: { category: true, seller: { select: { storeName: true } } },
      })
      return res.json({ data: trending })
    }

    // Get top rated products from user's categories
    const recommended = await prisma.product.findMany({
      where: {
        categoryId: { in: Array.from(categorySet) },
        isActive: true,
        reviewCount: { gt: 0 },
      },
      orderBy: [{ rating: 'desc' }, { sold: 'desc' }],
      take: parseInt(limit),
      include: { category: true, seller: { select: { storeName: true } } },
    })
    res.json({ data: recommended })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recommendations.' })
  }
})

// ── GET /api/recommendations/frequent-bought (frequently bought together) ──
router.get('/frequent-bought/:productId', async (req, res) => {
  try {
    // Get all orders containing this product
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: { productId: req.params.productId },
        },
      },
      include: { items: { include: { product: true } } },
    })

    // Count frequency of other products
    const productFrequency = {}
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId !== req.params.productId) {
          productFrequency[item.productId] = (productFrequency[item.productId] || 0) + 1
        }
      })
    })

    // Get top 6 frequently bought together
    const topProductIds = Object.entries(productFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id)

    const products = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      include: { category: true, seller: { select: { storeName: true } } },
    })

    res.json({ data: products })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch frequently bought.' })
  }
})

// ── GET /api/recommendations/category/:categoryId (products in category) ──
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { limit = 12 } = req.query

    const products = await prisma.product.findMany({
      where: {
        categoryId: req.params.categoryId,
        isActive: true,
      },
      orderBy: [{ rating: 'desc' }, { sold: 'desc' }],
      take: parseInt(limit),
      include: { category: true, seller: { select: { storeName: true } } },
    })

    res.json({ data: products })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch category products.' })
  }
})

export default router
