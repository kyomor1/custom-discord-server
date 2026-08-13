import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export function formatReactions(reactions: any[] = [], currentUserId: string = '') {
  const grouped: Record<string, { emoji: string; count: number; users: string[]; reactedByMe: boolean }> = {};

  reactions.forEach(r => {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = {
        emoji: r.emoji,
        count: 0,
        users: [],
        reactedByMe: false
      };
    }
    grouped[r.emoji].count += 1;
    grouped[r.emoji].users.push(r.userId);
    if (r.userId === currentUserId) {
      grouped[r.emoji].reactedByMe = true;
    }
  });

  return Object.values(grouped);
}

export async function getChannelMessages(req: AuthRequest, res: Response) {
  try {
    const { channelId } = req.params;
    const currentUserId = req.userId || '';

    const messages = await prisma.message.findMany({
      where: { channelId },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, status: true, customStatus: true }
        },
        reactions: true
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    const serializedMessages = messages.map(msg => ({
      ...msg,
      fileSize: msg.fileSize ? Number(msg.fileSize) : null,
      reactions: formatReactions(msg.reactions, currentUserId)
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
          select: { id: true, username: true, avatarUrl: true, status: true, customStatus: true }
        },
        recipient: {
          select: { id: true, username: true, avatarUrl: true, status: true, customStatus: true }
        },
        reactions: true
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    const serializedMessages = messages.map(msg => ({
      ...msg,
      fileSize: msg.fileSize ? Number(msg.fileSize) : null,
      reactions: formatReactions(msg.reactions, currentUserId)
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

export async function togglePinMessage(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { isPinned: !message.isPinned },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, status: true, customStatus: true }
        },
        reactions: true
      }
    });

    return res.json({
      message: {
        ...updated,
        fileSize: updated.fileSize ? Number(updated.fileSize) : null,
        reactions: formatReactions(updated.reactions, req.userId)
      }
    });
  } catch (error) {
    console.error('Toggle pin message error:', error);
    return res.status(500).json({ error: 'Failed to pin/unpin message' });
  }
}

export async function getPinnedMessages(req: AuthRequest, res: Response) {
  try {
    const { channelId } = req.params;

    const messages = await prisma.message.findMany({
      where: { channelId, isPinned: true },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, status: true, customStatus: true }
        },
        reactions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedMessages = messages.map(msg => ({
      ...msg,
      fileSize: msg.fileSize ? Number(msg.fileSize) : null,
      reactions: formatReactions(msg.reactions, req.userId)
    }));

    return res.json({ pinnedMessages: serializedMessages });
  } catch (error) {
    console.error('Fetch pinned messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch pinned messages' });
  }
}
