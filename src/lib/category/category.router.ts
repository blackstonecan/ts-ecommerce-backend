import express, { Router } from 'express';

import {
    getCategoriesHandler,
    getCategoryWithProductsHandler,
    addCategoryHandler,
    updateCategoryHandler,
    deleteCategoryHandler
} from './category.controller';
import { uploadSingleImage } from '../common/upload';

const router: Router = express.Router();
router.get('/', getCategoriesHandler);
router.get('/:slug', getCategoryWithProductsHandler);

const adminRouter: Router = express.Router();
adminRouter.post('/', uploadSingleImage, addCategoryHandler);
adminRouter.put('/:id', uploadSingleImage, updateCategoryHandler);
adminRouter.delete('/:id', deleteCategoryHandler);

export default router;
export { adminRouter };