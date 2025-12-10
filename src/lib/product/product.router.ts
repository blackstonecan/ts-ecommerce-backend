import express, { Router } from 'express';

import {
    getProductsHandler,
    getProductHandler
} from './product.controller';

const router: Router = express.Router();

router.get('/', getProductsHandler);
router.get('/:slug', getProductHandler);

export default router;