import { Router } from 'express';
import { login, updateProfile } from '../controllers/auth.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { loginValidation, updateProfileValidation } from '../validations/auth.validation.js';

const router = Router();

router.post('/login', loginValidation, login);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);

export default router;
