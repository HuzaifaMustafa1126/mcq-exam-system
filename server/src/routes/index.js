import { Router } from 'express';
import { API_PREFIX } from '../constants/app.js';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use(API_PREFIX, healthRoutes);
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

export default router;
