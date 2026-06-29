import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import morgan from 'morgan'
import { PrismaClient } from '@prisma/client'

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const prisma = new PrismaClient()

// ══════════════════════════════════════════════════════════════════════
// MIDDLEWARE SETUP
// ══════════════════════════════════════════════════════════════════════

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))

// Body parser middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Logging middleware
app.use(morgan('combined'))

// ══════════════════════════════════════════════════════════════════════
// IMPORT AUTH MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════
import { authMiddleware,requireRole } from './middleware/auth.js'

// ══════════════════════════════════════════════════════════════════════
// IMPORT ALL ROUTES - PHASE 1
// ══════════════════════════════════════════════════════════════════════

import authRoutes from './routes/auth.js'
import productsRoutes from './routes/products.js'
import categoriesRoutes from './routes/categories.js'
import cartRoutes from './routes/cart.js'
import ordersRoutes from './routes/orders.js'
import usersRoutes from './routes/users.js'
import stripeRoutes from './routes/stripe.js'

// ══════════════════════════════════════════════════════════════════════
// IMPORT ALL ROUTES - PHASE 2
// ══════════════════════════════════════════════════════════════════════

import reviewsRoutes from './routes/reviews.js'
import adminRoutes from './routes/admin.js'
import sellerRoutes from './routes/seller.js'

// ══════════════════════════════════════════════════════════════════════
// IMPORT ALL ROUTES - PHASE 3
// ══════════════════════════════════════════════════════════════════════

import couponsRoutes from './routes/coupons.js'
import invoicesRoutes from './routes/invoices.js'
import analyticsRoutes from './routes/analytics.js'
import inventoryRoutes from './routes/inventory.js'
import recommendationsRoutes from './routes/recommendations.js'
import searchRoutes from './routes/search.js'
import razorpayRoutes from './routes/razorpay.js'

// ══════════════════════════════════════════════════════════════════════
// HEALTH CHECK ENDPOINT
// ══════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'ShopSphere Backend is running',
  })
})

// ══════════════════════════════════════════════════════════════════════
// API VERSION ENDPOINT
// ══════════════════════════════════════════════════════════════════════

app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    phase: 'Phase 3 (Complete)',
    features: {
      phase1: ['Auth', 'Products', 'Cart', 'Orders', 'Payments'],
      phase2: ['Reviews', 'Admin Dashboard', 'Seller Dashboard'],
      phase3: ['Coupons', 'Invoices', 'Analytics', 'Inventory', 'Recommendations', 'Search'],
    },
    endpoints: 73,
    lastUpdated: new Date().toISOString(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/stripe', stripeRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/seller', sellerRoutes)
app.use('/api/coupons', couponsRoutes)
app.use('/api/invoices', invoicesRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/recommendations', recommendationsRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/razorpay', razorpayRoutes)
console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);
console.log("KEY SECRET:", process.env.RAZORPAY_KEY_SECRET);
// ══════════════════════════════════════════════════════════════════════
// 404 ERROR HANDLER
// ══════════════════════════════════════════════════════════════════════

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  })
})

// ══════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ══════════════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  console.error('Error:', err)

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      details: err.message,
    })
  }

  // Prisma unique constraint errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      status: 'error',
      message: 'Resource already exists',
      field: err.meta?.target?.[0],
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    })
  }

  // Default error
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  })
})

// ══════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION & SERVER START
// ══════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Start server
    app.listen(PORT, () => {
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// ══════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ══════════════════════════════════════════════════════════════════════

process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  console.log('✅ Database connection closed')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  console.log('✅ Database connection closed')
  process.exit(0)
})

// ══════════════════════════════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════════════════════════════

startServer()

export default app