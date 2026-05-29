import express from 'express'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ── POST /api/stripe/create-payment-intent ──────────────────────────────
router.post('/create-payment-intent', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required.' })
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: { select: { email: true, name: true } } },
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    // Verify customer
    if (order.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      description: `Order #${order.orderNumber}`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
      },
      receipt_email: order.customer.email,
    })

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (err) {
    console.error('Create payment intent error:', err)
    res.status(500).json({ message: 'Failed to create payment intent.' })
  }
})

// ── POST /api/stripe/webhook (handle Stripe webhooks) ────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature']
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(400).json({ message: `Webhook Error: ${err.message}` })
  }
})

async function handlePaymentSuccess(paymentIntent) {
  const { metadata } = paymentIntent

  if (metadata?.orderId) {
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: {
        paymentStatus: 'COMPLETED',
        status: 'CONFIRMED',
      },
    })

    console.log(`✅ Payment confirmed for order ${metadata.orderNumber}`)
  }
}

async function handlePaymentFailed(paymentIntent) {
  const { metadata } = paymentIntent

  if (metadata?.orderId) {
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: { paymentStatus: 'FAILED' },
    })

    console.log(`❌ Payment failed for order ${metadata.orderNumber}`)
  }
}

// ── GET /api/stripe/order-status/:orderId (check payment status) ──────────
router.get('/order-status/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: { paymentStatus: true, status: true, stripePaymentIntentId: true },
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    let stripeStatus = null
    if (order.stripePaymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId)
      stripeStatus = intent.status
    }

    res.json({
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      stripeStatus,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order status.' })
  }
})

export default router
