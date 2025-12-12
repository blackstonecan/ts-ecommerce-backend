import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { ICity, ICountry, ICountryExtended, IDistrict, IDistrictExtended } from './location.types';
import { locationRepo } from './location.repo';
import {
    GetCityParamsSchema,
    GetCountryParamsSchema,
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
} from './location.schema';
import CustomError from '../error/CustomError';

export const getAllHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICountryExtended[];

        // Fetch locations
        response = await locationRepo.listAll();
        if (!response.success) throw response.error;

        output = response.data as ICountryExtended[];

        res.status(200).json(new Respond(true, 200, output, 'Locations fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const getCountriesHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICountry[];

        // Fetch countries
        response = await locationRepo.listCountries();
        if (!response.success) throw response.error;

        output = response.data as ICountry[];

        res.status(200).json(new Respond(true, 200, output, 'Countries fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const getCountryHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICountry & { cities: ICity[] };

        // Validate path parameters
        const paramsResult = GetCountryParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Fetch country
        response = await locationRepo.getCountry(params.id);
        if (!response.success) throw response.error;

        output = response.data as ICountry & { cities: ICity[] };

        res.status(200).json(new Respond(true, 200, output, 'Country fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const getCityHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICity & { districts: IDistrict[] };

        // Validate path parameters
        const paramsResult = GetCityParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Fetch city
        response = await locationRepo.getCity(params.id);
        if (!response.success) throw response.error;

        output = response.data as ICity & { districts: IDistrict[] };

        res.status(200).json(new Respond(true, 200, output, 'City fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const getDistrictHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: IDistrictExtended;

        // Validate path parameters
        const paramsResult = GetDistrictParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Fetch district
        response = await locationRepo.getDistrict(params.id);
        if (!response.success) throw response.error;

        output = response.data as IDistrictExtended;

        res.status(200).json(new Respond(true, 200, output, 'District fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const addCountriesHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate request body
        const parseResult = AddCountriesSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Add countries via repo
        response = await locationRepo.addCountries(data.countries);
        if (!response.success) throw response.error;

        res.status(201).json(new Respond(true, 201, null, 'Countries added successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const updateCountryHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate path parameters
        const paramsResult = UpdateCountryParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Validate request body
        const bodyResult = UpdateCountryBodySchema.safeParse(req.body);
        if (!bodyResult.success) throw CustomError.getWithMessage(bodyResult.error.message, 400);
        const body = bodyResult.data;

        // Update country via repo
        response = await locationRepo.updateCountry(params.id, body);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Country updated successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const deleteCountriesHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate request body
        const parseResult = DeleteCountriesSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Delete countries via repo
        response = await locationRepo.deleteCountries(data.ids);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Countries deleted successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const addCitiesHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate request body
        const parseResult = AddCitiesSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Add cities via repo
        response = await locationRepo.addCities(data.cities);
        if (!response.success) throw response.error;

        res.status(201).json(new Respond(true, 201, null, 'Cities added successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const updateCityHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate path parameters
        const paramsResult = UpdateCityParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Validate request body
        const bodyResult = UpdateCityBodySchema.safeParse(req.body);
        if (!bodyResult.success) throw CustomError.getWithMessage(bodyResult.error.message, 400);
        const body = bodyResult.data;

        // Update city via repo
        response = await locationRepo.updateCity(params.id, body);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'City updated successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const deleteCitiesHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate request body
        const parseResult = DeleteCitiesSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Delete cities via repo
        response = await locationRepo.deleteCities(data.ids);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Cities deleted successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const addDistrictsHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate request body
        const parseResult = AddDistrictsSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Add districts via repo
        response = await locationRepo.addDistricts(data.districts);
        if (!response.success) throw response.error;

        res.status(201).json(new Respond(true, 201, null, 'Districts added successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const updateDistrictHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate path parameters
        const paramsResult = UpdateDistrictParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Validate request body
        const bodyResult = UpdateDistrictBodySchema.safeParse(req.body);
        if (!bodyResult.success) throw CustomError.getWithMessage(bodyResult.error.message, 400);
        const body = bodyResult.data;

        // Update district via repo
        response = await locationRepo.updateDistrict(params.id, body);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'District updated successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const deleteDistrictsHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate request body
        const parseResult = DeleteDistrictsSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Delete districts via repo
        response = await locationRepo.deleteDistricts(data.ids);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Districts deleted successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

// Neighbourhood CRUD handlers
export const addNeighbourhoodsHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate request body
        const parseResult = AddNeighbourhoodsSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Add neighbourhoods via repo
        response = await locationRepo.addNeighbourhoods(data.neighbourhoods);
        if (!response.success) throw response.error;

        res.status(201).json(new Respond(true, 201, null, 'Neighbourhoods added successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const updateNeighbourhoodHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate path parameters
        const paramsResult = UpdateNeighbourhoodParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Validate request body
        const bodyResult = UpdateNeighbourhoodBodySchema.safeParse(req.body);
        if (!bodyResult.success) throw CustomError.getWithMessage(bodyResult.error.message, 400);
        const body = bodyResult.data;

        // Update neighbourhood via repo
        response = await locationRepo.updateNeighbourhood(params.id, body);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Neighbourhood updated successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const deleteNeighbourhoodsHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate request body
        const parseResult = DeleteNeighbourhoodsSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Delete neighbourhoods via repo
        response = await locationRepo.deleteNeighbourhoods(data.ids);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Neighbourhoods deleted successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});