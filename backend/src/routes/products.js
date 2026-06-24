import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// ── GET /api/products (public listing with filters) ────────────────────────
router.get('/', async (req, res) => {
  console.log(req.query)
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      minPrice, 
      maxPrice, 
      search,
      sort = 'newest'
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = { isActive: true }

    if (category) where.categoryId = category
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { desc: { contains: search, mode: 'insensitive' } },
      ]
    }

    const sortMap = {
      newest: { createdAt: 'desc' },
      oldest: { createdAt: 'asc' },
      'price-low': { price: 'asc' },
      'price-high': { price: 'desc' },
      'most-popular': { sold: 'desc' },
      'top-rated': { rating: 'desc' },
    }
    const orderBy = sortMap[sort] || sortMap.newest

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: { category: true, seller: { select: { storeName: true } } },
      }),
      prisma.product.count({ where }),
    ])

    res.json({
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    })
  } catch (err) {
    console.error('Fetch products error:', err)
    res.status(500).json({ message: 'Failed to fetch products.' })
  }
})

// ── GET /api/products/:id (single product details) ────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        seller: {
          select: { storeName: true, storeDesc: true, rating: true },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
    })

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    // Increment views
    await prisma.product.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } },
    })

    res.json({ data: product })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product.' })
  }
})

// ── POST /api/products (seller creates product) ────────────────────────────
router.post('/', authMiddleware, requireRole('SELLER', 'ADMIN'), async (req, res) => {
  try {
    const { name, desc, longDesc, price, discountPct, stock, categoryId, images, thumbnail } = req.body

    if (!name || !desc || !price || !categoryId) {
      return res.status(400).json({ message: 'Missing required fields.' })
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    })

    if (!seller) {
      return res.status(403).json({ message: 'Seller profile not found.' })
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        desc,
        longDesc,
        price: parseFloat(price),
        discountPct: parseFloat(discountPct) || 0,
        stock: parseInt(stock) || 0,
        categoryId,
        sellerId: seller.id,
        images: images || [],
        thumbnail: thumbnail || images?.[0] || '',
      },
      include: { category: true, seller: true },
    })

    res.status(201).json({ data: product })
  } catch (err) {
    console.error('Create product error:', err)
    res.status(500).json({ message: 'Failed to create product.' })
  }
})

// ── PUT /api/products/:id (update product) ─────────────────────────────────
router.put('/:id', authMiddleware, requireRole('SELLER', 'ADMIN'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    // Check if user is seller or admin
    if (product.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You do not have permission to update this product.' })
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: true, seller: true },
    })

    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product.' })
  }
})

router.delete(
  '/:id',
  authMiddleware,
  requireRole('SELLER', 'ADMIN'),
  async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id }
      })

      if (!product) {
        return res.status(404).json({
          message: 'Product not found'
        })
      }

      // Get seller profile
      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.id }
      })

      // Allow only owner or admin
      if (
        req.user.role !== 'ADMIN' &&
        product.sellerId !== seller?.id
      ) {
        return res.status(403).json({
          message: 'Not authorized'
        })
      }

      await prisma.product.delete({
        where: { id: req.params.id }
      })

      res.json({
        success: true,
        message: 'Product deleted successfully'
      })

    } catch (error) {
      console.error(error)
      res.status(500).json({
        message: 'Failed to delete product'
      })
    }
  }
)

// ── GET /api/products/seller/dashboard (seller's products) ─────────────────
router.get('/seller/products', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    })

    if (!seller) {
      return res.status(403).json({ message: 'Seller profile not found.' })
    }

    const products = await prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    })

    res.json({ data: products })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products.' })
  }
})

export default router
