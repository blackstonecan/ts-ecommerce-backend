import express, { Router } from 'express';

import { categoryAdminRouter } from '../category';
import { productAdminRouter } from '../product';
import { locationAdminRouter } from '../location';

const router: Router = express.Router();

router.use('/category', categoryAdminRouter);
router.use('/product', productAdminRouter);
router.use('/location', locationAdminRouter);

export default router;