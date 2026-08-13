import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getChannelMessages,
  getDmMessages,
  deleteMessage,
  togglePinMessage,
  getPinnedMessages
} from '../controllers/message.controller.js';

const router = Router();

router.get('/channel/:channelId', authMiddleware, getChannelMessages);
router.get('/dm/:otherUserId', authMiddleware, getDmMessages);
router.delete('/:id', authMiddleware, deleteMessage);
router.put('/:id/pin', authMiddleware, togglePinMessage);
router.get('/pinned/:channelId', authMiddleware, getPinnedMessages);

export default router;
