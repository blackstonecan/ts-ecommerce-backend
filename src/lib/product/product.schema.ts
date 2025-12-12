import {z} from "zod";

const GetProductsSchema = z.object({
    categoryId: z.string().min(1, 'Category ID must be at least 1 character long').optional().transform((val) => val ? Number(val) : undefined)
});

const GetProductSchema = z.object({
    slug: z.string().min(1, 'Slug is required')
});

const GetProductForAdminSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Product ID must be a number').transform(Number)
});

const AddProductSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(255, 'Product name must be less than 255 characters'),
    description: z.string().min(1, 'Product description is required'),
    amountCents: z.string().regex(/^\d+$/, 'Amount must be a positive number').transform(Number).refine(val => val > 0, 'Amount must be greater than 0'),
    stock: z.string().regex(/^\d+$/, 'Stock must be a non-negative number').transform(Number).refine(val => val >= 0, 'Stock must be non-negative'),
    categoryId: z.string().regex(/^\d+$/, 'Category ID must be a number').transform(Number)
});

const UpdateProductParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Product ID must be a number').transform(Number)
});

const UpdateProductBodySchema = z.object({
    name: z.string().min(1, 'Product name must not be empty').max(255, 'Product name must be less than 255 characters').optional(),
    description: z.string().min(1, 'Product description must not be empty').optional(),
    amountCents: z.string().regex(/^\d+$/, 'Amount must be a positive number').transform(Number).refine(val => val > 0, 'Amount must be greater than 0').optional(),
    stock: z.string().regex(/^\d+$/, 'Stock must be a non-negative number').transform(Number).refine(val => val >= 0, 'Stock must be non-negative').optional(),
    categoryId: z.string().regex(/^\d+$/, 'Category ID must be a number').transform(Number).optional(),
    imageIdsToRemove: z.string().optional().transform((val) => {
        if (!val) return undefined;
        try {
            const parsed = JSON.parse(val);
            if (!Array.isArray(parsed)) return undefined;
            return parsed.filter(id => typeof id === 'number');
        } catch {
            return undefined;
        }
    })
});

const DeleteProductParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Product ID must be a number').transform(Number)
});

const UpdateStockParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Product ID must be a number').transform(Number)
});

const UpdateStockBodySchema = z.object({
    stock: z.number().int('Stock must be an integer').nonnegative('Stock must be non-negative')
});

export {
    GetProductsSchema,
    GetProductSchema,
    GetProductForAdminSchema,
    AddProductSchema,
    UpdateProductParamsSchema,
    UpdateProductBodySchema,
    DeleteProductParamsSchema,
    UpdateStockParamsSchema,
    UpdateStockBodySchema
};