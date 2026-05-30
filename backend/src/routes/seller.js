import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { reverse } from 'lodash'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/seller/dashboard (seller dashboard)
router.get('/dashboard', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    })

    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found.' })
    }

    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      averageRating,
      recentOrders,
      topProducts,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.product.count({ where: { sellerId: seller.id } }),
      prisma.order.count({ where: { sellerId: seller.id } }),
      prisma.order.aggregate({
        where: { sellerId: seller.id, paymentStatus: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.sellerProfile.findUnique({
        where: { id: seller.id },
        select: { rating: true },
      }),
      prisma.order.findMany({
        where: { sellerId: seller.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          items: { select: { _count: true } },
        },
      }),
      prisma.product.findMany({
        where: { sellerId: seller.id },
        orderBy: { sold: 'desc' },
        take: 5,
        select: { id: true, name: true, sold: true, price: true, stock: true },
      }),
      getSellerMonthlyRevenue(seller.id),
    ])

    const dashboard = {
      store: {
        name: seller.storeName,
        description: seller.storeDesc,
        rating: seller.rating,
        totalProducts,
      },
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        averageOrderValue: totalOrders > 0
          ? ((totalRevenue._sum.total || 0) / totalOrders).toFixed(2)
          : 0,
      },
      recentOrders,
      topProducts,
      monthlyRevenue,
    }

    res.json({ data: dashboard })
  } catch (err) {
    console.error('Seller dashboard error:', err)
    res.status(500).json({ message: 'Failed to fetch dashboard.' })
  }
})

// GET /api/seller/analytics (detailed analytics)
router.get('/analytics', authMiddleware, requireRole('SELLER'), async( req, res) =>{
    try{
        const seller = await prisma.sellerProfile.findUnique({
            where: {userId: req.user.id}
        })

        if(!seller){
            return res.status(404).json({ message: 'Seller profile not found '})
        }

        const orders = await prisma.order.findMany({
            where: { sellerId: seller.id },
            include: {items: true }
        })

        const products = await prisma.product.findMany({
            where: {sellerId: seller.id },
            select: {id: true, name: true, views: true, sold: true },
        })

        // Calculate conversion rate
        const totalViews = products.reduce((sum, p) => sum + p.views, 0)
        const totalSold = products.reduce((sum, p) => sum + p.sold, 0)
        const conversionRate = totalViews > 0 ? ((totalSold / totalViews ) * 100).toFixed(2) : 0
        
    // Status distribution
        const statsDist = {
            pending: orders.filter(o => o.status == 'PENDING').length,
            confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
            processing: orders.filter(o =>o.status === 'PROCESSING').length,
            shipped: orders.filter(o => o.status === 'SHIPPED').length,
            delivered: orders.filter( o => o.status === 'DELIVERED').length,
            cancelled: orders.filter(o => o.status === 'CANCELLED').length
        }

        res.json({
            data: {
                products: products.length,
                views:totalViews,
                conversionRate,
                orders:orders.length,
                statusDistribution: statsDist,
            },
        })
    }catch (err) {
        res.status(500).json ({ message: 'Failed to fetch analytics '})
    }
})

// GET /api/seller/orders (seller's orders)
router.get('/orders', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    })

    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found.' })
    }

    const { page = 1, limit = 20, status } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = { sellerId: seller.id }

    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: { include: { product: { select: { name: true, thumbnail: true } } } },
          shipping: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ])

    res.json({
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders.' })
  }
})

//  PATCH /api/seller/orders/:id/status
router.patch('/orders/:id/status', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' })
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    })

    const order = await prisma.order.findUnique({ where: { id: req.params.id } })

    if (!order || order.sellerId !== seller.id) {
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

// GET /api/seller/reviews (seller's product reviews)
router.get('/reviews', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: { products: { select: { id: true } } },
    })

    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found.' })
    }

    const productIds = seller.products.map(p => p.id)

    const reviews = await prisma.review.findMany({
      where: { productId: { in: productIds } },
      include: {
        product: { select: { name: true } },
        user: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    res.json({ data: reviews })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reviews.' })
  }
})

// Helper function
async function getSellerMonthlyRevenue(sellerId) {
    const months = {}
    const orders = await prisma.order.findMany({
        where: {sellerId, paymentStatus: 'COMPLETED'},
        select: {createdAt: true, total: true }
    })

    orders.forEach(order => {
        const key = new Date(order.createdAt).toLocaleDateString('en-Us',{
            month: 'short',
            year: '2-digit'
        })
        months[key] = (months[key] || 0 + order.total )
    })

    return Object.entries(months)
    .slice(-6)
    .map(([month, revenue]) => ({month, revenue: parseFloat(revenue.toFixed(2))}))
    
}

export default router