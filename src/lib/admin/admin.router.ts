import express, { Router } from 'express';

import { categoryAdminRouter } from '../category';
import { productAdminRouter } from '../product';

const router: Router = express.Router();

router.use('/category', categoryAdminRouter);
router.use('/product', productAdminRouter);

export default router;