import express, { Router } from 'express';

import {
    getAllHandler,
    getCountriesHandler,
    getCountryHandler,
    getDistrictHandler,
    getCityHandler,
    addCountriesHandler,
    updateCountryHandler,
    deleteCountriesHandler,
    addCitiesHandler,
    updateCityHandler,
    deleteCitiesHandler,
    addDistrictsHandler,
    updateDistrictHandler,
    deleteDistrictsHandler,
    addNeighbourhoodsHandler,
    updateNeighbourhoodHandler,
    deleteNeighbourhoodsHandler
} from './location.controller';

const router: Router = express.Router();

// Public routes
router.get('/', getAllHandler);
router.get('/country', getCountriesHandler);
router.get('/country/:id', getCountryHandler);
router.get('/city/:id', getCityHandler);
router.get('/district/:id', getDistrictHandler);

// Admin routes
const adminRouter: Router = express.Router();

// Country admin routes
adminRouter.post('/country', addCountriesHandler);
adminRouter.put('/country/:id', updateCountryHandler);
adminRouter.delete('/country', deleteCountriesHandler);

// City admin routes
adminRouter.post('/city', addCitiesHandler);
adminRouter.put('/city/:id', updateCityHandler);
adminRouter.delete('/city', deleteCitiesHandler);

// District admin routes
adminRouter.post('/district', addDistrictsHandler);
adminRouter.put('/district/:id', updateDistrictHandler);
adminRouter.delete('/district', deleteDistrictsHandler);

// Neighbourhood admin routes
adminRouter.post('/neighbourhood', addNeighbourhoodsHandler);
adminRouter.put('/neighbourhood/:id', updateNeighbourhoodHandler);
adminRouter.delete('/neighbourhood', deleteNeighbourhoodsHandler);

export default router;
export { adminRouter };