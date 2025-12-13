import express, { Router } from 'express';

import {
    stripeWebhookHandler
} from './stripe.controller';

const router: Router = express.Router();
router.post('/', express.raw({ type: "application/json" }), stripeWebhookHandler);

export default router;