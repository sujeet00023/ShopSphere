import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Clear existing data
    await prisma.review.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.wishlistItem.deleteMany()
    await prisma.product.deleteMany()
    await prisma.address.deleteMany()
    await prisma.sellerProfile.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()

    // Create categories
    const electronics = await prisma.category.create({
      data: { name: 'Electronics', slug: 'electronics', image: 'https://via.placeholder.com/200?text=Electronics' },
    })
    const fashion = await prisma.category.create({
      data: { name: 'Fashion', slug: 'fashion', image: 'https://via.placeholder.com/200?text=Fashion' },
    })
    const home = await prisma.category.create({
      data: { name: 'Home & Garden', slug: 'home-garden', image: 'https://via.placeholder.com/200?text=Home' },
    })

    // Create users
    const customerPassword = await bcrypt.hash('password123', 12)
    const sellerPassword = await bcrypt.hash('password123', 12)
    const adminPassword = await bcrypt.hash('password123', 12)

    const customer = await prisma.user.create({
      data: {
        email: 'customer@example.com',
        name: 'John Doe',
        password: customerPassword,
        role: 'CUSTOMER',
        phone: '+1234567890',
      },
    })

    const seller1 = await prisma.user.create({
      data: {
        email: 'seller1@example.com',
        name: 'TechStore',
        password: sellerPassword,
        role: 'SELLER',
        phone: '+1987654321',
      },
    })

    const seller2 = await prisma.user.create({
      data: {
        email: 'seller2@example.com',
        name: 'Fashion Hub',
        password: sellerPassword,
        role: 'SELLER',
        phone: '+1555666777',
      },
    })

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
        phone: '+1111111111',
      },
    })

    // Create seller profiles
    const sellerProfile1 = await prisma.sellerProfile.create({
      data: {
        userId: seller1.id,
        storeName: 'TechStore Pro',
        storeDesc: 'Premium electronics and gadgets',
        totalProducts: 0,
      },
    })

    const sellerProfile2 = await prisma.sellerProfile.create({
      data: {
        userId: seller2.id,
        storeName: 'Fashion Hub',
        storeDesc: 'Latest fashion trends',
        totalProducts: 0,
      },
    })

    // Create products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Wireless Headphones Pro',
          slug: 'wireless-headphones-pro',
          desc: 'Premium wireless headphones with noise cancellation',
          longDesc: 'Experience premium sound quality with active noise cancellation technology...',
          price: 199.99,
          discountPct: 10,
          stock: 50,
          categoryId: electronics.id,
          sellerId: sellerProfile1.id,
          thumbnail: 'https://via.placeholder.com/300?text=Headphones',
          images: ['https://via.placeholder.com/300?text=Headphones'],
        },
      }),
      prisma.product.create({
        data: {
          name: 'Smart Watch Ultra',
          slug: 'smart-watch-ultra',
          desc: 'Advanced smartwatch with health tracking',
          longDesc: 'Monitor your health with advanced sensors and features...',
          price: 399.99,
          discountPct: 15,
          stock: 30,
          categoryId: electronics.id,
          sellerId: sellerProfile1.id,
          thumbnail: 'https://via.placeholder.com/300?text=SmartWatch',
          images: ['https://via.placeholder.com/300?text=SmartWatch'],
        },
      }),
      prisma.product.create({
        data: {
          name: 'Classic Cotton T-Shirt',
          slug: 'classic-cotton-tshirt',
          desc: 'Comfortable everyday cotton t-shirt',
          longDesc: 'Made from 100% organic cotton for maximum comfort...',
          price: 29.99,
          discountPct: 20,
          stock: 100,
          categoryId: fashion.id,
          sellerId: sellerProfile2.id,
          thumbnail: 'https://via.placeholder.com/300?text=TShirt',
          images: ['https://via.placeholder.com/300?text=TShirt'],
        },
      }),
      prisma.product.create({
        data: {
          name: 'Premium Jeans',
          slug: 'premium-jeans',
          desc: 'High-quality denim jeans for all occasions',
          longDesc: 'Crafted from premium denim with perfect fit...',
          price: 79.99,
          discountPct: 10,
          stock: 75,
          categoryId: fashion.id,
          sellerId: sellerProfile2.id,
          thumbnail: 'https://via.placeholder.com/300?text=Jeans',
          images: ['https://via.placeholder.com/300?text=Jeans'],
        },
      }),
      prisma.product.create({
        data: {
          name: 'Desk Lamp LED',
          slug: 'desk-lamp-led',
          desc: 'Modern LED desk lamp with adjustable brightness',
          longDesc: 'Eco-friendly LED lamp perfect for your workspace...',
          price: 49.99,
          discountPct: 25,
          stock: 40,
          categoryId: home.id,
          sellerId: sellerProfile1.id,
          thumbnail: 'https://via.placeholder.com/300?text=DeskLamp',
          images: ['https://via.placeholder.com/300?text=DeskLamp'],
        },
      }),
    ])

    // Create addresses
    const address = await prisma.address.create({
      data: {
        userId: customer.id,
        fullName: 'John Doe',
        phone: '+1234567890',
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        isDefault: true,
      },
    })

    console.log('✅ Database seeded successfully!')
    console.log('\n📝 Demo Accounts:')
    console.log('Customer: customer@example.com / password123')
    console.log('Seller: seller1@example.com / password123')
    console.log('Seller: seller2@example.com / password123')
    console.log('Admin: admin@example.com / password123')
  } catch (err) {
    console.error('❌ Seeding error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
