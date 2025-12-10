import { prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { IAddressItem } from "./address.types";

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
}