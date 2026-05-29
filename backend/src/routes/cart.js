import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// ── GET /api/cart (get user's cart) ──────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cart = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { seller: { select: { storeName: true } } },
        },
      },
    })

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => {
      const price = item.product.price - (item.product.price * (item.product.discountPct / 100))
      return sum + price * item.quantity
    }, 0)

    res.json({
      data: cart,
      subtotal: parseFloat(subtotal.toFixed(2)),
      itemCount: cart.length,
    })
  } catch (err) {
    console.error('Get cart error:', err)
    res.status(500).json({ message: 'Failed to fetch cart.' })
  }
})

// ── POST /api/cart (add to cart) ─────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body

    if (!productId || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product or quantity.' })
    }

    // Check if product exists and has stock
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock.' })
    }

    // Check if already in cart
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    })

    if (existing) {
      // Update quantity
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: { product: true },
      })
      return res.status(200).json({ data: updated })
    }

    // Create new cart item
    const cartItem = await prisma.cartItem.create({
      data: {
        userId: req.user.id,
        productId,
        quantity,
      },
      include: { product: true },
    })

    res.status(201).json({ data: cartItem })
  } catch (err) {
    console.error('Add to cart error:', err)
    res.status(500).json({ message: 'Failed to add to cart.' })
  }
})

// ── PUT /api/cart/:cartItemId (update quantity) ──────────────────────────
router.put('/:cartItemId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid quantity.' })
    }

    // Verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: req.params.cartItemId },
      include: { product: true },
    })

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found.' })
    }

    if (cartItem.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    // Check stock
    if (cartItem.product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock.' })
    }

    const updated = await prisma.cartItem.update({
      where: { id: req.params.cartItemId },
      data: { quantity },
      include: { product: true },
    })

    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update cart.' })
  }
})

// ── DELETE /api/cart/:cartItemId (remove from cart) ─────────────────────
router.delete('/:cartItemId', authMiddleware, async (req, res) => {
  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: req.params.cartItemId },
    })

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found.' })
    }

    if (cartItem.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    await prisma.cartItem.delete({ where: { id: req.params.cartItemId } })
    res.json({ message: 'Item removed from cart.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove from cart.' })
  }
})

// ── DELETE /api/cart (clear entire cart) ────────────────────────────────
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } })
    res.json({ message: 'Cart cleared.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear cart.' })
  }
})

export default router
