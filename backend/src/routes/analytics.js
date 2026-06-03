import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// ── GET /api/analytics/admin/detailed (admin advanced analytics) ─────────
router.get('/admin/detailed', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    }

    const orders = await prisma.order.findMany({
      where: { createdAt: dateFilter },
      include: { items: true },
    })

    const users = await prisma.user.findMany()
    const products = await prisma.product.findMany()

    // Revenue by seller
    const revenueBySellerMap = {}
    for (const order of orders) {
      if (!revenueBySellerMap[order.sellerId]) {
        revenueBySellerMap[order.sellerId] = 0
      }
      revenueBySellerMap[order.sellerId] += order.total
    }

    const revenueBySellerData = await Promise.all(
      Object.entries(revenueBySellerMap).map(async ([sellerId, revenue]) => {
        const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } })
        return { seller: seller?.storeName, revenue }
      })
    )

    // Product performance
    const productPerformance = products
      .map(p => ({
        id: p.id,
        name: p.name,
        sold: p.sold,
        revenue: p.price * p.sold,
        views: p.views,
        conversionRate: p.views > 0 ? ((p.sold / p.views) * 100).toFixed(2) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Order statistics
    const totalOrders = orders.length
    const completedOrders = orders.filter(o => o.paymentStatus === 'COMPLETED').length
    const failedOrders = orders.filter(o => o.paymentStatus === 'FAILED').length
    const avgOrderValue = totalOrders > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / totalOrders : 0

    // Customer statistics
    const activeCustomers = new Set(orders.map(o => o.customerId)).size
    const totalCustomers = users.filter(u => u.role === 'CUSTOMER').length
    const newCustomers = users
      .filter(u => u.role === 'CUSTOMER' && u.createdAt > (new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
      .length

    // Status distribution
    const statusDist = {
      PENDING: orders.filter(o => o.status === 'PENDING').length,
      CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
      PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
      SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
      DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    }

    res.json({
      data: {
        dateRange: { startDate, endDate },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          failed: failedOrders,
          avgValue: parseFloat(avgOrderValue.toFixed(2)),
        },
        customers: {
          active: activeCustomers,
          total: totalCustomers,
          new: newCustomers,
        },
        revenue: {
          bySeller: revenueBySellerData,
          total: orders.reduce((sum, o) => sum + o.total, 0),
        },
        products: {
          top10: productPerformance,
          total: products.length,
        },
        statusDistribution: statusDist,
      },
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ message: 'Failed to fetch analytics.' })
  }
})

// ── GET /api/analytics/seller/detailed (seller advanced analytics) ───────
router.get('/seller/detailed', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      include: { products: true },
    })

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' })
    }

    const { startDate, endDate } = req.query

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    }

    const orders = await prisma.order.findMany({
      where: { sellerId: seller.id, createdAt: dateFilter },
      include: { items: true },
    })

    // Revenue by product
    const revenueByProduct = {}
    for (const order of orders) {
      for (const item of order.items) {
        if (!revenueByProduct[item.productId]) {
          revenueByProduct[item.productId] = { quantity: 0, revenue: 0 }
        }
        revenueByProduct[item.productId].quantity += item.quantity
        revenueByProduct[item.productId].revenue += item.total
      }
    }

    const productAnalytics = seller.products
      .map(p => ({
        id: p.id,
        name: p.name,
        quantity: revenueByProduct[p.id]?.quantity || 0,
        revenue: revenueByProduct[p.id]?.revenue || 0,
        views: p.views,
        sold: p.sold,
        stock: p.stock,
        conversionRate: p.views > 0 ? ((p.sold / p.views) * 100).toFixed(2) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Order analytics
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Customer data
    const uniqueCustomers = new Set(orders.map(o => o.customerId)).size
    const repeatCustomers = {}
    for (const order of orders) {
      repeatCustomers[order.customerId] = (repeatCustomers[order.customerId] || 0) + 1
    }
    const repeatCount = Object.values(repeatCustomers).filter(count => count > 1).length

    res.json({
      data: {
        dateRange: { startDate, endDate },
        revenue: {
          total: parseFloat(totalRevenue.toFixed(2)),
          avgOrder: parseFloat(avgOrderValue.toFixed(2)),
        },
        orders: {
          total: totalOrders,
          avgValue: parseFloat(avgOrderValue.toFixed(2)),
        },
        customers: {
          unique: uniqueCustomers,
          repeat: repeatCount,
        },
        products: productAnalytics,
        topProducts: productAnalytics.slice(0, 5),
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics.' })
  }
})

// ── GET /api/analytics/export/csv (export analytics as CSV) ──────────────
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: req.user.role === 'SELLER'
        ? { sellerId: (await prisma.sellerProfile.findUnique({ where: { userId: req.user.id } })).id }
        : {},
      include: { customer: true, items: true },
    })

    // Generate CSV
    const headers = ['Order ID', 'Customer', 'Total', 'Status', 'Payment', 'Date']
    const rows = orders.map(o => [
      o.orderNumber,
      o.customer.name,
      o.total.toFixed(2),
      o.status,
      o.paymentStatus,
      new Date(o.createdAt).toLocaleDateString(),
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ message: 'Failed to export data.' })
  }
})

export default router
