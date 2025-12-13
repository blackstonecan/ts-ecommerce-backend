import express, { Router } from 'express';

import {
    getCartHandler,
    addCartItemHandler,
    updateCartItemHandler,
    removeCartItemHandler,
    clearCartHandler
} from './cart.controller';

const router: Router = express.Router();

const userRouter: Router = express.Router();
userRouter.get('/', getCartHandler);
userRouter.post('/', addCartItemHandler);
userRouter.patch('/:itemId', updateCartItemHandler);
userRouter.delete('/:itemId', removeCartItemHandler);
userRouter.delete('/', clearCartHandler);

export default router;
export { userRouter };
