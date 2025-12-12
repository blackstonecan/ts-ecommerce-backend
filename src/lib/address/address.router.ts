import express, { Router } from 'express';

import {
    getUserAddressesHandler,
    getAddressHandler,
    addAddressHandler,
    updateAddressHandler,
    deleteAddressHandler
} from './address.controller';

const router: Router = express.Router();

const userRouter: Router = express.Router();
userRouter.get('/', getUserAddressesHandler);
userRouter.get('/:id', getAddressHandler);
userRouter.post('/', addAddressHandler);
userRouter.put('/:id', updateAddressHandler);
userRouter.delete('/:id', deleteAddressHandler);

export default router;
export { userRouter };