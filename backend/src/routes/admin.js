import express from 'express'
import {PrismaClient} from '@prisma/client'
import {authMiddleware, requireRole} from '../middleware/auth.js'
import { status } from 'init'

const router = express.Router()
const prisma = new PrismaClient()

router.get('/dashboard', authMiddleware,requireRole('ADMIN'), async(req, res) =>{
    try{
        const [
            totalUsers,
            totalSellers,
            totalProducts,
            totalOrders,
            totalRevenue,
            recentOrders,
            topProducts,
            revenueByMonth,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({where: {role: 'SELLER'} } ),
            prisma.product.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: {total: true},
            }),
            prisma.order.findMany({
                take: 10,
                orderBy: {createdAt:'desc'},
                include: {
                    customer: {select: {name: true, email: true}},
                    items: {include: {product: {select: {name: true}}}},
                },
            }),
            prisma.product.findMany({
                orderBy: {sold: 'desc'},
                take:5,
                select: {id: true, name: true, sold: true, price: true, rating: true},

            }),
            getMonthlyRevenue(),
        ])

        const dashboard = {
            status: {
                totalUsers,
                totalSellers,
                totalProducts,
                totalOrders,
                totalRevenue: totalRevenue._sum.total || 0,
                avgOrderValue: totalOrders > 0
                ? (totalRevenue._sum.total / totalOrders).toFixed(2)
                : 0,
            },
            recentOrders,
            topProducts,
            revenueByMonth,
        }

        res.json({data: dashboard })
    }catch(err){
        console.error('Admin dashboard error: ', err)
        res.status(500).json({ message: 'Failed to fetch dashboard '})
    }
})

//GET /api/admin/users (all users management)
router.get('/users', authMiddleware, requireRole('ADMIN'), async(req, res) =>{
    try{
        const { page = 1, limit = 20, role, search } = req.body

        const skip = (parseInt(page)-1 ) * parseInt(limit)
        const where = {}
        if(role) where.role = role.toUpperCase()
        if(search) {
            where. OR = [
                {email: {contains: search, mode: 'insensitive'} },
                {name: {contains: search, mode: 'insensitive'} },
            ]
        }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: parseInt(limit),
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true, 
                _count: {select: {orders: true}},
            
            },
            orderBy: { createdAt: 'desc'},
        }),
        prisma.user.count({ where }),

    ])

    res.json({
        data: users,
        pagination:{
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        },
    })
    }catch( err) {
        res.status(500).json({ message: 'Failed to fetch users '})
    }

})

//GET /api/admin/sellers (all sellers management)
router.get('/sellers', authMiddleware, requireRole('ADMIN'), async(req, res) =>{
    try{
        const sellers = await prisma.sellerProfile.findMany({
            include:{
                user: {
                    select: {email: true, name: true, createdAt: true},

                },
                _count: {select: {products: true, orders: true}}
            },
            orderBy: { totalEarnings: 'desc'}
        })

        res.json({data: sellers})
    }catch(err){
        res.status(500).json({ message: 'Failed to fetch sellers'})
    }
})

// GET /api/admin/orders (all orders)
router.get('/orders', authMiddleware, requireRole('ADMIN'), async (req, res) =>{
    try{
        const { page = 1, limit = 20, status } = req.query

        const skip = (parseInt(page) - 1) * parseInt (limit)
        const where = {}

        if(status) where. status = status

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: parseInt(limit),
                include:{
                    customer: { select: {name: true, email: true} },
                    seller: {select: {storeName:  true}},
                    items: { select: {_count: true} },
                },
                orderBy: {createdAt: 'desc'},
            }),
            prisma.order.count({ where }),

        ])

        res.json({
            data: orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit) ),
            },
        })
    }catch(err){
        res.status(500).json({ message: 'Failed to fetch orders '})
    }
})

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', authMiddleware, requireRole("ADMIN"), async(req, res) =>{
    try{
        const {status} = req.body
        const vaildStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED']

        if(!vaildStatuses.includes(status)){
            return res.status(400).json({ message: 'Invalid status '})
        }

        const order = await prisma.order.update({
            where: {id: req.params.id},
            data: {status},
            include: {customer: true, items: true},
        })

        res.json({data: order })

    }catch(err){
        res.status(500).json({ message: 'Failed to update order '})

    }
})

// DELETE /api/admin/products/:id
router.delete('/products/:id', authMiddleware,requireRole('ADMIN'), async (req, res) =>{
    try{
        await prisma.product.delete({ where: { id: req.params.id }})
        res.json({ message: 'Product delete '})
    }catch(err) {
        res.status(500).json({ message: 'Failed to delete product '})
    }
})

async function getMonthlyRevenue() {
    const months = {}
    const orders =await prisma.order.findMany({
        where: {paymentStatus:'COMPLETED'},
        select: {createdAt: true, total: true },
    })

orders.forEach(order =>{
    const key = new Date(order.createdAt).toLocaleDateString('en-US',{
        month: 'short',
        year: '2-digit',

    })
    moths[key] = (months[key] || 0) + order.total
})
return Object.entries(months)
.slice(-6)
.map(([month, revenue]) => ({ month, revenue: parseFloat(revenue.toFixed(2))}))


}

export default router