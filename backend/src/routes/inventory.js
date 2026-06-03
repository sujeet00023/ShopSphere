import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// ── GET /api/inventory (get inventory for seller) ────────────────────────
router.get('/', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            sold: true,
            views: true,
            isActive: true,
          },
        },
      },
    })

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' })
    }

    // Categorize inventory
    const inventory = {
      inStock: seller.products.filter(p => p.stock > 10),
      lowStock: seller.products.filter(p => p.stock > 0 && p.stock <= 10),
      outOfStock: seller.products.filter(p => p.stock === 0),
      total: seller.products.length,
    }

    res.json({ data: inventory })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch inventory.' })
  }
})

// ── PATCH /api/inventory/:productId (update product stock) ───────────────
router.patch('/:productId', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const { stock, reorderLevel } = req.body

    const product = await prisma.product.findUnique({
      where: { id: req.params.productId },
      include: { seller: true },
    })

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    // Verify seller owns this product
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    })

    if (product.sellerId !== seller.id) {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    const updated = await prisma.product.update({
      where: { id: req.params.productId },
      data: {
        stock: stock !== undefined ? parseInt(stock) : product.stock,
      },
    })

    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update inventory.' })
  }
})

// ── GET /api/inventory/alerts (get low stock alerts) ────────────────────
router.get('/alerts', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        products: {
          where: { stock: { lte: 10 } },
          select: {
            id: true,
            name: true,
            stock: true,
            price: true,
          },
        },
      },
    })

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' })
    }

    const alerts = seller.products.map(p => ({
      productId: p.id,
      productName: p.name,
      currentStock: p.stock,
      status: p.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      urgency: p.stock === 0 ? 'CRITICAL' : p.stock <= 5 ? 'HIGH' : 'MEDIUM',
    }))

    res.json({
      data: {
        alerts,
        totalAlerts: alerts.length,
        critical: alerts.filter(a => a.urgency === 'CRITICAL').length,
        high: alerts.filter(a => a.urgency === 'HIGH').length,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch alerts.' })
  }
})

// ── POST /api/inventory/bulk-update (bulk update inventory) ──────────────
router.post('/bulk-update', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const { updates } = req.body // Array of { productId, stock }

    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Invalid updates format.' })
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    })

    // Verify all products belong to seller
    const products = await prisma.product.findMany({
      where: { id: { in: updates.map(u => u.productId) } },
    })

    const unauthorized = products.some(p => p.sellerId !== seller.id)
    if (unauthorized) {
      return res.status(403).json({ message: 'Some products do not belong to your store.' })
    }

    // Update all
    const updated = await Promise.all(
      updates.map(u =>
        prisma.product.update({
          where: { id: u.productId },
          data: { stock: parseInt(u.stock) },
        })
      )
    )

    res.json({
      data: updated,
      message: `Updated ${updated.length} products.`,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to bulk update inventory.' })
  }
})

// ── GET /api/inventory/history (inventory change history) ────────────────
router.get('/history', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        products: {
          select: { id: true, name: true, stock: true, updatedAt: true },
        },
      },
    })

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' })
    }

    // Sort by recent changes
    const history = seller.products.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    res.json({ data: history.slice(0, 20) })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history.' })
  }
})

export default router
