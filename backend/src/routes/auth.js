import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

function signToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// ── POST /api/auth/register ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'CUSTOMER' } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required.' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
    })

    // Create seller profile if registering as seller
    if (role === 'SELLER') {
      await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          storeName: name,
        },
      })
    }

    const token = signToken(user.id, user.role)
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Registration failed.' })
  }
})

// ── POST /api/auth/login 
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      })
    }

    console.log('LOGIN ATTEMPT:', email)

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    })

    console.log('USER FOUND:', !!user)

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    console.log('PASSWORD MATCH:', isMatch)

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      })
    }

    const token = signToken(user.id, user.role)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({
      message: 'Login failed.'
    })
  }
})

//  GET /api/auth/me 
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, phone: true },
    })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user.' })
  }
})

export default router
