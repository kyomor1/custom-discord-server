import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { register, login, getMe } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

export default router;
