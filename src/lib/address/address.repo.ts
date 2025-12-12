import { prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { IAddressItem, IAddress } from "./address.types";
import CustomError from "../error/CustomError";

export const addressRepo = {
    async listUserAddresses(userId: string, db: PrismaClient = prisma): Promise<Response<IAddressItem[]>> {
        try {
            const addresses = await db.address.findMany({
                where: {
                    userId: userId
                },
                select: {
                    id: true,
                    name: true,
                    addressLine1: true,
                    neighbourhood: {
                        select: {
                            district: {
                                select: {
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
            });

            const output: IAddressItem[] = addresses.map(address => ({
                id: address.id,
                name: address.name,
                country: address.neighbourhood.district.city.country.name,
                city: address.neighbourhood.district.city.name,
                addressLine1: address.addressLine1,
            }));

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async getAddress(id: number, userId: string, db: PrismaClient = prisma): Promise<Response<IAddress>> {
        try {
            const address = await db.address.findUnique({
                where: { id },
                select: {
                    id: true,
                    userId: true,
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
            });

            if (!address) throw CustomError.getWithMessage('Address not found', 404);

            // Check ownership
            if (address.userId !== userId) {
                throw CustomError.getWithMessage('Unauthorized: Address does not belong to user', 403);
            }

            const output: IAddress = {
                id: address.id,
                name: address.name,
                country: address.neighbourhood.district.city.country.name,
                city: address.neighbourhood.district.city.name,
                district: address.neighbourhood.district.name,
                neighbourhood: address.neighbourhood.name,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2 || undefined,
                postalCode: address.postalCode
            };

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async addAddress(
        userId: string,
        data: {
            name: string;
            addressLine1: string;
            addressLine2?: string;
            postalCode: string;
            neighbourhoodId: number;
        },
        db: PrismaClient = prisma
    ): Promise<Response<null>> {
        try {
            await db.address.create({
                data: {
                    userId: userId,
                    name: data.name,
                    addressLine1: data.addressLine1,
                    addressLine2: data.addressLine2,
                    postalCode: data.postalCode,
                    neighbourhoodId: data.neighbourhoodId
                }
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async updateAddress(
        id: number,
        userId: string,
        data: {
            name?: string;
            addressLine1?: string;
            addressLine2?: string;
            postalCode?: string;
            neighbourhoodId?: number;
        },
        db: PrismaClient = prisma
    ): Promise<Response<null>> {
        try {
            // Check if address exists and belongs to user
            const address = await db.address.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!address) throw CustomError.getWithMessage('Address not found', 404);

            // Check ownership
            if (address.userId !== userId) {
                throw CustomError.getWithMessage('Unauthorized: Address does not belong to user', 403);
            }

            // Validate at least one field is being updated
            if (!data.name && !data.addressLine1 && !data.addressLine2 && !data.postalCode && !data.neighbourhoodId) {
                throw CustomError.getWithMessage('At least one field must be provided for update', 400);
            }

            const updatePayload: any = {};
            if (data.name) updatePayload.name = data.name;
            if (data.addressLine1) updatePayload.addressLine1 = data.addressLine1;
            if (data.addressLine2 !== undefined) updatePayload.addressLine2 = data.addressLine2;
            if (data.postalCode) updatePayload.postalCode = data.postalCode;
            if (data.neighbourhoodId) updatePayload.neighbourhoodId = data.neighbourhoodId;

            await db.address.update({
                where: { id },
                data: updatePayload
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async deleteAddress(id: number, userId: string, db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            // Check if address exists and belongs to user
            const address = await db.address.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!address) throw CustomError.getWithMessage('Address not found', 404);

            // Check ownership
            if (address.userId !== userId) {
                throw CustomError.getWithMessage('Unauthorized: Address does not belong to user', 403);
            }

            await db.address.delete({
                where: { id }
            });

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },
}