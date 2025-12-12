import { z } from 'zod';

const GetCountryParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Country ID must be a number').transform(Number)
});

const GetCityParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'City ID must be a number').transform(Number)
});

const GetDistrictParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'District ID must be a number').transform(Number)
});

// Country schemas
const AddCountriesSchema = z.object({
    countries: z.array(z.object({
        name: z.string().min(1, 'Country name is required').max(255, 'Country name must be less than 255 characters'),
        code: z.string().min(2, 'Country code must be at least 2 characters').max(10, 'Country code must be less than 10 characters')
    })).min(1, 'At least one country is required')
});

const UpdateCountryParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Country ID must be a number').transform(Number)
});

const UpdateCountryBodySchema = z.object({
    name: z.string().min(1, 'Country name is required').max(255, 'Country name must be less than 255 characters').optional(),
    code: z.string().min(2, 'Country code must be at least 2 characters').max(10, 'Country code must be less than 10 characters').optional()
});

const DeleteCountriesSchema = z.object({
    ids: z.array(z.number().int().positive()).min(1, 'At least one country ID is required')
});

// City schemas
const AddCitiesSchema = z.object({
    cities: z.array(z.object({
        name: z.string().min(1, 'City name is required').max(255, 'City name must be less than 255 characters'),
        countryId: z.number().int().positive('Country ID must be a positive integer')
    })).min(1, 'At least one city is required')
});

const UpdateCityParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'City ID must be a number').transform(Number)
});

const UpdateCityBodySchema = z.object({
    name: z.string().min(1, 'City name is required').max(255, 'City name must be less than 255 characters').optional(),
    countryId: z.number().int().positive('Country ID must be a positive integer').optional()
});

const DeleteCitiesSchema = z.object({
    ids: z.array(z.number().int().positive()).min(1, 'At least one city ID is required')
});

// District schemas
const AddDistrictsSchema = z.object({
    districts: z.array(z.object({
        name: z.string().min(1, 'District name is required').max(255, 'District name must be less than 255 characters'),
        cityId: z.number().int().positive('City ID must be a positive integer')
    })).min(1, 'At least one district is required')
});

const UpdateDistrictParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'District ID must be a number').transform(Number)
});

const UpdateDistrictBodySchema = z.object({
    name: z.string().min(1, 'District name is required').max(255, 'District name must be less than 255 characters').optional(),
    cityId: z.number().int().positive('City ID must be a positive integer').optional()
});

const DeleteDistrictsSchema = z.object({
    ids: z.array(z.number().int().positive()).min(1, 'At least one district ID is required')
});

// Neighbourhood schemas
const AddNeighbourhoodsSchema = z.object({
    neighbourhoods: z.array(z.object({
        name: z.string().min(1, 'Neighbourhood name is required').max(255, 'Neighbourhood name must be less than 255 characters'),
        districtId: z.number().int().positive('District ID must be a positive integer')
    })).min(1, 'At least one neighbourhood is required')
});

const UpdateNeighbourhoodParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Neighbourhood ID must be a number').transform(Number)
});

const UpdateNeighbourhoodBodySchema = z.object({
    name: z.string().min(1, 'Neighbourhood name is required').max(255, 'Neighbourhood name must be less than 255 characters').optional(),
    districtId: z.number().int().positive('District ID must be a positive integer').optional()
});

const DeleteNeighbourhoodsSchema = z.object({
    ids: z.array(z.number().int().positive()).min(1, 'At least one neighbourhood ID is required')
});

export {
    GetCountryParamsSchema,
    GetCityParamsSchema,
    GetDistrictParamsSchema,
    AddCountriesSchema,
    UpdateCountryParamsSchema,
    UpdateCountryBodySchema,
    DeleteCountriesSchema,
    AddCitiesSchema,
    UpdateCityParamsSchema,
    UpdateCityBodySchema,
    DeleteCitiesSchema,
    AddDistrictsSchema,
    UpdateDistrictParamsSchema,
    UpdateDistrictBodySchema,
    DeleteDistrictsSchema,
    AddNeighbourhoodsSchema,
    UpdateNeighbourhoodParamsSchema,
    UpdateNeighbourhoodBodySchema,
    DeleteNeighbourhoodsSchema
};