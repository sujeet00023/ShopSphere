import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()


// GET /user/dashboard - User dashboard overview
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
 
    // Fetch all data in parallel
    const [
      orders,
      wishlist,
      addresses,
      profile,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: userId },
        include: {
          items: {
            include: { product: { select: { name: true, price: true, thumbnail: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
 
      prisma.wishlistItem.findMany({
  where: { userId },
  include: {
    product: {
      select: {
        id: true,
        name: true,
        price: true,
        thumbnail: true
      }
    }
  }
}),
      prisma.address.findMany({
  where: { userId }
}),
 
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true }
      })
    ])
 
    // Calculate stats
    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const pendingOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length
    const wishlistCount = wishlist.length
 
    // Format recent orders (last 5)
    const recentOrders = orders.slice(0, 5).map(order => ({
      id: order.id,
      createdAt: order.createdAt,
      total: order.total,
      status: order.status,
    }))
 
    // Format wishlist items
    const formattedWishlist = wishlist.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      price: item.product.price,
      productImage: item.product.image,
    }))
 
    // Format addresses
  const formattedAddresses = addresses.map(addr => ({
  id: addr.id,
  fullName: addr.fullName,
  street: addr.street,
  city: addr.city,
  state: addr.state,
  zipCode: addr.zipCode,
  country: addr.country,
  phone: addr.phone,
}))
 
    res.json({
      status: 'success',
      data: {
        stats: {
          totalOrders,
          totalSpent: parseFloat(totalSpent.toFixed(2)),
          pendingOrders,
          wishlistCount,
        },
        recentOrders,
        orders: orders.map(order => ({
          id: order.id,
          createdAt: order.createdAt,
          total: order.total,
          status: order.status,
        })),
        wishlist: formattedWishlist,
        addresses: formattedAddresses,
        profile: {
          name: profile.name,
          email: profile.email,
          createdAt: profile.createdAt,
        }
      }
    })
  } catch (err) {
  console.error('Dashboard Error:', err)

  res.status(500).json({
    status: 'error',
    message: err.message
  })
}
})



// ── GET /api/users/profile (get user profile) ────────────────────────────
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, avatar: true, phone: true, role: true, createdAt: true },
    })

    const sellerProfile = user.role === 'SELLER' 
      ? await prisma.sellerProfile.findUnique({ where: { userId: req.user.id } })
      : null

    res.json({ data: { user, seller: sellerProfile } })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile.' })
  }
})

// ── PUT /api/users/profile (update profile) ──────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar, phone } = req.body

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, avatar, phone },
      select: { id: true, email: true, name: true, avatar: true, phone: true, role: true },
    })

    res.json({ data: user })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile.' })
  }
})

// ── GET /api/users/addresses (get all addresses) ──────────────────────────
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: addresses })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch addresses.' })
  }
})

// ── POST /api/users/addresses (add address) ──────────────────────────────
router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body

    if (!fullName || !phone || !street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ message: 'All fields are required.' })
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName,
        phone,
        street,
        city,
        state,
        zipCode,
        country,
        isDefault: isDefault || false,
      },
    })

    res.status(201).json({ data: address })
  } catch (err) {
    console.error('Create address error:', err)
    res.status(500).json({ message: 'Failed to create address.' })
  }
})

// ── PUT /api/users/addresses/:id (update address) ──────────────────────────
router.put('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const address = await prisma.address.findUnique({ where: { id: req.params.id } })

    if (!address || address.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: req.body,
    })

    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update address.' })
  }
})

// ── GET /api/users/wishlist (get wishlist) ─────────────────────
router.delete('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const address = await prisma.address.findUnique({ where: { id: req.params.id } })

    if (!address || address.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    await prisma.address.delete({ where: { id: req.params.id } })
    res.json({ message: 'Address deleted.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete address.' })
  }
})

// ── GET /api/users/wishlist (get wishlist) ───────────────────────────────
router.get('/wishlist', authMiddleware, async (req, res) => {
  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { seller: { select: { storeName: true } } } } },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: wishlist })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch wishlist.' })
  }
})

// ── POST /api/users/wishlist (add to wishlist) ──────────────────────────
router.post('/wishlist', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required.' })
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    })

    if (existing) {
      return res.status(400).json({ message: 'Already in wishlist.' })
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: { userId: req.user.id, productId },
      include: { product: true },
    })

    res.status(201).json({ data: wishlistItem })
  } catch (err) {
    console.error('Add wishlist error:', err)
    res.status(500).json({ message: 'Failed to add to wishlist.' })
  }
})

// ── DELETE /api/users/wishlist/:id (remove from wishlist) ────────────────
router.delete('/wishlist/:id', authMiddleware, async (req, res) => {
  try {
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id: req.params.id },
    })

    if (!wishlistItem || wishlistItem.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    await prisma.wishlistItem.delete({ where: { id: req.params.id } })
    res.json({ message: 'Removed from wishlist.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove from wishlist.' })
  }
})

export default router
