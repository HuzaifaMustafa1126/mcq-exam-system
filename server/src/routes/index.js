import { Router } from 'express';
import { API_PREFIX } from '../constants/app.js';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import examQuestionRoutes from './examQuestion.routes.js';
import examRoutes from './exam.routes.js';
import healthRoutes from './healthRoutes.js';
import questionRoutes from './question.routes.js';
import resultRoutes from './result.routes.js';
import studentRoutes from './student.routes.js';
import studentExamRoutes from './studentExam.routes.js';
import subjectRoutes from './subject.routes.js';
import teacherRoutes from './teacher.routes.js';

const router = Router();

router.use(API_PREFIX, healthRoutes);
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
router.use(`${API_PREFIX}/teachers`, teacherRoutes);
router.use(`${API_PREFIX}/students`, studentRoutes);
router.use(`${API_PREFIX}/student/exams`, studentExamRoutes);
router.use(`${API_PREFIX}/student/results`, resultRoutes);
router.use(`${API_PREFIX}/subjects`, subjectRoutes);
router.use(`${API_PREFIX}/questions`, questionRoutes);
router.use(`${API_PREFIX}/exams`, examQuestionRoutes);
router.use(`${API_PREFIX}/exams`, examRoutes);

export default router;
