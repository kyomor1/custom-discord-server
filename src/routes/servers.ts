import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createServer,
  joinServerByCode,
  getMyServers,
  updateServer,
  deleteServer
} from '../controllers/server.controller.js';

const router = Router();

router.post('/', authMiddleware, createServer);
router.post('/join-code', authMiddleware, joinServerByCode);
router.get('/', authMiddleware, getMyServers);
router.put('/:id', authMiddleware, updateServer);
router.delete('/:id', authMiddleware, deleteServer);

export default router;
