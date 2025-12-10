import { prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { ICategory, ICategoryWithProducts } from "./category.types";
import CustomError from "../error/CustomError";

export const categoryRepo = {
    async list(db: PrismaClient = prisma): Promise<Response<ICategory[]>> {
        try {
            const categories = await db.category.findMany({
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: {
                        select: {
                            key: true,
                        }
                    }
                }
            });

            const output: ICategory[] = [];

            for (const category of categories) {
                if (!category.image) throw CustomError.getWithMessage('Category image not found', 500);

                output.push({
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    imageUrl: category.image.key,
                });
            }

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async getWithProducts(slug: string, db: PrismaClient = prisma): Promise<Response<ICategoryWithProducts>> {
        try {
            const category = await db.category.findUnique({
                where: {
                    slug: slug,
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: {
                        select: {
                            key: true,
                        }
                    },
                    products: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            amountCents: true,
                            stock: true,
                            mainImage: {
                                select: {
                                    key: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!category) throw CustomError.getWithMessage('Category not found', 404);
            if (!category.image) throw CustomError.getWithMessage('Category image not found', 500);

            const output: ICategoryWithProducts = {
                id: category.id,
                name: category.name,
                slug: category.slug,
                imageUrl: category.image.key,
                products: [],
            };

            for (const product of category.products) {
                if (!product.mainImage) throw CustomError.getWithMessage('Product main image not found', 500);

                output.products.push({
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    amountCents: product.amountCents,
                    haveStock: product.stock > 0,
                    mainImageUrl: product.mainImage.key,
                });
            }

            return Response.getSuccess(output);
        } catch (error) {
            return repoErrorHandler(error);
        }
    },
}