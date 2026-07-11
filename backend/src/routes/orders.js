import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// ── POST /api/orders (create order from cart) ──────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { shipping } = req.body

if (!shipping) {
  return res.status(400).json({
    message: 'Shipping information is required.'
  })
}

    // Get cart items
const { items } = req.body

if (!items || items.length === 0) {
  return res.status(400).json({
    message: 'Cart is empty.'
  })
}

    // Verify shipping address belongs to user
   const address = await prisma.address.create({
  data: {
    userId: req.user.id,
    fullName: shipping.fullName,
    phone: shipping.phone,
    street: shipping.street,
    city: shipping.city,
    state: shipping.state,
    zipCode: shipping.zipCode,
    country: shipping.country,
  },
})

    if (!address || address.userId !== req.user.id) {
      return res.status(400).json({ message: 'Invalid shipping address.' })
    }

    const cartItems = await Promise.all(
  items.map(async (item) => {
    const product = await prisma.product.findUnique({
      where: {
        id: item.productId,
      },
    })

    return {
      quantity: item.quantity,
      product,
    }
  })
)

    // Group items by seller
    const bySellerMap = {}
    cartItems.forEach(item => {
      if (!bySellerMap[item.product.sellerId]) {
        bySellerMap[item.product.sellerId] = []
      }
      bySellerMap[item.product.sellerId].push(item)
    })

    // Create orders for each seller
    const orders = []
    for (const [sellerId, items] of Object.entries(bySellerMap)) {
      const subtotal = items.reduce((sum, item) => {
        const price = item.product.price - (item.product.price * (item.product.discountPct / 100))
        return sum + price * item.quantity
      }, 0)

      const tax = subtotal * 0.1 // 10% tax
      const total = subtotal + tax

      const order = await prisma.order.create({
        data: {
          customerId: req.user.id,
          sellerId,
          shippingId: address.id,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          items: {
            create: items.map(item => {
              const price = item.product.price - (item.product.price * (item.product.discountPct / 100))
              return {
                productId: item.product.id,
                quantity: item.quantity,
                price,
                total: price * item.quantity,
              }
            }),
          },
        },
        include: {
          items: { include: { product: true } },
          customer: { select: { name: true, email: true } },
        },
      })

      // Update product stock
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.product.id },
          data: {
            stock: { decrement: item.quantity },
            sold: { increment: item.quantity },
          },
        })
      }

      orders.push(order)
    }

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } })

    res.status(201).json({ data: orders, message: 'Orders created successfully.' })
  } catch (err) {
    console.error('Create order error:', err)
    res.status(500).json({ message: 'Failed to create order.' })
  }
})

// ── GET /api/orders (get user's orders) ──────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user

    let where = {}
    if (role === 'CUSTOMER') {
      where.customerId = id
    } else if (role === 'SELLER') {
      where.sellerId = id
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { name: true, thumbnail: true } } } },
        customer: { select: { name: true, email: true } },
        seller: { select: { storeName: true } },
      },
    })

    res.json({ data: orders })
  } catch (err) {
    console.error('Get orders error:', err)
    res.status(500).json({ message: 'Failed to fetch orders.' })
  }
})

// ── GET /api/orders/:id (get single order) ───────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true } },
        customer: { select: { name: true, email: true, phone: true } },
        shipping: true,
        seller: { select: { storeName: true } },
      },
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    // Verify access
    if (order.customerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    res.json({ data: order })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order.' })
  }
})

// ── PATCH /api/orders/:id/status (update order status) ───────────────────
router.patch('/:id/status', authMiddleware, requireRole('SELLER', 'ADMIN'), async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' })
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } })

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    // Verify seller owns this order
    if (order.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { items: { include: { product: true } } },
    })

    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order.' })
  }
})

// ── PATCH /api/orders/:id/cancel (Customer cancels own order) ─────────────
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return res.status(404).json({
        message: 'Order not found.',
      })
    }

    // Only the customer who placed the order can cancel it
    if (order.customerId !== req.user.id) {
      return res.status(403).json({
        message: 'Unauthorized.',
      })
    }

    // Only allow cancellation before shipping
    const cancellableStatuses = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
    ]

    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: 'This order cannot be cancelled.',
      })
    }

    // Update order status
  const updatedOrder = await prisma.order.update({
  where: { id: req.params.id },
  data: {
    status: 'CANCELLED',
    cancelledAt: new Date(),

    refundStatus: 'REQUESTED',
    refundAmount: order.total,
    refundRequestedAt: new Date()
  },
  include: {
    items: true,
  },
})

    // Restore stock
    for (const item of order.items) {
      await prisma.product.update({
        where: {
          id: item.productId,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
          sold: {
            decrement: item.quantity,
          },
        },
      })
    }

    res.json({
      message: 'Order cancelled successfully.',
      data: updatedOrder,
    })
  } catch (err) {
  console.error(err)

  res.status(500).json({
    message: err.message
  })
}
})

export default router
