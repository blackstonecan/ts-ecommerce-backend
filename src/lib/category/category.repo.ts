import { prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { ICategory, ICategoryWithProducts } from "./category.types";
import CustomError from "../error/CustomError";

export const categoryRepo = {
    async create(
        data: {
            name: string;
            slug: string;
            imageKey: string;
            imageSize: number;
            imageMimeType: string;
        },
        db: PrismaClient = prisma
    ): Promise<Response<{ id: number }>> {
        try {
            const category = await db.category.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    image: {
                        create: {
                            key: data.imageKey,
                            size: data.imageSize,
                            mimeType: data.imageMimeType,
                        }
                    }
                },
                select: {
                    id: true
                }
            });

            return Response.getSuccess({ id: category.id });
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async update(
        data: {
            id: number;
            name?: string;
            slug?: string;
            imageKey?: string;
            imageSize?: number;
            imageMimeType?: string;
        },
        db: PrismaClient = prisma
    ): Promise<Response<{ oldImageKey?: string }>> {
        try {
            // Check if category exists and get old image info
            const existingCategory = await db.category.findUnique({
                where: { id: data.id },
                select: {
                    id: true,
                    imageId: true,
                    image: {
                        select: {
                            id: true,
                            key: true,
                        }
                    }
                }
            });

            if (!existingCategory) {
                throw CustomError.getWithMessage('Category not found', 404);
            }

            // Build update data
            const updateData: any = {};

            if (data.name !== undefined) {
                updateData.name = data.name;
                updateData.slug = data.slug;
            }

            let oldImageKey: string | undefined;

            // If new image provided, create image record and update imageId
            if (data.imageKey) {
                const oldImageId = existingCategory.imageId;
                oldImageKey = existingCategory.image?.key;

                if (oldImageId) {
                    await db.$transaction(async (tx) => {
                        // Update category with new image
                        await tx.category.update({
                            where: { id: data.id },
                            data: {
                                ...updateData,
                                image: {
                                    create: {
                                        key: data.imageKey!,
                                        size: data.imageSize!,
                                        mimeType: data.imageMimeType!,
                                    }
                                }
                            },
                        });

                        // Delete old image record
                        await tx.image.delete({
                            where: { id: oldImageId }
                        });
                    });
                } else {
                    // No old image, just update category with new image
                    await db.category.update({
                        where: { id: data.id },
                        data: {
                            ...updateData,
                            image: {
                                create: {
                                    key: data.imageKey!,
                                    size: data.imageSize!,
                                    mimeType: data.imageMimeType!,
                                }
                            }
                        },
                    });
                }
            } else {
                // Update without changing image
                await db.category.update({
                    where: { id: data.id },
                    data: updateData,
                });
            }

            return Response.getSuccess({ oldImageKey });
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async getById(id: number, db: PrismaClient = prisma): Promise<Response<ICategory>> {
        try {
            const category = await db.category.findUnique({
                where: { id },
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

            if (!category) throw CustomError.getWithMessage('Category not found', 404);
            if (!category.image) throw CustomError.getWithMessage('Category image not found', 500);

            const output: ICategory = {
                id: category.id,
                name: category.name,
                slug: category.slug,
                imageUrl: category.image.key,
            };

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

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

    async delete(id: number, db: PrismaClient = prisma): Promise<Response<{ imageKey?: string }>> {
        try {
            // Get category with products count and image info
            const category = await db.category.findUnique({
                where: { id },
                select: {
                    id: true,
                    imageId: true,
                    image: {
                        select: {
                            id: true,
                            key: true,
                        }
                    },
                    _count: {
                        select: {
                            products: true
                        }
                    }
                }
            });

            if (!category) {
                throw CustomError.getWithMessage('Category not found', 404);
            }

            // Check if category has products
            if (category._count.products > 0) {
                throw CustomError.getWithMessage('Cannot delete category with existing products', 400);
            }

            const imageKey = category.image?.key;
            const imageId = category.imageId;

            // Delete category and image in transaction
            await db.$transaction(async (tx) => {
                // Delete category
                await tx.category.delete({
                    where: { id }
                });

                // Delete image if exists
                if (imageId) {
                    await tx.image.delete({
                        where: { id: imageId }
                    });
                }
            });

            return Response.getSuccess({ imageKey });
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    }
}