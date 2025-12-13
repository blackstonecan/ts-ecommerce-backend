# 🛒 TypeScript E-Commerce Backend

A production-ready, fully-tested RESTful API for an e-commerce platform built with TypeScript, Express, Prisma, and PostgreSQL. Features comprehensive order management, payment processing with Stripe, and real-time stock management.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-60%20passing-success.svg)](./TESTING.md)
[![Coverage](https://img.shields.io/badge/Coverage-90%25+-success.svg)](./TEST_SUMMARY.md)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Secure password handling
- User session management
- Role-based access control (Admin/User)

### 🛍️ Shopping Cart
- Add/Update/Remove items
- Real-time stock validation
- Cart persistence
- Automatic total calculation

### 📦 Product Management
- CRUD operations for products
- Category management
- Image upload to AWS S3
- Stock tracking
- SEO-friendly slugs

### 💳 Order Processing
- Complete checkout flow
- Stripe payment integration
- Webhook handling for payment events
- Order status tracking
- Address snapshot for orders

### 🔒 Advanced Features
- **Stock Management**: Atomic stock reservation with race condition handling
- **Idempotency**: Safe webhook replay handling
- **Payment Security**: Error sanitization & PCI compliance
- **Concurrent Safety**: Transaction-based operations
- **Auto-expiration**: 30-minute order timeout with stock release
- **Audit Trail**: Complete order status history

## 🏗️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Language** | TypeScript 5.9 |
| **Runtime** | Node.js 18+ |
| **Framework** | Express 5.2 |
| **Database** | PostgreSQL 14+ |
| **ORM** | Prisma 7.1 |
| **Payments** | Stripe |
| **Storage** | AWS S3 |
| **Validation** | Zod |
| **Testing** | Jest + ts-jest |
| **Development** | ts-node-dev |

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- AWS Account (for S3)
- Stripe Account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ts-ecommerce-backend.git
cd ts-ecommerce-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

4. **Set up the database**
```bash
# Create PostgreSQL database
createdb ecommerce_db

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npx prisma db seed
```

5. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 📁 Project Structure

```
src/
├── config/              # Configuration files (Prisma, Stripe, AWS)
├── lib/                 # Core business logic
│   ├── address/         # Address management
│   ├── admin/           # Admin operations
│   ├── cart/            # Shopping cart
│   ├── category/        # Product categories
│   ├── common/          # Shared utilities (logger, sanitize)
│   ├── error/           # Error handling
│   ├── location/        # Geographic hierarchy
│   ├── order/           # Order & checkout logic
│   ├── product/         # Product management
│   ├── response/        # Response formatting
│   ├── stripe/          # Stripe integration
│   └── user/            # User management
├── middlewares/         # Express middlewares
├── routers/             # Route aggregation
├── types/               # TypeScript type definitions
├── __tests__/           # Test files (60 tests)
│   ├── utils/           # Test utilities & mocks
│   ├── cart.repo.test.ts
│   ├── order.repo.test.ts
│   ├── sanitize.test.ts
│   └── logger.test.ts
└── index.ts             # Application entry point
```

## 🧪 Testing

This project has **comprehensive test coverage** with 60 tests covering critical business logic.

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage
- **Cart Operations**: 94% coverage
- **Order Processing**: 91% coverage
- **Utilities**: 100% coverage

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### 🔐 Authentication
```http
POST   /auth/register     # Register new user
POST   /auth/login        # Login user
```

#### 🛍️ Cart
```http
GET    /user/cart         # Get cart
POST   /user/cart         # Add item to cart
PATCH  /user/cart/:id     # Update item quantity
DELETE /user/cart/:id     # Remove item
DELETE /user/cart         # Clear cart
```

#### 📦 Products
```http
GET    /product           # List products
GET    /product/:slug     # Get product by slug
POST   /admin/product     # Create product (Admin)
PUT    /admin/product/:id # Update product (Admin)
DELETE /admin/product/:id # Delete product (Admin)
```

#### 💳 Orders
```http
POST   /user/order/checkout  # Create order & payment intent
GET    /user/order           # List user's orders
GET    /user/order/:id       # Get order details
```

#### 🎯 Webhooks
```http
POST   /stripe            # Stripe webhook endpoint
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret for JWT signing | ✅ |
| `STRIPE_SECRET_KEY` | Stripe API secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ |
| `AWS_REGION` | AWS region for S3 | ✅ |
| `AWS_S3_BUCKET` | S3 bucket name | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS access key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | ✅ |
| `PORT` | Server port | ❌ (default: 5000) |
| `NODE_ENV` | Environment | ❌ (default: development) |

## 🎯 Key Features Explained

### 1. Atomic Stock Reservation
Orders reserve stock immediately upon creation using atomic database operations:
```typescript
// Race-condition safe stock reservation
const updated = await db.product.updateMany({
  where: { id: productId, stock: { gte: quantity } },
  data: { stock: { decrement: quantity } }
});
// If count is 0, stock was sold concurrently
```

### 2. Idempotent Webhook Handling
Payment webhooks can be retried safely:
```typescript
// Already processed? Skip
if (order.status !== 'PENDING') return;
// Otherwise, process once
```

### 3. Payment Amount Validation
Ensures cart hasn't changed during checkout:
```typescript
if (totalAmountCents !== expectedAmountCents) {
  throw Error('Cart modified during checkout');
}
```

### 4. Auto-Expiration
Orders expire after 30 minutes, releasing reserved stock:
```typescript
// Cron job runs every 10 minutes
cron.schedule('*/10 * * * *', releaseExpiredOrders);
```

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Password hashing
- ✅ SQL injection protection (Prisma)
- ✅ Input validation (Zod)
- ✅ Error message sanitization
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Payment data isolation

## 🚦 Order Flow

```
1. User adds items to cart
   ↓
2. User initiates checkout
   ↓
3. System creates Stripe PaymentIntent
   ↓
4. Order created (PENDING) + Stock reserved
   ↓
5. User completes payment
   ↓
6. Stripe webhook received
   ↓
7. Order confirmed (PROCESSING) OR Failed (CANCELED)
   ↓
8. Stock released if failed
```

## 📊 Database Schema

### Key Models
- **User**: Authentication & profile
- **Product**: Items for sale
- **Category**: Product categorization
- **CartItem**: Shopping cart items
- **Order**: Purchase orders
- **OrderItem**: Items in an order
- **Payment**: Payment records
- **OrderUpdate**: Audit trail
- **Address**: Delivery addresses

### Location Hierarchy
```
Country → City → District → Neighbourhood
```

See Prisma schema at [`prisma/schema.prisma`](./prisma/schema.prisma)

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run test:coverage` | Generate coverage report |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:studio` | Open Prisma Studio |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- Prisma team for the amazing ORM
- Stripe for payment processing infrastructure

## 📞 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/ts-ecommerce-backend](https://github.com/yourusername/ts-ecommerce-backend)

---

**Built with ❤️ using TypeScript, Express, and PostgreSQL**
