import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function createServer(req: AuthRequest, res: Response) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Server name is required' });
    }

    const server = await prisma.server.create({
      data: {
        name: name.trim(),
        ownerId: req.userId!,
        members: {
          create: {
            userId: req.userId!,
            role: 'OWNER'
          }
        },
        channels: {
          create: [
            { name: 'general', type: 'TEXT' },
            { name: 'General Voice', type: 'VOICE' }
          ]
        }
      },
      include: {
        channels: true,
        members: {
          include: { user: true }
        }
      }
    });

    return res.status(201).json({ server });
  } catch (error) {
    console.error('Create server error:', error);
    return res.status(500).json({ error: 'Failed to create server' });
  }
}

export async function joinServerByCode(req: AuthRequest, res: Response) {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const server = await prisma.server.findUnique({
      where: { inviteCode: inviteCode.trim() },
      include: {
        channels: true,
        members: {
          include: { user: true }
        }
      }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found with this invite code' });
    }

    const existingMember = server.members.find((m) => m.userId === req.userId);
    if (!existingMember) {
      await prisma.serverMember.create({
        data: {
          serverId: server.id,
          userId: req.userId!,
          role: 'MEMBER'
        }
      });
    }

    const updatedServer = await prisma.server.findUnique({
      where: { id: server.id },
      include: {
        channels: true,
        members: {
          include: { user: true }
        }
      }
    });

    return res.json({ server: updatedServer });
  } catch (error) {
    console.error('Join server error:', error);
    return res.status(500).json({ error: 'Failed to join server' });
  }
}

export async function getMyServers(req: AuthRequest, res: Response) {
  try {
    const myServers = await prisma.server.findMany({
      where: {
        members: {
          some: {
            userId: req.userId
          }
        }
      },
      include: {
        channels: true,
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true }
            }
          }
        }
      }
    });

    return res.json({ myServers });
  } catch (error) {
    console.error('Get servers error:', error);
    return res.status(500).json({ error: 'Failed to fetch servers' });
  }
}

export async function updateServer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, iconUrl } = req.body;

    const server = await prisma.server.findUnique({ where: { id } });
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only the server owner can edit server settings' });
    }

    const updated = await prisma.server.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : server.name,
        iconUrl: iconUrl !== undefined ? iconUrl : server.iconUrl
      },
      include: {
        channels: true,
        members: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } }
        }
      }
    });

    return res.json({ server: updated });
  } catch (error) {
    console.error('Update server error:', error);
    return res.status(500).json({ error: 'Failed to update server' });
  }
}

export async function deleteServer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const server = await prisma.server.findUnique({ where: { id } });
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only the server owner can delete this server' });
    }

    await prisma.server.delete({ where: { id } });

    return res.json({ success: true, message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Delete server error:', error);
    return res.status(500).json({ error: 'Failed to delete server' });
  }
}
