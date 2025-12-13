import { prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import CustomError from "@/lib/error/CustomError";
import { IOrder, IOrderListItem } from "./order.types";
import { OrderStatus, PaymentProvider, PaymentStatus } from "@/generated/prisma/enums";

export const orderRepo = {
    async createOrder(
        userId: string,
        addressId: number,
        paymentIntentId: string,
        db: PrismaClient = prisma
    ): Promise<Response<{ orderId: number }>> {
        try {
            // Get cart items
            const cartItems = await db.cartItem.findMany({
                where: { userId },
                select: {
                    id: true,
                    quantity: true,
                    productId: true,
                    product: {
                        select: {
                            name: true,
                            slug: true,
                            amountCents: true,
                            stock: true
                        }
                    }
                }
            });

            if (cartItems.length === 0) {
                throw CustomError.getWithMessage('Cart is empty', 400);
            }

            // Get address
            const address = await db.address.findUnique({
                where: { id: addressId },
                select: {
                    userId: true,
                    name: true,
                    addressLine1: true,
                    addressLine2: true,
                    postalCode: true,
                    neighbourhoodId: true
                }
            });

            if (!address) throw CustomError.getWithMessage('Address not found', 404);
            if (address.userId !== userId) {
                throw CustomError.getWithMessage('Unauthorized: Address does not belong to user', 403);
            }

            // Pre-validation: Check stock before starting transaction (optimization)
            for (const item of cartItems) {
                if (item.product.stock < item.quantity) {
                    throw CustomError.getWithMessage(
                        `Insufficient stock for product: ${item.product.name}`,
                        400
                    );
                }
            }

            // Calculate total
            const totalAmountCents = cartItems.reduce(
                (sum, item) => sum + item.product.amountCents * item.quantity,
                0
            );

            // Create order in transaction
            const result = await db.$transaction(async (tx) => {
                // Create OrderAddress
                const orderAddress = await tx.orderAddress.create({
                    data: {
                        name: address.name,
                        addressLine1: address.addressLine1,
                        addressLine2: address.addressLine2,
                        postalCode: address.postalCode,
                        neighbourhoodId: address.neighbourhoodId
                    }
                });

                // Create Order
                const order = await tx.order.create({
                    data: {
                        userId: userId,
                        amountCents: totalAmountCents,
                        status: 'PENDING',
                        addressId: orderAddress.id
                    }
                });

                // Create OrderItems AND Reserve Stock
                for (const item of cartItems) {
                    await tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            productId: item.productId,
                            quantity: item.quantity,
                            amountCents: item.product.amountCents
                        }
                    });

                    // STRATEGY A: Decrement stock immediately (Reservation)
                    // We use updateMany with 'stock: { gte: quantity }' to ensure concurrency safety.
                    const updateResult = await tx.product.updateMany({
                        where: {
                            id: item.productId,
                            stock: { gte: item.quantity }
                        },
                        data: {
                            stock: { decrement: item.quantity }
                        }
                    });

                    // If updateCount is 0, it means someone else bought the last item milliseconds ago
                    if (updateResult.count === 0) {
                        throw CustomError.getWithMessage(
                            `Insufficient stock for product: ${item.product.name} (Race Condition)`,
                            400
                        );
                    }
                }

                // Create Payment record
                await tx.payment.create({
                    data: {
                        orderId: order.id,
                        amountCents: totalAmountCents,
                        currency: 'usd',
                        provider: PaymentProvider.STRIPE,
                        status: PaymentStatus.PENDING,
                        providerPaymentId: paymentIntentId
                    }
                });

                return { orderId: order.id };
            });

            return Response.getSuccess(result);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async confirmOrder(orderId: number, db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    select: {
                        id: true,
                        status: true,
                        userId: true,
                        payments: { select: { id: true, status: true } },
                    },
                });

                if (!order) throw CustomError.getWithMessage("Order not found", 404);
                if (!order.payments?.length) throw CustomError.getWithMessage("Payment record not found for order", 500);

                const payment = order.payments[0];

                // Idempotency: already succeeded or not pending => do nothing
                if (payment.status === PaymentStatus.SUCCEEDED || order.status !== OrderStatus.PENDING) return;

                // Move order forward
                const updated = await tx.order.updateMany({
                    where: { id: orderId, status: OrderStatus.PENDING },
                    data: { status: OrderStatus.PROCESSING },
                });
                if (updated.count === 0) return;

                // Mark payment succeeded
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: PaymentStatus.SUCCEEDED },
                });

                // Clear cart
                await tx.cartItem.deleteMany({ where: { userId: order.userId } });
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },


    async failOrder(
        orderId: number,
        errorMessage?: string,
        db: PrismaClient = prisma
    ): Promise<Response<null>> {
        try {
            await db.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    select: {
                        id: true,
                        status: true,
                        items: { select: { productId: true, quantity: true } },
                        payments: { select: { id: true, status: true } },
                    },
                });

                if (!order) throw CustomError.getWithMessage("Order not found", 404);
                if (!order.payments?.length) throw CustomError.getWithMessage("Payment record not found for order", 500);

                const payment = order.payments[0];

                // If already succeeded, don't cancel
                if (payment.status === PaymentStatus.SUCCEEDED) return;

                // Idempotency: already canceled/failed => do nothing
                if (order.status === OrderStatus.CANCELED && payment.status === PaymentStatus.FAILED) return;

                // Only cancel if still PENDING (reservation exists only for PENDING in your flow)
                const updated = await tx.order.updateMany({
                    where: { id: orderId, status: OrderStatus.PENDING },
                    data: { status: OrderStatus.CANCELED },
                });

                if (updated.count === 0) return;

                // Release reserved stock
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }

                // Mark payment failed
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: PaymentStatus.FAILED, errorMessage: errorMessage },
                });
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async releaseExpiredOrders(
        expirationMinutes: number = 30,
        db: PrismaClient = prisma
    ): Promise<Response<number>> {
        try {
            const expirationDate = new Date(Date.now() - expirationMinutes * 60 * 1000);

            // Find pending orders older than the expiration time
            const expiredOrders = await db.order.findMany({
                where: {
                    status: 'PENDING',
                    createdAt: { lt: expirationDate }
                },
                select: { id: true }
            });

            let processedCount = 0;

            // Reuse failOrder logic to ensure stock is released safely
            for (const order of expiredOrders) {
                // Calling failOrder internaly handles the transaction and stock increment
                // We access the failOrder on 'this' object or call the exported function directly if context binding issues arise
                const result = await orderRepo.failOrder(order.id, 'Session Timeout', db);

                if (result.success) {
                    processedCount++;
                } else throw result.error;
            }

            return Response.getSuccess(processedCount);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async getOrder(
        orderId: number,
        userId: string,
        db: PrismaClient = prisma
    ): Promise<Response<IOrder>> {
        try {
            const order = await db.order.findUnique({
                where: { id: orderId },
                select: {
                    id: true,
                    userId: true,
                    amountCents: true,
                    status: true,
                    createdAt: true,
                    items: {
                        select: {
                            id: true,
                            productId: true,
                            quantity: true,
                            amountCents: true,
                            product: {
                                select: {
                                    name: true,
                                    slug: true
                                }
                            }
                        }
                    },
                    address: {
                        select: {
                            name: true,
                            addressLine1: true,
                            addressLine2: true,
                            postalCode: true,
                            neighbourhood: {
                                select: {
                                    name: true,
                                    district: {
                                        select: {
                                            name: true,
                                            city: {
                                                select: {
                                                    name: true,
                                                    country: {
                                                        select: {
                                                            name: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    payments: {
                        select: {
                            id: true,
                            provider: true,
                            status: true,
                            amountCents: true
                        }
                    }
                }
            });

            if (!order) throw CustomError.getWithMessage('Order not found', 404);

            // Check ownership
            if (order.userId !== userId) {
                throw CustomError.getWithMessage('Unauthorized: Order does not belong to user', 403);
            }

            if (!order.payments?.length) {
                throw CustomError.getWithMessage("Payment not found", 500);
            }

            const output: IOrder = {
                id: order.id,
                amountCents: order.amountCents,
                status: order.status,
                createdAt: order.createdAt,
                items: order.items.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.product.name,
                    productSlug: item.product.slug,
                    quantity: item.quantity,
                    amountCents: item.amountCents,
                    totalCents: item.amountCents * item.quantity
                })),
                address: {
                    name: order.address.name,
                    addressLine1: order.address.addressLine1,
                    addressLine2: order.address.addressLine2 || undefined,
                    postalCode: order.address.postalCode,
                    neighbourhood: order.address.neighbourhood.name,
                    district: order.address.neighbourhood.district.name,
                    city: order.address.neighbourhood.district.city.name,
                    country: order.address.neighbourhood.district.city.country.name
                },
                payment: {
                    id: order.payments[0].id,
                    provider: order.payments[0].provider,
                    status: order.payments[0].status,
                    amountCents: order.payments[0].amountCents
                }
            };

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async listUserOrders(
        userId: string,
        db: PrismaClient = prisma
    ): Promise<Response<IOrderListItem[]>> {
        try {
            const orders = await db.order.findMany({
                where: { userId },
                select: {
                    id: true,
                    amountCents: true,
                    status: true,
                    createdAt: true,
                    _count: {
                        select: {
                            items: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            const output: IOrderListItem[] = orders.map(order => ({
                id: order.id,
                amountCents: order.amountCents,
                status: order.status,
                itemCount: order._count.items,
                createdAt: order.createdAt
            }));

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    }
};