// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { orderRepo } from '@/lib/order/order.repo';
import { prismaMock } from './utils/prismaMock';
import {
  createMockCartItem,
  createMockAddress,
  createMockOrder,
  createMockPayment,
  createMockOrderAddress,
} from './utils/factories';
import { OrderStatus, PaymentStatus, PaymentProvider } from '@/generated/prisma/enums';

// Mock logger to prevent console output during tests
jest.mock('@/lib/common/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('orderRepo.createOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create an order with valid cart items', async () => {
    const userId = 'test-user';
    const addressId = 1;
    const paymentIntentId = 'pi_test123';
    const expectedAmountCents = 2000;

    const mockCartItems = [createMockCartItem({ quantity: 2, product: { amountCents: 1000, stock: 10, name: 'Product 1', slug: 'product-1' } })];
    const mockAddress = createMockAddress();
    const mockOrderAddress = createMockOrderAddress();
    const mockOrder = createMockOrder();

    prismaMock.cartItem.findMany.mockResolvedValue(mockCartItems as any);
    prismaMock.address.findUnique.mockResolvedValue(mockAddress as any);

    // Mock transaction
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        orderAddress: { create: jest.fn().mockResolvedValue(mockOrderAddress) },
        order: { create: jest.fn().mockResolvedValue(mockOrder) },
        orderUpdate: { create: jest.fn().mockResolvedValue({}) },
        orderItem: { create: jest.fn().mockResolvedValue({}) },
        product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        payment: { create: jest.fn().mockResolvedValue({}) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.createOrder(userId, addressId, paymentIntentId, expectedAmountCents, prismaMock as any);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ orderId: mockOrder.id });
    expect(prismaMock.cartItem.findMany).toHaveBeenCalledWith({
      where: { userId },
      select: expect.any(Object),
    });
  });

  it('should fail if cart is empty', async () => {
    prismaMock.cartItem.findMany.mockResolvedValue([]);

    const result = await orderRepo.createOrder('test-user', 1, 'pi_test', 1000, prismaMock as any);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Cart is empty');
  });

  it('should fail if address not found', async () => {
    const mockCartItems = [createMockCartItem()];
    prismaMock.cartItem.findMany.mockResolvedValue(mockCartItems as any);
    prismaMock.address.findUnique.mockResolvedValue(null);

    const result = await orderRepo.createOrder('test-user', 999, 'pi_test', 2000, prismaMock as any);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Address not found');
  });

  it('should fail if address belongs to different user', async () => {
    const mockCartItems = [createMockCartItem()];
    const mockAddress = createMockAddress({ userId: 'different-user' });

    prismaMock.cartItem.findMany.mockResolvedValue(mockCartItems as any);
    prismaMock.address.findUnique.mockResolvedValue(mockAddress as any);

    const result = await orderRepo.createOrder('test-user', 1, 'pi_test', 2000, prismaMock as any);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toContain('Unauthorized');
  });

  it('should fail if amount mismatch (cart modified during checkout)', async () => {
    const mockCartItems = [createMockCartItem({ quantity: 2, product: { amountCents: 1000, stock: 10, name: 'Product', slug: 'product' } })];
    const mockAddress = createMockAddress();

    prismaMock.cartItem.findMany.mockResolvedValue(mockCartItems as any);
    prismaMock.address.findUnique.mockResolvedValue(mockAddress as any);

    // Expected 3000 but cart total is 2000
    const result = await orderRepo.createOrder('test-user', 1, 'pi_test', 3000, prismaMock as any);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Cart was modified during checkout. Please try again.');
  });

  it('should fail if insufficient stock (race condition)', async () => {
    const mockCartItems = [createMockCartItem({ quantity: 5, product: { amountCents: 1000, stock: 10, name: 'Product', slug: 'product' } })];
    const mockAddress = createMockAddress();
    const mockOrderAddress = createMockOrderAddress();
    const mockOrder = createMockOrder();

    prismaMock.cartItem.findMany.mockResolvedValue(mockCartItems as any);
    prismaMock.address.findUnique.mockResolvedValue(mockAddress as any);

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        orderAddress: { create: jest.fn().mockResolvedValue(mockOrderAddress) },
        order: { create: jest.fn().mockResolvedValue(mockOrder) },
        orderUpdate: { create: jest.fn().mockResolvedValue({}) },
        orderItem: { create: jest.fn().mockResolvedValue({}) },
        // Stock update returns count 0 = stock was sold
        product: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.createOrder('test-user', 1, 'pi_test', 5000, prismaMock as any);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toContain('Insufficient stock');
  });
});

describe('orderRepo.confirmOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully confirm a pending order', async () => {
    const orderId = 1;
    const mockOrder = {
      ...createMockOrder(),
      payments: [createMockPayment()],
    };

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        order: {
          findUnique: jest.fn().mockResolvedValue(mockOrder),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        orderUpdate: { create: jest.fn().mockResolvedValue({}) },
        payment: { update: jest.fn().mockResolvedValue({}) },
        cartItem: { deleteMany: jest.fn().mockResolvedValue({}) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.confirmOrder(orderId, prismaMock as any);

    expect(result.success).toBe(true);
  });

  it('should not confirm if order not found', async () => {
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        order: { findUnique: jest.fn().mockResolvedValue(null) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.confirmOrder(999, prismaMock as any);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Order not found');
  });

  it('should be idempotent - skip if already confirmed', async () => {
    const mockOrder = {
      ...createMockOrder({ status: OrderStatus.PROCESSING }),
      payments: [createMockPayment({ status: PaymentStatus.SUCCEEDED })],
    };

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        order: { findUnique: jest.fn().mockResolvedValue(mockOrder) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.confirmOrder(1, prismaMock as any);

    expect(result.success).toBe(true); // Should succeed but do nothing
  });

  it('should skip if order not in PENDING status', async () => {
    const mockOrder = {
      ...createMockOrder({ status: OrderStatus.CANCELED }),
      payments: [createMockPayment()],
    };

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        order: { findUnique: jest.fn().mockResolvedValue(mockOrder) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.confirmOrder(1, prismaMock as any);

    expect(result.success).toBe(true);
  });
});

describe('orderRepo.failOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully fail a pending order and release stock', async () => {
    const mockOrder = {
      ...createMockOrder(),
      items: [{ productId: 1, quantity: 2 }],
      payments: [createMockPayment()],
    };

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        order: {
          findUnique: jest.fn().mockResolvedValue(mockOrder),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        orderUpdate: { create: jest.fn().mockResolvedValue({}) },
        product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        payment: { update: jest.fn().mockResolvedValue({}) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.failOrder(1, 'Test error', prismaMock as any);

    expect(result.success).toBe(true);
  });

  it('should not fail if payment already succeeded', async () => {
    const mockOrder = {
      ...createMockOrder(),
      items: [{ productId: 1, quantity: 2 }],
      payments: [createMockPayment({ status: PaymentStatus.SUCCEEDED })],
    };

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        order: { findUnique: jest.fn().mockResolvedValue(mockOrder) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.failOrder(1, 'Test error', prismaMock as any);

    expect(result.success).toBe(true); // Returns success but does nothing
  });

  it('should handle product deletion gracefully (updateMany returns 0)', async () => {
    const mockOrder = {
      ...createMockOrder(),
      items: [{ productId: 999, quantity: 2 }], // Product doesn't exist
      payments: [createMockPayment()],
    };

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        order: {
          findUnique: jest.fn().mockResolvedValue(mockOrder),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        orderUpdate: { create: jest.fn().mockResolvedValue({}) },
        product: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) }, // Product not found
        payment: { update: jest.fn().mockResolvedValue({}) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.failOrder(1, 'Test error', prismaMock as any);

    // Should still succeed even if product was deleted
    expect(result.success).toBe(true);
  });

  it('should be idempotent - skip if already failed', async () => {
    const mockOrder = {
      ...createMockOrder({ status: OrderStatus.CANCELED }),
      items: [{ productId: 1, quantity: 2 }],
      payments: [createMockPayment({ status: PaymentStatus.FAILED })],
    };

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        order: { findUnique: jest.fn().mockResolvedValue(mockOrder) },
      };
      return callback(txMock);
    });

    const result = await orderRepo.failOrder(1, 'Test error', prismaMock as any);

    expect(result.success).toBe(true);
  });
});

describe('orderRepo.releaseExpiredOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should release multiple expired orders in parallel', async () => {
    const expiredOrders = [{ id: 1 }, { id: 2 }, { id: 3 }];

    prismaMock.order.findMany.mockResolvedValue(expiredOrders as any);

    // Mock each failOrder call to succeed
    const mockFailOrder = jest.spyOn(orderRepo, 'failOrder');
    mockFailOrder.mockResolvedValue({ success: true, data: null, error: null } as any);

    const result = await orderRepo.releaseExpiredOrders(30, prismaMock as any);

    expect(result.success).toBe(true);
    expect(result.data).toBe(3); // All 3 orders processed
    expect(mockFailOrder).toHaveBeenCalledTimes(3);

    mockFailOrder.mockRestore();
  });

  it('should return 0 if no expired orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    const result = await orderRepo.releaseExpiredOrders(30, prismaMock as any);

    expect(result.success).toBe(true);
    expect(result.data).toBe(0);
  });

  it('should handle partial failures gracefully', async () => {
    const expiredOrders = [{ id: 1 }, { id: 2 }, { id: 3 }];

    prismaMock.order.findMany.mockResolvedValue(expiredOrders as any);

    const mockFailOrder = jest.spyOn(orderRepo, 'failOrder');
    mockFailOrder
      .mockResolvedValueOnce({ success: true, data: null, error: null } as any) // Order 1 succeeds
      .mockResolvedValueOnce({ success: false, data: null, error: { error: new Error('DB error'), status: 500 } } as any) // Order 2 fails
      .mockResolvedValueOnce({ success: true, data: null, error: null } as any); // Order 3 succeeds

    const result = await orderRepo.releaseExpiredOrders(30, prismaMock as any);

    expect(result.success).toBe(true);
    expect(result.data).toBe(2); // 2 out of 3 succeeded

    mockFailOrder.mockRestore();
  });
});

describe('orderRepo.getOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve order with all details', async () => {
    const mockOrderData = {
      id: 1,
      userId: 'test-user',
      amountCents: 2000,
      status: OrderStatus.PROCESSING,
      createdAt: new Date(),
      items: [
        {
          id: 1,
          productId: 1,
          quantity: 2,
          amountCents: 1000,
          product: { name: 'Test Product', slug: 'test-product' },
        },
      ],
      address: {
        name: 'Home',
        addressLine1: '123 Test St',
        addressLine2: null,
        postalCode: '12345',
        neighbourhood: {
          name: 'Test Neighbourhood',
          district: {
            name: 'Test District',
            city: {
              name: 'Test City',
              country: { name: 'Test Country' },
            },
          },
        },
      },
      payments: [{ id: 1, provider: PaymentProvider.STRIPE, status: PaymentStatus.SUCCEEDED, amountCents: 2000 }],
    };

    prismaMock.order.findUnique.mockResolvedValue(mockOrderData as any);

    const result = await orderRepo.getOrder(1, 'test-user', prismaMock as any);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(1);
    expect(result.data?.items).toHaveLength(1);
  });

  it('should fail if order not found', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    const result = await orderRepo.getOrder(999, 'test-user', prismaMock as any);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Order not found');
  });

  it('should fail if order belongs to different user', async () => {
    const mockOrderData = {
      ...createMockOrder({ userId: 'different-user' }),
    };

    prismaMock.order.findUnique.mockResolvedValue(mockOrderData as any);

    const result = await orderRepo.getOrder(1, 'test-user', prismaMock as any);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toContain('Unauthorized');
  });
});

describe('orderRepo.listUserOrders', () => {
  it('should list all orders for a user', async () => {
    const mockOrders = [
      {
        id: 1,
        amountCents: 2000,
        status: OrderStatus.DELIVERED,
        createdAt: new Date(),
        _count: { items: 2 },
      },
      {
        id: 2,
        amountCents: 5000,
        status: OrderStatus.PROCESSING,
        createdAt: new Date(),
        _count: { items: 3 },
      },
    ];

    prismaMock.order.findMany.mockResolvedValue(mockOrders as any);

    const result = await orderRepo.listUserOrders('test-user', prismaMock as any);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data?.[0].itemCount).toBe(2);
  });

  it('should return empty array if user has no orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    const result = await orderRepo.listUserOrders('test-user', prismaMock as any);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });
});
