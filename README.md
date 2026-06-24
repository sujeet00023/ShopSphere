# 🛍️ ShopSphere - Multi-Vendor E-Commerce Platform

A modern, fully-featured multi-vendor e-commerce platform built with Next.js, Node.js, PostgreSQL, and Prisma.

## 🎯 Overview

ShopSphere is a comprehensive e-commerce platform that supports multiple sellers, customers, and administrators. It provides a complete ecosystem for buying and selling products online with modern features like product reviews, wishlist management, advanced search, inventory tracking, and analytics.

**Key Highlights:**
- ✅ Multi-vendor marketplace
- ✅ Advanced product search & filtering
- ✅ Secure payment integration (Stripe)
- ✅ Order management system
- ✅ Seller dashboard & analytics
- ✅ Admin control panel
- ✅ User-friendly interface
- ✅ Production-ready

---

## ✨ Features

### 👥 For Customers
- ✅ User registration & authentication
- ✅ Browse products with advanced search
- ✅ Product filtering by category, price, rating
- ✅ Shopping cart management
- ✅ Secure checkout with Stripe
- ✅ Order tracking & history
- ✅ Product reviews & ratings
- ✅ Wishlist management
- ✅ User dashboard with analytics
- ✅ Saved delivery addresses
- ✅ Order invoices & receipts

### 🏪 For Sellers
- ✅ Seller registration & store setup
- ✅ Product management (CRUD)
- ✅ Inventory management
- ✅ Order management
- ✅ Sales analytics & reports
- ✅ Revenue tracking
- ✅ Seller dashboard
- ✅ Product visibility control
- ✅ Rating & review management

### ⚙️ For Admins
- ✅ User management
- ✅ Seller management & verification
- ✅ Product moderation
- ✅ Category management
- ✅ Order management
- ✅ Coupon management
- ✅ Platform analytics
- ✅ Revenue reports
- ✅ System statistics

### 🔧 Technical Features
- ✅ JWT authentication
- ✅ Role-based access control (RBAC)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Server-side pagination
- ✅ Real-time notifications (Toast)
- ✅ Data validation
- ✅ Error handling
- ✅ API rate limiting ready
- ✅ SEO optimized

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14
- **Language:** JavaScript (React)
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast
- **Animations:** Framer Motion
- **Icons:** Emoji & Custom SVGs

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens)
- **Payment:** Stripe API
- **Validation:** Built-in validation

### DevTools
- **Package Manager:** npm
- **Version Control:** Git
- **Database Client:** pgAdmin / DBeaver
- **API Testing:** Postman / Insomnia

---

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Git installed
- npm or yarn package manager

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/shopsphere.git
cd shopsphere
```

### Step 2: Setup Backend

#### 2.1 Navigate to backend
```bash
cd backend
```

#### 2.2 Install dependencies
```bash
npm install
```

#### 2.3 Create environment file
```bash
cp .env.example .env
```

#### 2.4 Configure .env file
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/shopsphere"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRE="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_key"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"

# Server
PORT=5000
NODE_ENV="development"
```

#### 2.5 Setup database
```bash
# Create database
npx prisma migrate dev --name init

# Seed demo data
npm run seed
```

#### 2.6 Start backend
```bash
npm run dev
```

Backend runs on: `http://localhost:5000`

---

### Step 3: Setup Frontend

#### 3.1 Navigate to frontend (new terminal)
```bash
cd frontend
```

#### 3.2 Install dependencies
```bash
npm install
```

#### 3.3 Create environment file
```bash
cp .env.local.example .env.local
```

#### 3.4 Configure .env.local
```env
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:5000/api"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_key"

# Admin Code (for registration)
NEXT_PUBLIC_ADMIN_CODE="your-admin-code-here"
```

#### 3.5 Start frontend
```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

### Step 4: Test the Application

#### Open in Browser
```
http://localhost:3000
```

#### Login with Demo Accounts
- **Customer:** customer@example.com / password123
- **Seller:** seller1@example.com / password123
- **Admin:** admin@example.com / password123

---

## 📁 Project Structure

```
shopsphere/
├── frontend/                      # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (pages)/          # Route group
│   │   │   │   ├── auth/         # Login, Register
│   │   │   │   ├── products/     # Product pages
│   │   │   │   ├── cart/         # Shopping cart
│   │   │   │   ├── checkout/     # Checkout
│   │   │   │   ├── orders/       # Order pages
│   │   │   │   ├── admin/        # Admin pages
│   │   │   │   ├── seller/       # Seller pages
│   │   │   │   └── user/         # User dashboard
│   │   │   ├── page.jsx          # Homepage
│   │   │   ├── layout.jsx        # Root layout
│   │   │   └── globals.css       # Global styles
│   │   ├── components/           # Reusable components
│   │   │   ├── Navigation.jsx
│   │   │   ├── ProductGrid.jsx
│   │   │   ├── ProductReviews.jsx
│   │   │   └── Recommendations.jsx
│   │   ├── store/                # Zustand stores
│   │   │   ├── authStore.js
│   │   │   └── cartStore.js
│   │   └── utils/
│   │       └── api.js            # Axios instance
│   ├── package.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── .env.local
│
├── backend/                       # Express.js backend application
│   ├── src/
│   │   ├── server.js             # Main server file
│   │   ├── routes/               # API routes
│   │   │   ├── auth.js           # Authentication
│   │   │   ├── products.js       # Products
│   │   │   ├── categories.js     # Categories
│   │   │   ├── cart.js           # Cart
│   │   │   ├── orders.js         # Orders
│   │   │   ├── reviews.js        # Reviews
│   │   │   ├── wishlist.js       # Wishlist
│   │   │   ├── admin.js          # Admin routes
│   │   │   ├── seller.js         # Seller routes
│   │   │   ├── user.js           # User routes
│   │   │   ├── search.js         # Search
│   │   │   ├── coupons.js        # Coupons
│   │   │   ├── analytics.js      # Analytics
│   │   │   ├── inventory.js      # Inventory
│   │   │   ├── invoices.js       # Invoices
│   │   │   └── recommendations.js # Recommendations
│   │   ├── middleware/
│   │   │   └── auth.js           # Auth middleware
│   │   ├── utils/
│   │   │   ├── prisma.js         # Prisma client
│   │   │   ├── seed.js           # Database seeding
│   │   │   └── email.js          # Email service
│   │   └── models/               # Data models (Prisma)
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── package.json
│   ├── .env
│   └── .env.example
│
└── README.md                      # This file
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/shopsphere"

# JWT
JWT_SECRET="change-this-to-a-secure-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Server
PORT=5000
NODE_ENV="development"
```

#### Frontend (.env.local)
```env
# API
NEXT_PUBLIC_API_URL="http://localhost:5000/api"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Admin
NEXT_PUBLIC_ADMIN_CODE="admin-registration-code"
```

---

## 🔍 Available Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run seed         # Seed database with demo data
npm run migrate      # Run Prisma migrations
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** 
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database credentials

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
```

### JWT Token Error
```
Invalid token
```
**Solution:**
- Ensure JWT_SECRET is set in .env
- Check token is valid (not expired)
- Verify Authorization header format: `Bearer {token}`

### Stripe Payment Error
```
Error: Invalid API Key
```
**Solution:**
- Verify STRIPE_SECRET_KEY is correct
- Use test keys for development
- Check Stripe dashboard for keys

### Prisma Migration Error
```
Error: Column does not exist
```
**Solution:**
```bash
# Reset database and re-migrate
npx prisma migrate reset

# Or check for schema conflicts
npx prisma db push --force-reset
```

---

## 📚 API Testing

### Using Postman
1. Import the API collection from `/docs/postman-collection.json`
2. Set environment variables (base_url, token)
3. Test endpoints

### Using cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get Products
curl -X GET "http://localhost:5000/api/products?page=1" \
  -H "Authorization: Bearer {token}"
```

---

## 🚀 Deployment

### Vercel (Frontend)
1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy

### Heroku (Backend)
1. Create Heroku app
2. Connect PostgreSQL
3. Set environment variables
4. Deploy with Git

### Docker (Both)
```bash
docker-compose up -d
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For support, email support@shopsphere.com or create an issue on GitHub.

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Live chat support
- [ ] Video product reviews
- [ ] AI-powered recommendations
- [ ] Subscription products
- [ ] Gift cards
- [ ] Social media integration
- [ ] Multi-language support

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | 5,800+ |
| API Endpoints | 73+ |
| Database Tables | 13 |
| Frontend Pages | 15+ |
| Components | 7+ |
| Routes | 16+ |

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- Stripe for payment processing
- TailwindCSS for beautiful styling
- The open-source community

---

## 📝 Changelog

### v1.0 (Current)
- Initial release
- All core features implemented
- Admin panel complete
- Seller dashboard complete
- User dashboard complete

---

**Made with ❤️ by Sujeetkhupase**

Last updated: June 2026