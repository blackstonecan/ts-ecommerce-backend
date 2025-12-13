import { z } from 'zod';

const CheckoutSchema = z.object({
    addressId: z.number().int().positive('Address ID must be a positive integer')
});

const GetOrderParamsSchema = z.object({
    orderId: z.string().regex(/^\d+$/, 'Order ID must be a number').transform(Number)
});

export {
    CheckoutSchema,
    GetOrderParamsSchema
};
