import { prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { ICountryExtended } from "./location.types";

export const locationRepo = {
    async listAll(db: PrismaClient = prisma): Promise<Response<ICountryExtended[]>> {
        try {
            const countries = await db.country.findMany({
                select: {
                    id: true,
                    name: true,
                    code: true,
                    cities: {
                        select: {
                            id: true,
                            name: true,
                            districts: {
                                select: {
                                    id: true,
                                    name: true,
                                    neighbourhoods: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return Response.getSuccess(countries);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },
}