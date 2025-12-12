import { prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { ICity, ICountry, ICountryExtended, IDistrict, IDistrictExtended, INeighbourhood } from "./location.types";
import CustomError from "../error/CustomError";
import { locationCache } from "./location.cache";

export const locationRepo = {
    async listAll(db: PrismaClient = prisma): Promise<Response<ICountryExtended[]>> {
        try {
            // Check cache first
            const cached = locationCache.get();
            if (cached) {
                return Response.getSuccess(cached);
            }

            // Cache miss - fetch from database
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

            // Update cache
            locationCache.set(countries);

            return Response.getSuccess(countries);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async listCountries(db: PrismaClient = prisma): Promise<Response<ICountry[]>> {
        try {
            const countries = await db.country.findMany({
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            });

            return Response.getSuccess(countries);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async getCountry(id: number, db: PrismaClient = prisma): Promise<Response<ICountry & { cities: ICity[] }>> {
        try {
            const country = await db.country.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    cities: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            if (!country) throw CustomError.getWithMessage('Country not found', 404);

            return Response.getSuccess(country);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async getCity(id: number, db: PrismaClient = prisma): Promise<Response<ICity & { districts: IDistrict[] }>> {
        try {
            const city = await db.city.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    districts: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            if (!city) throw CustomError.getWithMessage('City not found', 404);

            return Response.getSuccess(city);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async getDistrict(id: number, db: PrismaClient = prisma): Promise<Response<IDistrictExtended>> {
        try {
            const district = await db.district.findUnique({
                where: { id },
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
            });
            if (!district) throw CustomError.getWithMessage('District not found', 404);

            return Response.getSuccess(district);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    // Country CRUD operations
    async addCountries(countries: { name: string; code: string }[], db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.country.createMany({
                data: countries,
                skipDuplicates: true
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async updateCountry(id: number, data: { name?: string; code?: string }, db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            // Validate at least one field is being updated
            if (!data.name && !data.code) {
                throw CustomError.getWithMessage('At least one field (name or code) must be provided for update', 400);
            }

            const updatePayload: any = {};
            if (data.name) updatePayload.name = data.name;
            if (data.code) updatePayload.code = data.code;

            await db.country.update({
                where: { id },
                data: updatePayload
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async deleteCountries(ids: number[], db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.$transaction(async (tx) => {
                // Check all countries exist and have no cities
                for (const id of ids) {
                    const country = await tx.country.findUnique({
                        where: { id },
                        select: {
                            cities: {
                                select: { id: true },
                                take: 1
                            }
                        }
                    });

                    if (!country) {
                        throw CustomError.getWithMessage(`Country with ID ${id} not found`, 404);
                    }

                    if (country.cities.length > 0) {
                        throw CustomError.getWithMessage(`Cannot delete country with ID ${id} because it has cities`, 400);
                    }
                }

                // Delete all countries
                await tx.country.deleteMany({
                    where: {
                        id: { in: ids }
                    }
                });
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    // City CRUD operations
    async addCities(cities: { name: string; countryId: number }[], db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.city.createMany({
                data: cities,
                skipDuplicates: true
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async updateCity(id: number, data: { name?: string; countryId?: number }, db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            // Validate at least one field is being updated
            if (!data.name && !data.countryId) {
                throw CustomError.getWithMessage('At least one field (name or countryId) must be provided for update', 400);
            }

            const updatePayload: any = {};
            if (data.name) updatePayload.name = data.name;
            if (data.countryId) updatePayload.countryId = data.countryId;

            await db.city.update({
                where: { id },
                data: updatePayload
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async deleteCities(ids: number[], db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.$transaction(async (tx) => {
                // Check all cities exist and have no districts
                for (const id of ids) {
                    const city = await tx.city.findUnique({
                        where: { id },
                        select: {
                            districts: {
                                select: { id: true },
                                take: 1
                            }
                        }
                    });

                    if (!city) {
                        throw CustomError.getWithMessage(`City with ID ${id} not found`, 404);
                    }

                    if (city.districts.length > 0) {
                        throw CustomError.getWithMessage(`Cannot delete city with ID ${id} because it has districts`, 400);
                    }
                }

                // Delete all cities
                await tx.city.deleteMany({
                    where: {
                        id: { in: ids }
                    }
                });
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    // District CRUD operations
    async addDistricts(districts: { name: string; cityId: number }[], db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.district.createMany({
                data: districts,
                skipDuplicates: true
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async updateDistrict(id: number, data: { name?: string; cityId?: number }, db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            // Validate at least one field is being updated
            if (!data.name && !data.cityId) {
                throw CustomError.getWithMessage('At least one field (name or cityId) must be provided for update', 400);
            }

            const updatePayload: any = {};
            if (data.name) updatePayload.name = data.name;
            if (data.cityId) updatePayload.cityId = data.cityId;

            await db.district.update({
                where: { id },
                data: updatePayload
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async deleteDistricts(ids: number[], db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.$transaction(async (tx) => {
                // Check all districts exist and have no neighbourhoods
                for (const id of ids) {
                    const district = await tx.district.findUnique({
                        where: { id },
                        select: {
                            neighbourhoods: {
                                select: { id: true },
                                take: 1
                            }
                        }
                    });

                    if (!district) {
                        throw CustomError.getWithMessage(`District with ID ${id} not found`, 404);
                    }

                    if (district.neighbourhoods.length > 0) {
                        throw CustomError.getWithMessage(`Cannot delete district with ID ${id} because it has neighbourhoods`, 400);
                    }
                }

                // Delete all districts
                await tx.district.deleteMany({
                    where: {
                        id: { in: ids }
                    }
                });
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    // Neighbourhood CRUD operations
    async addNeighbourhoods(neighbourhoods: { name: string; districtId: number }[], db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.neighbourhood.createMany({
                data: neighbourhoods,
                skipDuplicates: true
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async updateNeighbourhood(id: number, data: { name?: string; districtId?: number }, db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            // Validate at least one field is being updated
            if (!data.name && !data.districtId) {
                throw CustomError.getWithMessage('At least one field (name or districtId) must be provided for update', 400);
            }

            const updatePayload: any = {};
            if (data.name) updatePayload.name = data.name;
            if (data.districtId) updatePayload.districtId = data.districtId;

            await db.neighbourhood.update({
                where: { id },
                data: updatePayload
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    async deleteNeighbourhoods(ids: number[], db: PrismaClient = prisma): Promise<Response<null>> {
        try {
            await db.$transaction(async (tx) => {
                // Check all neighbourhoods exist and have no addresses or orderAddresses
                for (const id of ids) {
                    const neighbourhood = await tx.neighbourhood.findUnique({
                        where: { id },
                        select: {
                            addresses: {
                                select: { id: true },
                                take: 1
                            },
                            orderAddresses: {
                                select: { id: true },
                                take: 1
                            }
                        }
                    });

                    if (!neighbourhood) {
                        throw CustomError.getWithMessage(`Neighbourhood with ID ${id} not found`, 404);
                    }

                    if (neighbourhood.addresses.length > 0 || neighbourhood.orderAddresses.length > 0) {
                        throw CustomError.getWithMessage(`Cannot delete neighbourhood with ID ${id} because it has addresses`, 400);
                    }
                }

                // Delete all neighbourhoods
                await tx.neighbourhood.deleteMany({
                    where: {
                        id: { in: ids }
                    }
                });
            });

            // Clear cache after successful operation
            this.clearCache();

            return Response.getSuccess(null);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },

    /**
     * Clear location cache
     * Call this when locations are added/updated/deleted
     */
    clearCache(): void {
        locationCache.clear();
    },
};