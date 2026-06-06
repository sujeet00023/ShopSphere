import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// ── GET /api/categories (all categories) ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    res.json({ data: categories })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, slug, description, image } = req.body

    console.log('BODY:', req.body)

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        desc: description || null,
        image: image || null,
      },
    })

    res.status(201).json({
      data: category,
      message: 'Category created successfully',
    })
  } catch (err) {
    console.error('CREATE CATEGORY ERROR:', err)

    res.status(500).json({
      message: err.message,
    })
  }
})

// ── GET /api/categories/:id (single category) ───────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { products: { take: 10 } },
    })

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' })
    }

    res.json({ data: category })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch category.' })
  }
})

export default router
