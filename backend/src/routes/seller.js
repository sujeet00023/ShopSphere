import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole } from '../middleware/auth.js'


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
  where: {
    sellerId: seller.id,
    status: 'DELIVERED'
  },
  _sum: {
    total: true
  }
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
  customer: {
    select: {
      name: true,
      email: true,
    },
  },
  items: true,
}
      }),
      prisma.product.findMany({
        where: { sellerId: seller.id },
        orderBy: { sold: 'desc' },
        take: 5,
        select: { id: true, name: true, sold: true, price: true, stock: true },
      }),
      getSellerMonthlyRevenue(seller.id),
    ])

const completedOrders = await prisma.order.count({
  where: {
    sellerId: seller.id,
    status: 'DELIVERED'
  }
})

    const dashboard = {
      store: {
        id: seller.id,
        name: seller.storeName,
        description: seller.storeDesc,
        rating: seller.rating,
        totalProducts,
      },
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        averageOrderValue:
  completedOrders > 0
    ? ((totalRevenue._sum.total || 0) / completedOrders).toFixed(2)
    : 0,
      },
      recentOrders,
      topProducts,
      monthlyRevenue,
    }
/* const debugOrders = await prisma.order.findMany({
  where: { sellerId: seller.id },
  select: {
    id: true,
    total: true,
    paymentStatus: true,
    status: true
  }
})

console.log(JSON.stringify(debugOrders, null, 2)) */
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
const {
  page = 1,
  limit = 20,
  status,
  cancelled,
  refundStatus
} = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = { sellerId: seller.id }

    // Orders tab
if (cancelled === 'false') {
  where.status = {
    not: 'CANCELLED'
  }
}

// Cancelled tab
if (cancelled === 'true') {
  where.status = 'CANCELLED'
}

// Status filter
if (status) {
  where.status = status
}

// Refund filter
if (refundStatus) {
  where.refundStatus = refundStatus
}
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
    customer: {
        select: {
            name: true,
            email: true,
            phone: true
        }
    },

    items: {
        include: {
            product: {
                select: {
                    name: true,
                    thumbnail: true
                }
            }
        }
    },

    shipping: true,

    refundHistory: true
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


// GET /api/seller/returns
router.get('/returns',authMiddleware,requireRole('SELLER'),async (req, res) => {
    try {
      const seller = await prisma.sellerProfile.findUnique({
        where: {
          userId: req.user.id
        }
      })

      if (!seller) {
        return res.status(404).json({
          message: 'Seller profile not found.'
        })
      }

      const returns = await prisma.order.findMany({
        where: {
          sellerId: seller.id,
          OR: [
            {
              status: 'RETURNED'
            },
            {
              refundStatus: {
                not: 'NONE'
              }
            }
          ]
        },
        include: {
          customer: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  thumbnail: true
                }
              }
            }
          },
          shipping: true,
          refundHistory: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      res.json({
       data: returns
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({
        message: 'Failed to fetch returns.'
      })
    }
  }
)

// PATCH /api/seller/orders/:id/request-refund
router.patch('/orders/:id/request-refund',authMiddleware,requireRole('SELLER'),async (req, res) => {
    try {
      const seller = await prisma.sellerProfile.findUnique({
        where: {
          userId: req.user.id,
        },
      })

      if (!seller) {
        return res.status(404).json({
          message: 'Seller not found.',
        })
      }

      const order = await prisma.order.findUnique({
        where: {
          id: req.params.id,
        },
      })

      if (!order || order.sellerId !== seller.id) {
        return res.status(403).json({
          message: 'Unauthorized.',
        })
      }

      if (order.status !== 'CANCELLED') {
        return res.status(400).json({
          message: 'Only cancelled orders can be refunded.',
        })
      }

      const updated = await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          refundStatus: 'PROCESSING',
        },
      })

      await prisma.refundHistory.create({
        data: {
          orderId: order.id,
          amount: order.total,
          status: 'PROCESSING',
          createdBy: seller.userId,
          remarks: 'Refund initiated by seller',
        },
      })

      res.json({
        message: 'Refund initiated.',
        data: updated,
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({
        message: 'Failed to initiate refund.',
      })
    }
  }
)


// POST /api/seller/orders/:id/process-refund
router.post('/orders/:id/process-refund', authMiddleware, requireRole('SELLER'), async (req, res) => {
  try {
    const { refundAmount, reason, notes } = req.body

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ message: 'Valid refund amount is required.' })
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    })

    if (!seller) return res.status(404).json({ message: 'Seller not found.' })

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true }
    })

    if (!order || order.sellerId !== seller.id) {
      return res.status(403).json({ message: 'Unauthorized.' })
    }
  
    if (order.status !== 'CANCELLED' && order.status !== 'RETURNED') {
      return res.status(400).json({ message: 'Only cancelled or returned orders can be refunded.' })
    }

    if (refundAmount > (order.refundAmount || order.total)) {
      return res.status(400).json({ message: 'Refund amount exceeds allowed amount.' })
    }

    // 1. Update Order
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        refundStatus: 'REFUNDED',
        refundedAmount: refundAmount,
        refundedAt: new Date(),
        paymentStatus: 'REFUNDED',
      }
    })
  
    // 2. Create Refund History
    await prisma.refundHistory.create({
      data: {
        orderId: order.id,
        amount: refundAmount,
        status: 'REFUNDED',
        remarks: notes || reason || 'Refund processed by seller',
        createdBy: seller.userId,
      }
    })

    // 3. Credit User's Wallet (Most Important)
    let wallet = await prisma.wallet.findUnique({
      where: { userId: order.customerId }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: order.customerId, balance: 0 }
      })
    }

    const newBalance = wallet.balance + refundAmount

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance }
    })

    // 4. Record Wallet Transaction
    await prisma.walletTransaction.create({
      data: {
        userId: order.customerId,
        walletId: wallet.id,
        amount: refundAmount,
        type: 'CREDIT',
        description: `Refund for Order #${order.orderNumber || order.id}`,
        orderId: order.id,
      }
    })

    res.json({
      message: 'Refund processed successfully. Amount credited to customer wallet.',
      data: updatedOrder
    })

  } catch (err) {
    console.error('Process Refund Error:', err)
    res.status(500).json({ message: 'Failed to process refund.' })
  }
})

// PATCH /api/seller/orders/:id/approve-refund
router.patch('/orders/:id/approve-refund',authMiddleware,requireRole('SELLER'),async (req, res) => {
    try {
      const seller = await prisma.sellerProfile.findUnique({
        where: {
          userId: req.user.id,
        },
      })

      const order = await prisma.order.findUnique({
        where: {
          id: req.params.id,
        },
      })

      if (!order || order.sellerId !== seller.id) {
        return res.status(403).json({
          message: 'Unauthorized.',
        })
      }

      const updated = await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          refundStatus: 'APPROVED',
        },
      })

      await prisma.refundHistory.create({
        data: {
          orderId: order.id,
          amount: order.total,
          status: 'APPROVED',
          createdBy: seller.userId,
          remarks: 'Refund approved',
        },
      })

      res.json({
        data: updated,
      })
    } catch (err) {
      res.status(500).json({
        message: 'Failed.',
      })
    }
  }
)

// PATCH /api/seller/orders/:id/complete-refund
router.patch('/orders/:id/complete-refund',authMiddleware,requireRole('SELLER'),async (req, res) => {
    try {
      const seller = await prisma.sellerProfile.findUnique({
        where: {
          userId: req.user.id,
        },
      })

      const order = await prisma.order.findUnique({
        where: {
          id: req.params.id,
        },
      })

      if (!order || order.sellerId !== seller.id) {
        return res.status(403).json({
          message: 'Unauthorized.',
        })
      }

      const updated = await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          refundStatus: 'REFUNDED',
          paymentStatus: 'REFUNDED',
          refundedAt: new Date(),
        },
      })

      await prisma.refundHistory.create({
        data: {
          orderId: order.id,
          amount: order.total,
          status: 'REFUNDED',
          createdBy: seller.userId,
          remarks: 'Refund completed',
        },
      })

      res.json({
        data: updated,
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({
        message: 'Failed.',
      })
    }
  }
)


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
        months[key] = (months[key] || 0) + order.total
    })

    return Object.entries(months)
    .slice(-6)
    .map(([month, revenue]) => ({month, revenue: parseFloat(revenue.toFixed(2))}))
    
}

export default router