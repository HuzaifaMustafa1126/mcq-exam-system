import { Router } from 'express';
import { API_PREFIX } from '../constants/app.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use(API_PREFIX, healthRoutes);

export default router;
