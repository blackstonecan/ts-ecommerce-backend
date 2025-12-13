# 📚 API Documentation

Complete REST API documentation for the TypeScript E-Commerce Backend.

## Base URL

```
http://localhost:5000
```

## Authentication

Most endpoints require JWT authentication. Include the token in the request header:

```http
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "status": 201,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe"
    }
  },
  "message": "User registered successfully"
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe"
    }
  },
  "message": "Login successful"
}
```

---

## 🛍️ Cart Endpoints

All cart endpoints require authentication.

### Get Cart
```http
GET /user/cart
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "Product Name",
          "slug": "product-name",
          "amountCents": 2999,
          "haveStock": true,
          "mainImageUrl": "image-key.jpg"
        },
        "quantity": 2,
        "totalCents": 5998
      }
    ],
    "totalQuantity": 2,
    "totalAmountCents": 5998
  },
  "message": "Cart fetched successfully"
}
```

### Add Item to Cart
```http
POST /user/cart
```

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "status": 201,
  "data": null,
  "message": "Item added to cart"
}
```

**Error Cases:**
- `404` - Product not found
- `400` - Insufficient stock

### Update Cart Item
```http
PATCH /user/cart/:itemId
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:** `200 OK`

**Error Cases:**
- `404` - Cart item not found
- `403` - Unauthorized (item belongs to different user)
- `400` - Insufficient stock

### Remove Cart Item
```http
DELETE /user/cart/:itemId
```

**Response:** `200 OK`

### Clear Cart
```http
DELETE /user/cart
```

**Response:** `200 OK`

---

## 📦 Product Endpoints

### List Products
```http
GET /product
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category slug
- `search` (optional): Search in name/description

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Product Name",
        "slug": "product-name",
        "description": "Product description",
        "amountCents": 2999,
        "stock": 10,
        "category": {
          "id": 1,
          "name": "Category Name",
          "slug": "category-name"
        },
        "mainImageUrl": "image-key.jpg"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  },
  "message": "Products fetched successfully"
}
```

### Get Product by Slug
```http
GET /product/:slug
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 1,
    "name": "Product Name",
    "slug": "product-name",
    "description": "Detailed product description",
    "amountCents": 2999,
    "stock": 10,
    "category": {
      "id": 1,
      "name": "Category Name",
      "slug": "category-name"
    },
    "mainImageUrl": "main-image.jpg",
    "images": ["image1.jpg", "image2.jpg"]
  },
  "message": "Product fetched successfully"
}
```

---

## 🔑 Admin Product Endpoints

Requires admin authentication.

### Create Product
```http
POST /admin/product
```

**Request Body:** (multipart/form-data)
```
name: "Product Name"
description: "Product description"
amountCents: 2999
stock: 100
categoryId: 1
mainImage: <file>
images: <files>
```

**Response:** `201 Created`

### Update Product
```http
PUT /admin/product/:id
```

**Request Body:** (multipart/form-data)
```
name: "Updated Name"
amountCents: 3499
stock: 50
```

**Response:** `200 OK`

### Delete Product
```http
DELETE /admin/product/:id
```

**Response:** `200 OK`

### Update Stock
```http
PATCH /admin/product/:id/stock
```

**Request Body:**
```json
{
  "stock": 50
}
```

**Response:** `200 OK`

---

## 💳 Order Endpoints

### Checkout (Create Order)
```http
POST /user/order/checkout
```

**Request Body:**
```json
{
  "addressId": 1
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "status": 201,
  "data": {
    "clientSecret": "pi_xxx_secret_yyy",
    "orderId": 123
  },
  "message": "Order created successfully. Complete payment to confirm."
}
```

**Flow:**
1. Creates Stripe PaymentIntent
2. Creates Order with PENDING status
3. Reserves stock
4. Returns client secret for payment

**Error Cases:**
- `400` - Cart is empty
- `400` - Cart modified during checkout
- `400` - Insufficient stock
- `404` - Address not found
- `403` - Address doesn't belong to user

### Get Order
```http
GET /user/order/:orderId
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 123,
    "amountCents": 5998,
    "status": "PROCESSING",
    "createdAt": "2024-01-15T10:30:00Z",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Product Name",
        "productSlug": "product-name",
        "quantity": 2,
        "amountCents": 2999,
        "totalCents": 5998
      }
    ],
    "address": {
      "name": "Home",
      "addressLine1": "123 Main St",
      "addressLine2": "Apt 4",
      "postalCode": "12345",
      "neighbourhood": "Downtown",
      "district": "Central",
      "city": "New York",
      "country": "USA"
    },
    "payment": {
      "id": 1,
      "provider": "STRIPE",
      "status": "SUCCEEDED",
      "amountCents": 5998
    }
  },
  "message": "Order fetched successfully"
}
```

**Error Cases:**
- `404` - Order not found
- `403` - Order doesn't belong to user

### List User Orders
```http
GET /user/order
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "id": 123,
      "amountCents": 5998,
      "status": "DELIVERED",
      "itemCount": 2,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Orders fetched successfully"
}
```

---

## 📍 Address Endpoints

### Create Address
```http
POST /user/address
```

**Request Body:**
```json
{
  "name": "Home",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4",
  "postalCode": "12345",
  "neighbourhoodId": 1
}
```

**Response:** `201 Created`

### List User Addresses
```http
GET /user/address
```

**Response:** `200 OK`

### Update Address
```http
PUT /user/address/:id
```

**Response:** `200 OK`

### Delete Address
```http
DELETE /user/address/:id
```

**Response:** `200 OK`

---

## 🎯 Stripe Webhook

### Payment Webhook
```http
POST /stripe
```

**Headers Required:**
```
stripe-signature: <signature>
```

**Handled Events:**
- `payment_intent.succeeded` - Confirms order, clears cart
- `payment_intent.payment_failed` - Fails order, releases stock

**Auto-Refund Logic:**
If payment succeeds but order already canceled (expired), automatically refunds.

---

## 📊 Order Status Flow

```
PENDING → PROCESSING → SHIPPED → DELIVERED
   ↓
CANCELED (if payment fails or expires)
```

### Status Descriptions

| Status | Description |
|--------|-------------|
| `PENDING` | Order created, payment pending |
| `PROCESSING` | Payment confirmed, preparing order |
| `SHIPPED` | Order shipped to customer |
| `DELIVERED` | Order delivered successfully |
| `CANCELED` | Order canceled (payment failed/expired) |

---

## ❌ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "status": 400,
  "message": "Error message here"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing/invalid token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `500` | Internal Server Error |

---

## 🔒 Security Notes

1. **Authentication**: Most endpoints require JWT token
2. **Authorization**: Users can only access their own resources
3. **Input Validation**: All inputs validated with Zod
4. **Error Sanitization**: Payment errors sanitized to prevent info leakage
5. **Rate Limiting**: Consider implementing for production
6. **HTTPS**: Always use HTTPS in production

---

## 📝 Notes

- All monetary values are in **cents** (e.g., $29.99 = 2999)
- Timestamps are in **ISO 8601** format
- Pagination starts at page **1**
- Default page size is **20** items

---

**For testing and development, see [TESTING.md](./TESTING.md)**
