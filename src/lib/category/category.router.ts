import express, { Router } from 'express';

import {
    getCategoriesHandler
} from './category.controller';

const router: Router = express.Router();

router.get('/', getCategoriesHandler);

export default router;