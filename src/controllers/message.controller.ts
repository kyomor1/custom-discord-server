import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getChannelMessages(req: AuthRequest, res: Response) {
  try {
    const { channelId } = req.params;

    const messages = await prisma.message.findMany({
      where: { channelId },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    const serializedMessages = messages.map(msg => ({
      ...msg,
      fileSize: msg.fileSize ? Number(msg.fileSize) : null
    }));

    return res.json({ messages: serializedMessages });
  } catch (error) {
    console.error('Fetch channel messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

export async function getDmMessages(req: AuthRequest, res: Response) {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.userId!;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { authorId: currentUserId, recipientId: otherUserId },
          { authorId: otherUserId, recipientId: currentUserId }
        ]
      },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true }
        },
        recipient: {
          select: { id: true, username: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    const serializedMessages = messages.map(msg => ({
      ...msg,
      fileSize: msg.fileSize ? Number(msg.fileSize) : null
    }));

    return res.json({ messages: serializedMessages });
  } catch (error) {
    console.error('Fetch DM messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch DM messages' });
  }
}

export async function deleteMessage(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = req.userId!;

    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.authorId !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await prisma.message.deleteMany({
      where: { id, authorId: currentUserId }
    });

    return res.json({ success: true, messageId: id, channelId: message.channelId });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
}
