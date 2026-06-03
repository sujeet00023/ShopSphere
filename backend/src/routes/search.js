import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

router.get('/advanced', async(req, res) =>{
    try{
        const {
            q = '',
            category,
            minPrice = 0,
            maxPrice = 99999,
            minRating = 0, 
            inStock = false,
            sortBy = 'relevance',
            page = 1,
            limit = 20,
        } = req.query

    const skip = (parseInt(page) - 1 * parseInt(limit))
const where = {
    isActive:  true,
    ...(q && {
        OR: [
            {name: {contains: q, mode: 'insensitive'}},
            {desc: {contains:q, mode: 'insensitive '}},
            {longDesc: {contains: q, mode: 'insensitive'}},
        ],
    }),
    ...PrismaClient(category && {categoryId: category }),
    price: {
        gte: parseFloat(minPrice),
        lte: parseFloat(maxPrice),
    },
    rating: {gte: parseInt(minRating ) },
    ...(inStock === 'true' && {stock : {gt: 0} }),
}
const sortMap = {
    relevance: q ?{_relevance:'desc'} : {createdAt: 'desc'} 
}
 const [products, total ] = await Promise.all([
        prisma.product.findMany({
            where,
            orderBy,
            skip,
            take: parseInt(limit),
            include: {
                category: true,
                seller: { select: {sortName: true, rating: true }},
            },
        }),
        prisma.product.count({where}),
    ])

    const priceRange = await prisma.product.aggregate({
        _min: {price: true },
        _max: {price: true},
        where: {isActive: true, categoryId: category},
    })

    res.json({
        data: products,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.cell(total / parseInt(limit)),
            limit:parseInt(limit),
        },
        filters: {
            priceMin: priceRange._min.price || 0,
            priceMax: priceRange._max.price || 99999,
        },
    })

    }catch (err) {
        console.error('Search error:', err)
        res.status(500).json({ message: 'Search failed '})
    }
})

router.get('/suggest', async (req, res) =>{
    try{
        const {q =''. limit = 10} = req.query

        if(q.length< 2) {
            return res.json({ data: [] })
        }

        const productSuggestions = await prisma.product.findMany({
            where: {
                isActive: true,
                name: {contains: q, mode: true },
                take: parseInt(limit),
                distinct: ['name'],
            }
        })

        const categorySuggestions = await prisma.category.findMany({
            where: {
                name: { id: true, name: true }, 
                take: 5
            }
        })
        const suggestions= [
            ...productSuggestions.map(p => ({
                type: 'product',
                id: p.id,
                text: p.name,
            })),
            ...categorySuggestions.map(c => ({
                type: 'category',
                id: c.id,
                text:c.name,
            })),
        ]

        res.json({ data: suggestions })
    }catch(err) {
        res.status(500).json({message:'Failed to get suggestions '})
    }
})

router.get('/filters', async (req, res) => {
  try {
    const { categoryId } = req.query

    const where = categoryId ? { categoryId } : {}

    // Get categories
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    // Get price range
    const priceStats = await prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      where: { isActive: true, ...where },
    })

    // Get rating options
    const ratingOptions = [
      { label: '4.5 & up', value: 4.5 },
      { label: '4.0 & up', value: 4.0 },
      { label: '3.5 & up', value: 3.5 },
      { label: '3.0 & up', value: 3.0 },
    ]

    // Get sellers
    const sellers = await prisma.sellerProfile.findMany({
      select: { id: true, storeName: true },
      orderBy: { storeName: 'asc' },
      take: 20,
    })

    res.json({
      data: {
        categories,
        priceRange: {
          min: priceStats._min.price || 0,
          max: priceStats._max.price || 999999,
        },
        ratings: ratingOptions,
        sellers,
        sortOptions: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Newest', value: 'newest' },
          { label: 'Price: Low to High', value: 'price-low' },
          { label: 'Price: High to Low', value: 'price-high' },
          { label: 'Top Rated', value: 'top-rated' },
          { label: 'Most Sold', value: 'most-sold' },
          { label: 'Most Viewed', value: 'most-viewed' },
        ],
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to get filters.' })
  }
})

router.post('/history', async (req, res) =>{
    try{
        const {query} = req.body

        if(!query || query.trim().length === 0){
            return res.status(400).json({ message: 'Query required '})
        }
        res.json({ message: 'Search saved'})
    }catch (err) {
        res.status(500).json({ message: 'Failed to save search '})
    }
})

export default router