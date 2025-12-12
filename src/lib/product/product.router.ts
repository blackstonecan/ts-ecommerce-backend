import express, { Router } from 'express';

import {
    getProductsHandler,
    getProductHandler,
    getProductForAdminHandler,
    addProductHandler,
    updateProductHandler,
    deleteProductHandler,
    updateStockHandler
} from './product.controller';
import { uploadProductImages } from '@/lib/common/upload';

const router: Router = express.Router();

router.get('/', getProductsHandler);
router.get('/:slug', getProductHandler);

const adminRouter: Router = express.Router();
adminRouter.get('/:id', getProductForAdminHandler);
adminRouter.post('/', uploadProductImages, addProductHandler);
adminRouter.put('/:id', uploadProductImages, updateProductHandler);
adminRouter.patch('/:id/stock', updateStockHandler);
adminRouter.delete('/:id', deleteProductHandler);

export default router;
export { adminRouter };