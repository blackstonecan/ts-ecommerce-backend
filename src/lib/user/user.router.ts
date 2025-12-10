import express, { Router } from 'express';
import { getUserAddressesHandler } from '../address/address.controller';
import { getMeHandler } from './user.controller';

const router: Router = express.Router();

router.get('/addresses', getUserAddressesHandler);
router.get('/me', getMeHandler);

export default router;