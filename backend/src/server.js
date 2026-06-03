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

// ══════════════════════════════════════════════════════════════════════
// REGISTER ROUTES - PHASE 1
// ══════════════════════════════════════════════════════════════════════

// Authentication Routes
// POST   /api/auth/register    - Register new user
// POST   /api/auth/login       - Login user
// GET    /api/auth/me          - Get current user
// PUT    /api/auth/profile     - Update user profile
app.use('/api/auth', authRoutes)

// Products Routes
// GET    /api/products         - Get all products
// GET    /api/products/:id     - Get product details
// POST   /api/products         - Create product (seller)
// PUT    /api/products/:id     - Update product (seller)
// DELETE /api/products/:id     - Delete product (seller)
app.use('/api/products', productsRoutes)

// Categories Routes
// GET    /api/categories       - Get all categories
// GET    /api/categories/:id   - Get category details
app.use('/api/categories', categoriesRoutes)

// Cart Routes
// GET    /api/cart             - Get cart
// POST   /api/cart             - Add to cart
// PUT    /api/cart/:id         - Update cart item
// DELETE /api/cart/:id         - Remove from cart
// DELETE /api/cart             - Clear cart
app.use('/api/cart', cartRoutes)

// Orders Routes
// GET    /api/orders           - Get user orders
// POST   /api/orders           - Create order
// GET    /api/orders/:id       - Get order details
// PATCH  /api/orders/:id/status - Update order status (admin)
app.use('/api/orders', ordersRoutes)

// Users Routes
// GET    /api/users/profile    - Get user profile
// PUT    /api/users/profile    - Update profile
// GET    /api/users/addresses  - Get addresses
// POST   /api/users/wishlist   - Add to wishlist
// DELETE /api/users/wishlist/:id - Remove from wishlist
app.use('/api/users', usersRoutes)

// Stripe Routes (Payment)
// POST   /api/stripe/create-payment-intent  - Create payment intent
// POST   /api/stripe/webhook                - Handle webhook
// GET    /api/stripe/order-status/:id       - Get order payment status
app.use('/api/stripe', stripeRoutes)

// ══════════════════════════════════════════════════════════════════════
// REGISTER ROUTES - PHASE 2
// ══════════════════════════════════════════════════════════════════════

// Reviews Routes
// POST   /api/reviews              - Create review
// GET    /api/reviews/product/:id  - Get product reviews
// GET    /api/reviews/stats/:id    - Get review stats
// PATCH  /api/reviews/:id/helpful  - Mark review as helpful
// DELETE /api/reviews/:id          - Delete review
app.use('/api/reviews', reviewsRoutes)

// Admin Routes
// GET    /api/admin/dashboard      - Admin dashboard stats
// GET    /api/admin/users          - Get all users
// GET    /api/admin/sellers        - Get all sellers
// GET    /api/admin/orders         - Get all orders
// PATCH  /api/admin/orders/:id/status - Update order status
// DELETE /api/admin/products/:id   - Delete product
app.use('/api/admin', adminRoutes)

// Seller Routes
// GET    /api/seller/dashboard     - Seller dashboard stats
// GET    /api/seller/analytics     - Seller analytics
// GET    /api/seller/orders        - Seller orders
// GET    /api/seller/reviews       - Seller product reviews
// PATCH  /api/seller/orders/:id/status - Update seller order status
app.use('/api/seller', sellerRoutes)

// ══════════════════════════════════════════════════════════════════════
// REGISTER ROUTES - PHASE 3
// ══════════════════════════════════════════════════════════════════════

// Coupons Routes
// POST   /api/coupons              - Create coupon (admin)
// GET    /api/coupons              - List coupons (admin)
// POST   /api/coupons/validate     - Validate coupon code
// PATCH  /api/coupons/:id          - Update coupon (admin)
// DELETE /api/coupons/:id          - Delete coupon (admin)
// POST   /api/coupons/:id/use      - Track coupon usage
app.use('/api/coupons', couponsRoutes)

// Invoices Routes
// GET    /api/invoices/:orderId    - Generate invoice
// GET    /api/invoices/:orderId/download - Download invoice
app.use('/api/invoices', invoicesRoutes)

// Analytics Routes
// GET    /api/analytics/admin/detailed    - Admin analytics
// GET    /api/analytics/seller/detailed   - Seller analytics
// GET    /api/analytics/export/csv        - Export as CSV
app.use('/api/analytics', analyticsRoutes)

// Inventory Routes
// GET    /api/inventory             - Get inventory
// PATCH  /api/inventory/:id         - Update stock
// GET    /api/inventory/alerts      - Get low stock alerts
// POST   /api/inventory/bulk-update - Bulk update inventory
// GET    /api/inventory/history     - Stock change history
app.use('/api/inventory', inventoryRoutes)

// Recommendations Routes
// GET    /api/recommendations/trending        - Trending products
// GET    /api/recommendations/bestsellers     - Best sellers
// GET    /api/recommendations/toprated        - Top rated products
// GET    /api/recommendations/similar/:id     - Similar products
// GET    /api/recommendations/personalized    - Personalized (user)
// GET    /api/recommendations/frequent-bought/:id - Frequently bought together
// GET    /api/recommendations/category/:id    - Category products
app.use('/api/recommendations', recommendationsRoutes)

// Search Routes
// GET    /api/search/advanced      - Advanced search with filters
// GET    /api/search/suggest       - Search suggestions
// GET    /api/search/filters       - Available filters
// POST   /api/search/history       - Save search history
app.use('/api/search', searchRoutes)

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
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          🛍️  SHOPSPHERE BACKEND - PHASE 3 COMPLETE            ║
║                                                                ║
║  ✅ Phase 1: MVP (Auth, Products, Cart, Orders)              ║
║  ✅ Phase 2: Professional (Admin, Seller, Reviews)           ║
║  ✅ Phase 3: Advanced (Coupons, Analytics, Inventory)        ║
║                                                                ║
║  🚀 Server running on: http://localhost:${PORT}                       ║
║  📊 API Version: 1.0.0                                         ║
║  📍 Endpoints: 73+                                             ║
║  🔗 Database: PostgreSQL (Connected)                          ║
║                                                                ║
║  Available Endpoints:                                          ║
║    • /health                - Health check                    ║
║    • /api/version           - API version info                ║
║    • /api/auth/*            - Authentication (Phase 1)        ║
║    • /api/products/*        - Products (Phase 1)              ║
║    • /api/cart/*            - Shopping Cart (Phase 1)         ║
║    • /api/orders/*          - Orders (Phase 1)                ║
║    • /api/stripe/*          - Payments (Phase 1)              ║
║    • /api/reviews/*         - Reviews (Phase 2)               ║
║    • /api/admin/*           - Admin (Phase 2)                 ║
║    • /api/seller/*          - Seller (Phase 2)                ║
║    • /api/coupons/*         - Coupons (Phase 3)               ║
║    • /api/invoices/*        - Invoices (Phase 3)              ║
║    • /api/analytics/*       - Analytics (Phase 3)             ║
║    • /api/inventory/*       - Inventory (Phase 3)             ║
║    • /api/recommendations/* - Recommendations (Phase 3)       ║
║    • /api/search/*          - Search (Phase 3)                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `)
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