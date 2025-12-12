import express, { Router } from 'express';

import { addressUserRouter } from '../address';

import { getMeHandler } from './user.controller';

const router: Router = express.Router();

// User routes
router.get('/me', getMeHandler);

// Address routes
router.use('/address', addressUserRouter);

export default router;