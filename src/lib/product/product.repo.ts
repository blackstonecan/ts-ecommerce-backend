import { Prisma, prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { IProduct, IProductForAdmin, IProductItem } from "./product.types";
import CustomError from "../error/CustomError";

export const productRepo = {
    async list(categoryId: number | undefined, db: PrismaClient = prisma): Promise<Response<IProductItem[]>> {
        try {
            let whereClause: Prisma.ProductWhereInput = {};
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
            const product = await db.product.findUnique({
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
                            image: { select: { key: true } }
                        }
                    }
                }
            });

            if (!product) throw CustomError.getWithMessage('Product not found', 404);
            if (!product.mainImage) throw CustomError.getWithMessage('Product main image not found', 500);
            if (!product.category) throw CustomError.getWithMessage('Product category not found', 500);
            if (!product.category.image) throw CustomError.getWithMessage('Product category image not found', 500);

            const output: IProduct = {
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
            const product = await db.product.findUnique({
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
                            image: { select: { key: true } }
                        }
                    }
                }
            });

            if (!product) throw CustomError.getWithMessage('Product not found', 404);
            if (!product.mainImage) throw CustomError.getWithMessage('Product main image not found', 500);
            if (!product.category) throw CustomError.getWithMessage('Product category not found', 500);
            if (!product.category.image) throw CustomError.getWithMessage('Product category image not found', 500);

            const output: IProductForAdmin = {
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

    async create(data: {
        name: string;
        description: string;
        amountCents: number;
        stock: number;
        slug: string;
        categoryId: number;
        mainImage: {
            key: string;
            size: number;
            mimeType: string;
        };
        additionalImages: {
            key: string;
            size: number;
            mimeType: string;
        }[];
    }, db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.$transaction(async (tx) => {
                // First create the main image
                const mainImage = await tx.image.create({
                    data: {
                        key: data.mainImage.key,
                        size: data.mainImage.size,
                        mimeType: data.mainImage.mimeType,
                    }
                });

                // Then create the product with the main image connected
                await tx.product.create({
                    data: {
                        name: data.name,
                        description: data.description,
                        amountCents: data.amountCents,
                        stock: data.stock,
                        slug: data.slug,
                        categoryId: data.categoryId,
                        mainImageId: mainImage.id,
                        images: {
                            create: data.additionalImages.map(img => ({
                                key: img.key,
                                size: img.size,
                                mimeType: img.mimeType,
                            }))
                        }
                    }
                });
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async update(data: {
        id: number;
        name?: string;
        description?: string;
        amountCents?: number;
        stock?: number;
        slug?: string;
        categoryId?: number;
        mainImage?: {
            key: string;
            size: number;
            mimeType: string;
        };
        additionalImages?: {
            key: string;
            size: number;
            mimeType: string;
        }[];
        imageIdsToRemove?: number[];
    }, db: PrismaClient = prisma): Promise<Response<{ oldMainImageKey?: string; removedImageKeys?: string[] }>> {
        try {
            let oldMainImageKey: string | undefined;
            let removedImageKeys: string[] = [];

            await db.$transaction(async (tx) => {
                // First, get the old main image key if we're replacing it
                if (data.mainImage) {
                    const product = await tx.product.findUnique({
                        where: { id: data.id },
                        select: {
                            mainImage: {
                                select: { key: true }
                            }
                        }
                    });

                    if (product?.mainImage) {
                        oldMainImageKey = product.mainImage.key;
                    }
                }

                // Get keys of images to remove
                if (data.imageIdsToRemove && data.imageIdsToRemove.length > 0) {
                    const imagesToRemove = await tx.image.findMany({
                        where: {
                            id: { in: data.imageIdsToRemove }
                        },
                        select: { key: true }
                    });

                    removedImageKeys = imagesToRemove.map(img => img.key);
                }

                // Prepare update data
                const updatePayload: any = {};

                if (data.name) updatePayload.name = data.name;
                if (data.description) updatePayload.description = data.description;
                if (data.amountCents !== undefined) updatePayload.amountCents = data.amountCents;
                if (data.stock !== undefined) updatePayload.stock = data.stock;
                if (data.slug) updatePayload.slug = data.slug;
                if (data.categoryId) updatePayload.categoryId = data.categoryId;

                // Create new main image and get its ID if file is provided
                if (data.mainImage) {
                    const newMainImage = await tx.image.create({
                        data: {
                            key: data.mainImage.key,
                            size: data.mainImage.size,
                            mimeType: data.mainImage.mimeType,
                        }
                    });
                    updatePayload.mainImageId = newMainImage.id;
                }

                if (data.additionalImages && data.additionalImages.length > 0) {
                    updatePayload.images = {
                        create: data.additionalImages.map(img => ({
                            key: img.key,
                            size: img.size,
                            mimeType: img.mimeType,
                        }))
                    };
                }

                if (data.imageIdsToRemove && data.imageIdsToRemove.length > 0) {
                    updatePayload.images = {
                        ...updatePayload.images,
                        disconnect: data.imageIdsToRemove.map(id => ({ id }))
                    };
                }

                // Update product
                await tx.product.update({
                    where: { id: data.id },
                    data: updatePayload
                });

                // Delete old main image record if replaced
                if (oldMainImageKey) {
                    await tx.image.deleteMany({
                        where: { key: oldMainImageKey }
                    });
                }

                // Delete removed image records
                if (data.imageIdsToRemove && data.imageIdsToRemove.length > 0) {
                    await tx.image.deleteMany({
                        where: {
                            id: { in: data.imageIdsToRemove }
                        }
                    });
                }
            });

            return Response.getSuccess({
                oldMainImageKey,
                removedImageKeys
            });
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async delete(id: number, db: PrismaClient = prisma): Promise<Response<{ mainImageKey?: string; imageKeys?: string[] }>> {
        try {
            let mainImageKey: string | undefined;
            let imageKeys: string[] = [];

            await db.$transaction(async (tx) => {
                // Check if product has orderItems
                const product = await tx.product.findUnique({
                    where: { id },
                    select: {
                        orderItems: {
                            select: { id: true },
                            take: 1
                        },
                        mainImage: {
                            select: { key: true }
                        },
                        images: {
                            select: { key: true }
                        }
                    }
                });

                if (!product) throw CustomError.getWithMessage('Product not found', 404);

                if (product.orderItems.length > 0) {
                    throw CustomError.getWithMessage('Cannot delete product with existing orders', 400);
                }

                mainImageKey = product.mainImage?.key;
                imageKeys = product.images.map(img => img.key);

                // Delete product (this will cascade to cartItems based on schema)
                await tx.product.delete({
                    where: { id }
                });

                // Delete image records
                if (mainImageKey) {
                    await tx.image.deleteMany({
                        where: { key: mainImageKey }
                    });
                }

                if (imageKeys.length > 0) {
                    await tx.image.deleteMany({
                        where: {
                            key: { in: imageKeys }
                        }
                    });
                }
            });

            return Response.getSuccess({
                mainImageKey,
                imageKeys
            });
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async updateStock(id: number, stock: number, db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.product.update({
                where: { id },
                data: { stock }
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },
}