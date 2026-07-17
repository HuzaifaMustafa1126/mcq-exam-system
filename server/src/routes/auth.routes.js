import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { loginValidation } from '../validations/auth.validation.js';

const router = Router();

router.post('/login', loginValidation, login);

export default router;
