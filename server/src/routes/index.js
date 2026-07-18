import { Router } from 'express';
import { API_PREFIX } from '../constants/app.js';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import healthRoutes from './healthRoutes.js';
import studentRoutes from './student.routes.js';
import teacherRoutes from './teacher.routes.js';

const router = Router();

router.use(API_PREFIX, healthRoutes);
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
router.use(`${API_PREFIX}/teachers`, teacherRoutes);
router.use(`${API_PREFIX}/students`, studentRoutes);

export default router;
