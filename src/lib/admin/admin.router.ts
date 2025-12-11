import express, { Router } from 'express';
import { categoryAdminRouter } from '../category';

const router: Router = express.Router();

router.use('/category', categoryAdminRouter);

export default router;