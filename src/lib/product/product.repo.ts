import { Prisma, prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { IProduct, IProductForAdmin, IProductItem } from "./product.types";
import CustomError from "../error/CustomError";

export const productRepo = {
    async list(categoryId: number | undefined, db: PrismaClient = prisma): Promise<Response<IProductItem[]>> {
        try {
            let whereClause : Prisma.ProductWhereInput = {};
            if (categoryId !== undefined) {
                whereClause.categoryId = categoryId;
            }

            const products = await db.product.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    stock: true,
                    amountCents: true,
                    mainImage: {
                        select: { key: true }
                    }
                }
            });

            const output: IProductItem[] = [];

            for (const product of products) {
                if (!product.mainImage) throw CustomError.getWithMessage('Product main image not found', 500);

                output.push({
                    id: product.id,
                    name: product.name,
                    mainImageUrl: product.mainImage.key,
                    amountCents: product.amountCents,
                    haveStock: product.stock > 0,
                    slug: product.slug
                });
            }

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async getBySlug(slug: string, db: PrismaClient = prisma): Promise<Response<IProduct>> {
        try {
            const product =  await db.product.findUnique({
                where: { slug },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    slug: true,
                    stock: true,
                    amountCents: true,
                    mainImage: {
                        select: { key: true }
                    },
                    images: {
                        select: { key: true }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            image: { select: { key: true }}
                        }
                    }
                }
            });

            if (!product) throw CustomError.getWithMessage('Product not found', 404);
            if (!product.mainImage) throw CustomError.getWithMessage('Product main image not found', 500);
            if (!product.category) throw CustomError.getWithMessage('Product category not found', 500);
            if (!product.category.image) throw CustomError.getWithMessage('Product category image not found', 500);

            const output : IProduct = {
                id: product.id,
                name: product.name,
                description: product.description,
                mainImageUrl: product.mainImage.key,
                amountCents: product.amountCents,
                haveStock: product.stock > 0,
                slug: product.slug,
                imagesUrls: product.images.map(img => img.key),
                category: {
                    id: product.category.id,
                    name: product.category.name,
                    slug: product.category.slug,
                    imageUrl: product.category.image.key
                }
            };

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async getById(id: number, db: PrismaClient = prisma): Promise<Response<IProductForAdmin>> {
        try {
            const product =  await db.product.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    slug: true,
                    stock: true,
                    amountCents: true,
                    mainImage: {
                        select: { key: true }
                    },
                    images: {
                        select: { id: true, key: true }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            image: { select: { key: true }}
                        }
                    }
                }
            });

            if (!product) throw CustomError.getWithMessage('Product not found', 404);
            if (!product.mainImage) throw CustomError.getWithMessage('Product main image not found', 500);
            if (!product.category) throw CustomError.getWithMessage('Product category not found', 500);
            if (!product.category.image) throw CustomError.getWithMessage('Product category image not found', 500);

            const output : IProductForAdmin = {
                id: product.id,
                name: product.name,
                description: product.description,
                mainImageUrl: product.mainImage.key,
                amountCents: product.amountCents,
                haveStock: product.stock > 0,
                slug: product.slug,
                stock: product.stock,
                images: product.images.map(img => ({ id: img.id, url: img.key })),
                category: {
                    id: product.category.id,
                    name: product.category.name,
                    slug: product.category.slug,
                    imageUrl: product.category.image.key
                }
            };

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },
}