import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getChannelMessages,
  getDmMessages,
  deleteMessage
} from '../controllers/message.controller.js';

const router = Router();

router.get('/channel/:channelId', authMiddleware, getChannelMessages);
router.get('/dm/:otherUserId', authMiddleware, getDmMessages);
router.delete('/:id', authMiddleware, deleteMessage);

export default router;
