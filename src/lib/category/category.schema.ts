import { z } from "zod";

const GetCategoryWithProductsSchema = z.object({
    slug: z.string().min(1, 'Slug is required')
});

export {
    GetCategoryWithProductsSchema
};