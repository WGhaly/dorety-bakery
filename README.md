# 🥐 Dorety Bakery - Modern E-commerce Platform

A full-stack e-commerce platform built with Next.js 16, featuring a complete bakery ordering system with user authentication, cart management, and order processing.

## ✨ Features

### 🛒 Customer Features
- **User Authentication**: Secure login/registration with NextAuth.js
- **Product Catalog**: Browse fresh bakery items by category
- **Shopping Cart**: Add, remove, and modify quantities
- **Checkout System**: Complete 3-step checkout process
- **Order Management**: View order history and track status
- **Address Management**: Save and manage delivery addresses
- **Multiple Fulfillment Options**: Delivery or pickup
- **Payment Methods**: Cash on Delivery (COD)

### 🔧 Admin Features
- **Order Management**: Track and update order status
- **Product Management**: CRUD operations for bakery items
- **Customer Management**: View customer information
- **Financial Tracking**: Integrated ledger system with chart of accounts

### 🏗️ Technical Features
- **Modern Stack**: Next.js 16 with Turbopack
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **UI/UX**: Tailwind CSS with responsive design
- **State Management**: React hooks and context
- **File Upload**: Image handling for product media
- **Email System**: Order notifications and confirmations
- **Testing**: Playwright for E2E testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or later
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dorety-bakery.git
   cd dorety-bakery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables:
   ```env
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL="file:./dev.db"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx tsx scripts/seed.ts
   npx tsx scripts/init-chart-of-accounts.ts
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js 16 App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout process
│   ├── orders/            # Order management
│   └── products/          # Product catalog
├── components/            # Reusable UI components
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # NextAuth configuration
│   └── ledger.ts         # Financial tracking
├── types/                 # TypeScript definitions
└── hooks/                 # Custom React hooks

prisma/
├── schema.prisma         # Database schema
├── migrations/           # Database migrations
└── seed.ts              # Database seeding

scripts/
├── seed.ts              # Main seed script
├── seed-catalog.ts      # Product catalog seeding
├── seed-banners.ts      # Banner seeding
└── init-chart-of-accounts.ts  # Accounting setup
```

## 🧪 Testing

The project includes comprehensive E2E testing with Playwright:

```bash
# Run E2E tests
npm run test:e2e

# Run specific test suites
npx playwright test auth-fixes-verification.spec.ts
npx playwright test authentication-interactive.spec.ts
```

## 🛠️ Development

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# View database
npx prisma studio
```

### Seeding Data
```bash
# Seed all data
npx tsx scripts/seed.ts

# Seed specific data
npx tsx scripts/seed-catalog.ts
npx tsx scripts/seed-banners.ts
npx tsx scripts/init-chart-of-accounts.ts
```

## 🏪 Demo Accounts

### Customer Account
- **Email**: john@example.com
- **Password**: customer123

### Admin Account  
- **Email**: admin@doretybakery.com
- **Password**: admin123

## 🔧 Configuration

### Environment Variables
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `NEXTAUTH_URL`: Application URL
- `DATABASE_URL`: Database connection string
- `SMTP_*`: Email configuration (optional)

### Database Schema
The application uses Prisma with the following main models:
- **User**: Customer and admin accounts
- **Product**: Bakery items with categories
- **Order**: Customer orders with items
- **Cart**: Shopping cart management
- **Address**: Customer delivery addresses
- **Ledger**: Financial tracking and accounting

## 📱 Features in Detail

### Order Processing Flow
1. **Browse Products**: Category-based product discovery
2. **Add to Cart**: Real-time cart updates
3. **Checkout Step 1**: Choose delivery or pickup
4. **Checkout Step 2**: Select address and delivery window
5. **Checkout Step 3**: Review and place order
6. **Order Confirmation**: Success page with order details
7. **Order Tracking**: Real-time status updates

### Financial System
- **Chart of Accounts**: Standard bakery business accounts
- **Ledger Entries**: Double-entry bookkeeping
- **Order Tracking**: Financial impact of each order
- **Reporting**: Revenue and expense tracking

## 🐛 Known Issues & Fixes

### Recently Fixed
- ✅ Next.js 16 async params compatibility
- ✅ Chart of accounts initialization for checkout
- ✅ Order details page rendering
- ✅ Banner display system
- ✅ Authentication flow optimization

### Current Status
- 🟢 Complete e-commerce workflow functional
- 🟢 Order placement and tracking working
- 🟢 Authentication system stable
- 🟡 Image optimization for external URLs
- 🟡 Advanced admin features in development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Prisma](https://prisma.io/)
- Authentication by [NextAuth.js](https://next-auth.js.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Testing with [Playwright](https://playwright.dev/)
- Icons by [Lucide React](https://lucide.dev/)

## 📞 Support

For support, email support@doretybakery.com or create an issue on GitHub.

---

Made with ❤️ for the love of fresh baked goods 🥖🧁🍰
