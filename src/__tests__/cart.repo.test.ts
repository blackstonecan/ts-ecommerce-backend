// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { cartRepo } from '@/lib/cart/cart.repo';
import { prismaMock } from './utils/prismaMock';
import { createMockProduct, createMockCartItem } from './utils/factories';

describe('cartRepo.getCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cart with items and totals', async () => {
    const mockCartItems = [
      {
        id: 1,
        quantity: 2,
        productId: 1,
        product: {
          name: 'Product 1',
          slug: 'product-1',
          amountCents: 1000,
          stock: 10,
          mainImage: { key: 'image1.jpg' },
        },
      },
      {
        id: 2,
        quantity: 1,
        productId: 2,
        product: {
          name: 'Product 2',
          slug: 'product-2',
          amountCents: 2000,
          stock: 5,
          mainImage: { key: 'image2.jpg' },
        },
      },
    ];

    prismaMock.cartItem.findMany.mockResolvedValue(mockCartItems);

    const result = await cartRepo.getCart('test-user', prismaMock);

    expect(result.success).toBe(true);
    expect(result.data.items).toHaveLength(2);
    expect(result.data.totalAmountCents).toBe(4000); // (1000*2) + (2000*1)
    expect(result.data.totalQuantity).toBe(3); // 2 + 1
  });

  it('should return empty cart if no items', async () => {
    prismaMock.cartItem.findMany.mockResolvedValue([]);

    const result = await cartRepo.getCart('test-user', prismaMock);

    expect(result.success).toBe(true);
    expect(result.data.items).toHaveLength(0);
    expect(result.data.totalAmountCents).toBe(0);
    expect(result.data.totalQuantity).toBe(0);
  });

  it('should fail if product main image not found', async () => {
    const mockCartItems = [
      {
        id: 1,
        quantity: 2,
        productId: 1,
        product: {
          name: 'Product 1',
          slug: 'product-1',
          amountCents: 1000,
          stock: 10,
          mainImage: null, // No main image
        },
      },
    ];

    prismaMock.cartItem.findMany.mockResolvedValue(mockCartItems);

    const result = await cartRepo.getCart('test-user', prismaMock);

    expect(result.success).toBe(false);
  });
});

describe('cartRepo.addCartItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create new cart item if product not in cart', async () => {
    const mockProduct = { id: 1, stock: 10 };

    prismaMock.product.findUnique.mockResolvedValue(mockProduct);
    prismaMock.cartItem.findUnique.mockResolvedValue(null); // Not in cart
    prismaMock.cartItem.create.mockResolvedValue({});

    const result = await cartRepo.addCartItem(
      'test-user',
      { productId: 1, quantity: 2 },
      prismaMock
    );

    expect(result.success).toBe(true);
    expect(prismaMock.cartItem.create).toHaveBeenCalled();
  });

  it('should increment quantity if product already in cart', async () => {
    const mockProduct = { id: 1, stock: 10 };
    const existingCartItem = { quantity: 2 };

    prismaMock.product.findUnique.mockResolvedValue(mockProduct);
    prismaMock.cartItem.findUnique.mockResolvedValue(existingCartItem);
    prismaMock.cartItem.update.mockResolvedValue({});

    const result = await cartRepo.addCartItem(
      'test-user',
      { productId: 1, quantity: 3 },
      prismaMock
    );

    expect(result.success).toBe(true);
    expect(prismaMock.cartItem.update).toHaveBeenCalled();
    expect(prismaMock.cartItem.create).not.toHaveBeenCalled();
  });

  it('should fail if product not found', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    const result = await cartRepo.addCartItem(
      'test-user',
      { productId: 999, quantity: 1 },
      prismaMock
    );

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Product not found');
  });

  it('should fail if insufficient stock for new item', async () => {
    const mockProduct = { id: 1, stock: 5 };

    prismaMock.product.findUnique.mockResolvedValue(mockProduct);
    prismaMock.cartItem.findUnique.mockResolvedValue(null);

    const result = await cartRepo.addCartItem(
      'test-user',
      { productId: 1, quantity: 10 }, // More than stock
      prismaMock
    );

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Insufficient stock available');
  });

  it('should fail if insufficient stock for existing item increment', async () => {
    const mockProduct = { id: 1, stock: 10 };
    const existingCartItem = { quantity: 8 };

    prismaMock.product.findUnique.mockResolvedValue(mockProduct);
    prismaMock.cartItem.findUnique.mockResolvedValue(existingCartItem);

    const result = await cartRepo.addCartItem(
      'test-user',
      { productId: 1, quantity: 5 }, // 8 + 5 = 13 > 10 stock
      prismaMock
    );

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Insufficient stock available');
  });
});

describe('cartRepo.updateCartItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update cart item quantity', async () => {
    const mockCartItem = {
      userId: 'test-user',
      productId: 1,
      product: { stock: 10 },
    };

    prismaMock.cartItem.findUnique.mockResolvedValue(mockCartItem);
    prismaMock.cartItem.update.mockResolvedValue({});

    const result = await cartRepo.updateCartItem(1, 'test-user', 5, prismaMock);

    expect(result.success).toBe(true);
    expect(prismaMock.cartItem.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { quantity: 5 },
    });
  });

  it('should fail if cart item not found', async () => {
    prismaMock.cartItem.findUnique.mockResolvedValue(null);

    const result = await cartRepo.updateCartItem(999, 'test-user', 5, prismaMock);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Cart item not found');
  });

  it('should fail if cart item belongs to different user', async () => {
    const mockCartItem = {
      userId: 'different-user',
      productId: 1,
      product: { stock: 10 },
    };

    prismaMock.cartItem.findUnique.mockResolvedValue(mockCartItem);

    const result = await cartRepo.updateCartItem(1, 'test-user', 5, prismaMock);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toContain('Unauthorized');
  });

  it('should fail if insufficient stock for new quantity', async () => {
    const mockCartItem = {
      userId: 'test-user',
      productId: 1,
      product: { stock: 5 },
    };

    prismaMock.cartItem.findUnique.mockResolvedValue(mockCartItem);

    const result = await cartRepo.updateCartItem(1, 'test-user', 10, prismaMock);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Insufficient stock available');
  });
});

describe('cartRepo.removeCartItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove cart item', async () => {
    const mockCartItem = { userId: 'test-user' };

    prismaMock.cartItem.findUnique.mockResolvedValue(mockCartItem);
    prismaMock.cartItem.delete.mockResolvedValue({});

    const result = await cartRepo.removeCartItem(1, 'test-user', prismaMock);

    expect(result.success).toBe(true);
    expect(prismaMock.cartItem.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('should fail if cart item not found', async () => {
    prismaMock.cartItem.findUnique.mockResolvedValue(null);

    const result = await cartRepo.removeCartItem(999, 'test-user', prismaMock);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toBe('Cart item not found');
  });

  it('should fail if cart item belongs to different user', async () => {
    const mockCartItem = { userId: 'different-user' };

    prismaMock.cartItem.findUnique.mockResolvedValue(mockCartItem);

    const result = await cartRepo.removeCartItem(1, 'test-user', prismaMock);

    expect(result.success).toBe(false);
    expect(result.error?.error.message).toContain('Unauthorized');
  });
});

describe('cartRepo.clearCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should clear all cart items for user', async () => {
    prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 3 });

    const result = await cartRepo.clearCart('test-user', prismaMock);

    expect(result.success).toBe(true);
    expect(prismaMock.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'test-user' },
    });
  });

  it('should succeed even if cart is already empty', async () => {
    prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 0 });

    const result = await cartRepo.clearCart('test-user', prismaMock);

    expect(result.success).toBe(true);
  });
});
