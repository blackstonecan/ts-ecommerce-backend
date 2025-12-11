import express, { Router } from 'express';

import {
    getProductsHandler,
    getProductHandler,
    getProductForAdminHandler
} from './product.controller';

const router: Router = express.Router();

router.get('/', getProductsHandler);
router.get('/:slug', getProductHandler);

const adminRouter: Router = express.Router();
adminRouter.get('/:id', getProductForAdminHandler);

export default router;
export { adminRouter };