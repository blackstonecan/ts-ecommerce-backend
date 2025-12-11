import {z} from "zod";

const GetProductsSchema = z.object({
    categoryId: z.string().min(1, 'Category ID must be at least 1 character long').optional().transform((val) => val ? Number(val) : undefined)
});

const GetProductSchema = z.object({
    slug: z.string().min(1, 'Slug is required')
});

const GetProductForAdminSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Category ID must be a number').transform(Number)
});

export {
    GetProductsSchema,
    GetProductSchema,
    GetProductForAdminSchema
};