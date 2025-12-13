import { z } from 'zod';

const AddToCartSchema = z.object({
    productId: z.number().int().positive('Product ID must be a positive integer'),
    quantity: z.number().int().positive('Quantity must be a positive integer')
});

const UpdateCartItemParamsSchema = z.object({
    itemId: z.string().regex(/^\d+$/, 'Cart item ID must be a number').transform(Number)
});

const UpdateCartItemBodySchema = z.object({
    quantity: z.number().int().positive('Quantity must be a positive integer')
});

const RemoveCartItemParamsSchema = z.object({
    itemId: z.string().regex(/^\d+$/, 'Cart item ID must be a number').transform(Number)
});

export {
    AddToCartSchema,
    UpdateCartItemParamsSchema,
    UpdateCartItemBodySchema,
    RemoveCartItemParamsSchema
};
