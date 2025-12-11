import { z } from "zod";

const GetCategoryWithProductsSchema = z.object({
    slug: z.string().min(1, 'Slug is required')
});

const AddCategorySchema = z.object({
    name: z.string()
        .min(1, 'Category name is required')
        .max(100, 'Category name must be at most 100 characters')
        .trim()
});

const UpdateCategoryParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Category ID must be a number').transform(Number)
});

const UpdateCategoryBodySchema = z.object({
    name: z.string()
        .min(1, 'Category name is required')
        .max(100, 'Category name must be at most 100 characters')
        .trim()
        .optional()
});

const DeleteCategoryParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Category ID must be a number').transform(Number)
});

export {
    GetCategoryWithProductsSchema,
    AddCategorySchema,
    UpdateCategoryParamsSchema,
    UpdateCategoryBodySchema,
    DeleteCategoryParamsSchema
};