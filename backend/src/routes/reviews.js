import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { update } from 'lodash'

const router = express.Router()
const prisma = new PrismaClient()

// POST /api/reviews (add review)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, rating, title, comment, images = [] } = req.body

    if (!productId || !rating || !title) {
      return res.status(400).json({ message: 'Product, rating, and title are required.' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' })
    }

    // Check if user already reviewed this product
    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId: req.user.id } },
    })

    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this product.' })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: req.user.id,
        rating: parseInt(rating),
        title,
        comment: comment || '',
        images,
      },
      include: { user: { select: { name: true, avatar: true } } },
    })

    // Update product rating
    const allReviews = await prisma.review.findMany({ where: { productId } })
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: allReviews.length,
      },
    })

    res.status(201).json({ data: review })
  } catch (err) {
    console.error('Create review error:', err)
    res.status(500).json({ message: 'Failed to create review.' })
  }
})

// GET /api/reviews/stats/:productId (get review stats)
router.get('/stats/:productId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId },
      select: { rating: true },
    })

    const stats = {
      total: reviews.length,
      average: reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0,
      distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      },
    }

    res.json({ data: stats })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch review stats.' })
  }
})

router.patch('/:id/helpful', authMiddleware, async( req, res) =>{
    try{
        const review = await prisma.review.findUnique({ where: { id: req.params.id }})
         if(!review){
            return res.status(404).json({ message:'Review not found'})

         }
         const updated = await prisma.review.update({
            where: {id: req.params.id},
            data: {helpful: { increment: 1 }},
            include: {user: {select: {name: true, avatar: true } } },
         })

         res.json({ data: update})
    }catch(err){
        res.status(500).json({ message: 'Failed to update review '})
    }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } })

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' })
    }

    // Only review owner or admin can delete
    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    await prisma.review.delete({ where: { id: req.params.id } })

    // Recalculate product rating
    const allReviews = await prisma.review.findMany({
      where: { productId: review.productId },
    })

    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: allReviews.length,
      },
    })

    res.json({ message: 'Review deleted.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete review.' })
  }
})

export default router
