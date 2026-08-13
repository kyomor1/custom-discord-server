import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function createChannel(req: AuthRequest, res: Response) {
  try {
    const { serverId } = req.params;
    const { name, type } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const channel = await prisma.channel.create({
      data: {
        name: name.trim(),
        type: type === 'VOICE' ? 'VOICE' : 'TEXT',
        serverId
      }
    });

    return res.status(201).json({ channel });
  } catch (error) {
    console.error('Create channel error:', error);
    return res.status(500).json({ error: 'Failed to create channel' });
  }
}

export async function updateChannel(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const channel = await prisma.channel.update({
      where: { id },
      data: { name: name.trim() }
    });

    return res.json({ channel });
  } catch (error) {
    console.error('Update channel error:', error);
    return res.status(500).json({ error: 'Failed to update channel' });
  }
}

export async function deleteChannel(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    await prisma.channel.delete({
      where: { id }
    });

    return res.json({ success: true, message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Delete channel error:', error);
    return res.status(500).json({ error: 'Failed to delete channel' });
  }
}
