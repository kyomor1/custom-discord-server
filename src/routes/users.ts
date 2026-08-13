import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUsers, updateProfile } from '../controllers/user.controller.js';

const router = Router();

router.get('/', authMiddleware, getUsers);
router.put('/profile', authMiddleware, updateProfile);

export default router;
