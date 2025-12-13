import { prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { ICart, ICartItem } from "./cart.types";
import CustomError from "../error/CustomError";

export const cartRepo = {
    async getCart(userId: string, db: PrismaClient = prisma): Promise<Response<ICart>> {
        try {
            const cartItems = await db.cartItem.findMany({
                where: {
                    userId: userId
                },
                select: {
                    id: true,
                    quantity: true,
                    productId: true,
                    product: {
                        select: {
                            name: true,
                            slug: true,
                            amountCents: true,
                            stock: true,
                            mainImage: {
                                select: {
                                    key: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            const items: ICartItem[] = cartItems.map((item) => {
                if (!item.product.mainImage) throw new Error("Product main image not found");

                return {
                    id: item.id,
                    product: {
                        id: item.productId,
                        name: item.product.name,
                        slug: item.product.slug,
                        amountCents: item.product.amountCents,
                        haveStock: item.product.stock > 0,
                        mainImageUrl: item.product.mainImage.key
                    },
                    quantity: item.quantity,
                    totalCents: item.product.amountCents * item.quantity
                };
            });

            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmountCents = items.reduce((sum, item) => sum + item.totalCents, 0);

            const cart: ICart = {
                items,
                totalQuantity,
                totalAmountCents
            };

            return Response.getSuccess(cart);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async addCartItem(
        userId: string,
        data: {
            productId: number;
            quantity: number;
        },
        db: PrismaClient = prisma
    ): Promise<Response<null>> {
        try {
            // Check if product exists and has stock
            const product = await db.product.findUnique({
                where: { id: data.productId },
                select: {
                    id: true,
                    stock: true
                }
            });

            if (!product) throw CustomError.getWithMessage('Product not found', 404);

            // Check if product has enough stock
            const existingCartItem = await db.cartItem.findUnique({
                where: {
                    userId_productId: {
                        userId: userId,
                        productId: data.productId
                    }
                },
                select: {
                    quantity: true
                }
            });

            const totalQuantity = existingCartItem ? existingCartItem.quantity + data.quantity : data.quantity;

            if (product.stock < totalQuantity) {
                throw CustomError.getWithMessage('Insufficient stock available', 400);
            }

            // If product already in cart, increment quantity
            if (existingCartItem) {
                await db.cartItem.update({
                    where: {
                        userId_productId: {
                            userId: userId,
                            productId: data.productId
                        }
                    },
                    data: {
                        quantity: {
                            increment: data.quantity
                        }
                    }
                });
            } else {
                // Create new cart item
                await db.cartItem.create({
                    data: {
                        userId: userId,
                        productId: data.productId,
                        quantity: data.quantity
                    }
                });
            }

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async updateCartItem(
        itemId: number,
        userId: string,
        quantity: number,
        db: PrismaClient = prisma
    ): Promise<Response<null>> {
        try {
            // Check if cart item exists and belongs to user
            const cartItem = await db.cartItem.findUnique({
                where: { id: itemId },
                select: {
                    userId: true,
                    productId: true,
                    product: {
                        select: {
                            stock: true
                        }
                    }
                }
            });

            if (!cartItem) throw CustomError.getWithMessage('Cart item not found', 404);

            // Check ownership
            if (cartItem.userId !== userId) {
                throw CustomError.getWithMessage('Unauthorized: Cart item does not belong to user', 403);
            }

            // Check if product has enough stock
            if (cartItem.product.stock < quantity) {
                throw CustomError.getWithMessage('Insufficient stock available', 400);
            }

            // Update quantity
            await db.cartItem.update({
                where: { id: itemId },
                data: { quantity: quantity }
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async removeCartItem(
        itemId: number,
        userId: string,
        db: PrismaClient = prisma
    ): Promise<Response<null>> {
        try {
            // Check if cart item exists and belongs to user
            const cartItem = await db.cartItem.findUnique({
                where: { id: itemId },
                select: {
                    userId: true
                }
            });

            if (!cartItem) throw CustomError.getWithMessage('Cart item not found', 404);

            // Check ownership
            if (cartItem.userId !== userId) {
                throw CustomError.getWithMessage('Unauthorized: Cart item does not belong to user', 403);
            }

            // Delete cart item
            await db.cartItem.delete({
                where: { id: itemId }
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async clearCart(userId: string, db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            // Delete all cart items for user
            await db.cartItem.deleteMany({
                where: {
                    userId: userId
                }
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    }
};
