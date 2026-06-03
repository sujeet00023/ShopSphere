import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// ── POST /api/coupons (admin creates coupon) ──────────────────────────────
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt } = req.body

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ message: 'Missing required fields.' })
    }

    if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
      return res.status(400).json({ message: 'Invalid discount type.' })
    }

    if (discountType === 'PERCENTAGE' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ message: 'Percentage must be 0-100.' })
    }

    const existing = await prisma.coupon.findUnique({ where: { code } })
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists.' })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderValue: parseFloat(minOrderValue) || 0,
        maxUses: parseInt(maxUses) || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    res.status(201).json({ data: coupon })
  } catch (err) {
    console.error('Create coupon error:', err)
    res.status(500).json({ message: 'Failed to create coupon.' })
  }
})

// ── GET /api/coupons (get all coupons - admin only) ──────────────────────
router.get('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: coupons })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch coupons.' })
  }
})

// ── POST /api/coupons/validate (validate coupon code) ───────────────────
router.post('/validate', async (req, res) => {
  try {
    const { code, orderTotal } = req.body

    if (!code) {
      return res.status(400).json({ message: 'Coupon code required.' })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' })
    }

    // Check if expired
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: 'Coupon has expired.' })
    }

    // Check if max uses reached
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: 'Coupon usage limit reached.' })
    }

    // Check minimum order value
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        message: `Minimum order value is $${coupon.minOrderValue}`,
      })
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderTotal * coupon.discountValue) / 100
    } else {
      discountAmount = coupon.discountValue
    }

    res.json({
      data: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to validate coupon.' })
  }
})

// ── PATCH /api/coupons/:id (update coupon) ────────────────────────────────
router.patch('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { discountValue, maxUses, expiresAt } = req.body

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...(discountValue !== undefined && { discountValue }),
        ...(maxUses !== undefined && { maxUses: parseInt(maxUses) }),
        ...(expiresAt !== undefined && { expiresAt: new Date(expiresAt) }),
      },
    })

    res.json({ data: coupon })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update coupon.' })
  }
})

// ── DELETE /api/coupons/:id (delete coupon) ──────────────────────────────
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } })
    res.json({ message: 'Coupon deleted.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete coupon.' })
  }
})

// ── POST /api/coupons/:id/use (increment coupon usage) ──────────────────
router.post('/:id/use', async (req, res) => {
  try {
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: { usedCount: { increment: 1 } },
    })

    res.json({ data: coupon })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update coupon usage.' })
  }
})

export default router
