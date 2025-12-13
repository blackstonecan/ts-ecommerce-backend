import { OrderStatus, PaymentStatus, PaymentProvider } from '@/generated/prisma/enums';

/**
 * Test data factories for creating mock objects
 */

export const createMockCartItem = (overrides = {}) => ({
  id: 1,
  quantity: 2,
  productId: 1,
  userId: 'test-user',
  product: {
    name: 'Test Product',
    slug: 'test-product',
    amountCents: 1000,
    stock: 10,
  },
  createdAt: new Date(),
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  id: 1,
  amountCents: 2000,
  status: OrderStatus.PENDING,
  userId: 'test-user',
  addressId: 1,
  createdAt: new Date(),
  ...overrides,
});

export const createMockPayment = (overrides = {}) => ({
  id: 1,
  orderId: 1,
  amountCents: 2000,
  currency: 'usd',
  provider: PaymentProvider.STRIPE,
  providerPaymentId: 'pi_test123',
  providerChargeId: null,
  status: PaymentStatus.PENDING,
  errorCode: null,
  errorMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAddress = (overrides = {}) => ({
  id: 1,
  userId: 'test-user',
  name: 'Home',
  addressLine1: '123 Test St',
  addressLine2: 'Apt 4',
  postalCode: '12345',
  neighbourhoodId: 1,
  createdAt: new Date(),
  ...overrides,
});

export const createMockOrderAddress = (overrides = {}) => ({
  id: 1,
  name: 'Home',
  addressLine1: '123 Test St',
  addressLine2: 'Apt 4',
  postalCode: '12345',
  neighbourhoodId: 1,
  createdAt: new Date(),
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  description: 'Test Description',
  amountCents: 1000,
  stock: 10,
  slug: 'test-product',
  categoryId: 1,
  mainImageId: null,
  createdAt: new Date(),
  ...overrides,
});

export const createMockCart = (overrides = {}) => ({
  items: [
    {
      id: 1,
      productId: 1,
      productName: 'Test Product',
      productSlug: 'test-product',
      quantity: 2,
      amountCents: 1000,
      totalCents: 2000,
    },
  ],
  totalAmountCents: 2000,
  itemCount: 1,
  ...overrides,
});
