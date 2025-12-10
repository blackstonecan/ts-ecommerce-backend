import express, { Router } from 'express';
import { getUserAddressesHandler } from '../address/address.controller';

const router: Router = express.Router();

router.get('/addresses', getUserAddressesHandler);

export default router;