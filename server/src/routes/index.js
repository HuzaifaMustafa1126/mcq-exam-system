import { Router } from 'express';
import { API_PREFIX } from '../constants/app.js';
import authRoutes from './auth.routes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use(API_PREFIX, healthRoutes);
router.use(`${API_PREFIX}/auth`, authRoutes);

export default router;
