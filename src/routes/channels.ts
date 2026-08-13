import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createChannel,
  updateChannel,
  deleteChannel
} from '../controllers/channel.controller.js';

const router = Router();

router.post('/server/:serverId', authMiddleware, createChannel);
router.put('/:id', authMiddleware, updateChannel);
router.delete('/:id', authMiddleware, deleteChannel);

export default router;
