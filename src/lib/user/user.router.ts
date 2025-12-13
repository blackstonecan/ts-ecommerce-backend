import express, { Router } from 'express';

import { addressUserRouter } from '../address';
import { cartUserRouter } from '../cart';
import { orderUserRouter } from '../order';

import { getMeHandler } from './user.controller';

const router: Router = express.Router();

// User routes
router.get('/me', getMeHandler);

// Address routes
router.use('/address', addressUserRouter);

// Cart routes
router.use('/cart', cartUserRouter);

// Order routes
router.use('/order', orderUserRouter);

export default router;