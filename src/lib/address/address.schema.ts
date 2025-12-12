import { z } from 'zod';

const GetAddressParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Address ID must be a number').transform(Number)
});

const AddAddressSchema = z.object({
    name: z.string().min(1, 'Address name is required').max(255, 'Address name must be less than 255 characters'),
    addressLine1: z.string().min(1, 'Address line 1 is required').max(500, 'Address line 1 must be less than 500 characters'),
    addressLine2: z.string().max(500, 'Address line 2 must be less than 500 characters').optional(),
    postalCode: z.string().min(1, 'Postal code is required').max(20, 'Postal code must be less than 20 characters'),
    neighbourhoodId: z.number().int().positive('Neighbourhood ID must be a positive integer')
});

const UpdateAddressParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Address ID must be a number').transform(Number)
});

const UpdateAddressBodySchema = z.object({
    name: z.string().min(1, 'Address name must not be empty').max(255, 'Address name must be less than 255 characters').optional(),
    addressLine1: z.string().min(1, 'Address line 1 must not be empty').max(500, 'Address line 1 must be less than 500 characters').optional(),
    addressLine2: z.string().max(500, 'Address line 2 must be less than 500 characters').optional(),
    postalCode: z.string().min(1, 'Postal code must not be empty').max(20, 'Postal code must be less than 20 characters').optional(),
    neighbourhoodId: z.number().int().positive('Neighbourhood ID must be a positive integer').optional()
});

const DeleteAddressParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Address ID must be a number').transform(Number)
});

export {
    GetAddressParamsSchema,
    AddAddressSchema,
    UpdateAddressParamsSchema,
    UpdateAddressBodySchema,
    DeleteAddressParamsSchema
};
