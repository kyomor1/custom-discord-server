import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUsers, updateProfile, updateStatus } from '../controllers/user.controller.js';

const router = Router();

router.get('/', authMiddleware, getUsers);
router.put('/profile', authMiddleware, updateProfile);
router.put('/status', authMiddleware, updateStatus);

export default router;
