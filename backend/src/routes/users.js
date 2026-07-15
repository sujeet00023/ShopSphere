import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()


// GET /user/dashboard - User dashboard overview
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    const [
      orders,
      wishlist,
      addresses,
      profile,
      wallet
    ] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: userId },
        include: {
          items: { include: { product: { select: { name: true, price: true, thumbnail: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      }),

      prisma.wishlistItem.findMany({
        where: { userId },
        include: { product: { select: { id: true, name: true, price: true, thumbnail: true } } }
      }),

      prisma.address.findMany({ where: { userId } }),

      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true }
      }),

      prisma.wallet.findUnique({
        where: { userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })
    ])

    // Create wallet if not exists
    let userWallet = wallet
    if (!userWallet) {
      userWallet = await prisma.wallet.create({
        data: { userId, balance: 0 },
        include: { transactions: true }
      })
    }

    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const pendingOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length
    const wishlistCount = wishlist.length

    const recentOrders = orders.slice(0, 5).map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      total: order.total,
      status: order.status,
      refundStatus: order.refundStatus,
      refundedAmount: order.refundedAmount
      
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
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          total: order.total,
          status: order.status,
          refundStatus: order.refundStatus,
          refundedAmount: order.refundedAmount
        })),
        wishlist: wishlist.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          price: item.product.price,
          productImage: item.product.thumbnail,
        })),
        addresses,
        profile,
        wallet: userWallet
      }
    })
  } catch (err) {
    console.error('Dashboard Error:', err)
    res.status(500).json({ status: 'error', message: 'Failed to load dashboard' })
  }
})


// GET /user/profile - Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })
 
    res.json({
      status: 'success',
      data: user
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch profile' })
  }
})
 
// PUT /user/profile - Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body
 
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
      }
    })
 
    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to update profile' })
  }
})
 
// GET /user/orders - Get all user orders
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
 
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: req.user.id },
        skip,
        take: limit,
        include: {
          items: {
            include: { product: { select: { name: true, price: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where: { customerId: req.user.id } })
    ])
 
    res.json({
      status: 'success',
      data: orders.map(order => ({
        id: order.id,
        createdAt: order.createdAt,
        total: order.total,
        status: order.status,
        itemCount: order.items.length,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders' })
  }
})
 
// GET /user/wishlist - Get user wishlist
router.post('/wishlist', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body

    console.log('USER:', req.user)
    console.log('PRODUCT:', productId)

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId
        }
      }
    })

    console.log('EXISTING:', existing)

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: req.user.id,
        productId
      }
    })

    res.status(201).json({ data: wishlistItem })

  } catch (err) {
    console.error('WISHLIST ERROR')
    console.error(err)

    res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack
    })
  }
})
 
 
// DELETE /user/wishlist/:id - Remove from wishlist
router.delete('/wishlist/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.wishlistItem.delete({
      where: { id: req.params.id }
    })
 
    res.json({
      status: 'success',
      message: 'Removed from wishlist'
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to remove from wishlist' })
  }
})
 
// GET /user/addresses - Get user addresses
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { customerId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
 
    res.json({
      status: 'success',
      data: addresses
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch addresses' })
  }
})
 
// POST /user/addresses - Add new address
router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const { label, address, city, state, zipCode, country, phone } = req.body
 
    if (!address || !city || !zipCode || !country) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' })
    }
 
    const newAddress = await prisma.address.create({
      data: {
        customerId: req.user.id,
        label,
        address,
        city,
        state,
        zipCode,
        country,
        phone,
      }
    })
 
    res.json({
      status: 'success',
      message: 'Address added successfully',
      data: newAddress
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to add address' })
  }
})
 
// PUT /user/addresses/:id - Update address
router.put('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const { label, address, city, state, zipCode, country, phone } = req.body
 
    const updatedAddress = await prisma.address.update({
      where: { id: req.params.id },
      data: {
        label,
        address,
        city,
        state,
        zipCode,
        country,
        phone,
      }
    })
 
    res.json({
      status: 'success',
      message: 'Address updated successfully',
      data: updatedAddress
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to update address' })
  }
})
 
// DELETE /user/addresses/:id - Delete address
router.delete('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.address.delete({
      where: { id: req.params.id }
    })
 
    res.json({
      status: 'success',
      message: 'Address deleted successfully'
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to delete address' })
  }
})
 
// GET /user/stats - Get user statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
 
    const [totalOrders, totalSpent, pending] = await Promise.all([
      prisma.order.count({ where: { customerId: userId } }),
      prisma.order.aggregate({
        where: { customerId: userId },
        _sum: { total: true }
      }),
      prisma.order.count({
        where: {
          customerId: userId,
          status: { notIn: ['DELIVERED', 'CANCELLED'] }
        }
      })
    ])
 
    res.json({
      status: 'success',
      data: {
        totalOrders,
        totalSpent: totalSpent._sum.total || 0,
        pendingOrders: pending,
      }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch stats' })
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
 /*router.get('/wishlist', authMiddleware, async (req, res) => {
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
*/

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

// GET /api/users/wallet - Get user wallet balance + transactions
router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!wallet) {
      // Create wallet if not exists
      const newWallet = await prisma.wallet.create({
        data: { userId, balance: 0 },
        include: { transactions: true }
      })
      return res.json({ data: newWallet })
    }

    res.json({ data: wallet })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch wallet' })
  }
})

// GET /api/users/wallet/transactions - Get all wallet transactions
router.get('/wallet/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ data: transactions })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions' })
  }
})


export default router
