import express, { Router } from 'express';

import {
    checkoutHandler,
    getOrderHandler,
    listOrdersHandler
} from './order.controller';

const router: Router = express.Router();

const userRouter: Router = express.Router();
userRouter.post('/checkout', checkoutHandler);
userRouter.get('/order', listOrdersHandler);
userRouter.get('/order/:orderId', getOrderHandler);

export default router;
export { userRouter };
