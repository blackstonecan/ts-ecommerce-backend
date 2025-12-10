import express, { Router } from 'express';

import {
    getAllHandler
} from './location.controller';

const router: Router = express.Router();

router.get('/', getAllHandler);

export default router;