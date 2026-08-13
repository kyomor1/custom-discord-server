import { Response } from 'express';
import { prisma } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.userId }
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        status: true,
        customStatus: true,
        createdAt: true
      },
      orderBy: { username: 'asc' }
    });

    return res.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const { username, avatarUrl, status, customStatus } = req.body;

    const dataToUpdate: { username?: string; avatarUrl?: string; status?: string; customStatus?: string | null } = {};

    if (username && username.trim()) {
      const cleanName = username.trim();
      const existing = await prisma.user.findFirst({
        where: {
          username: cleanName,
          id: { not: req.userId! }
        }
      });
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      dataToUpdate.username = cleanName;
    }

    if (avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = avatarUrl;
    }

    if (status !== undefined) {
      dataToUpdate.status = status;
    }

    if (customStatus !== undefined) {
      dataToUpdate.customStatus = customStatus;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId! },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        status: true,
        customStatus: true,
        createdAt: true
      }
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function updateStatus(req: AuthRequest, res: Response) {
  try {
    const { status, customStatus } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(status !== undefined && { status }),
        ...(customStatus !== undefined && { customStatus })
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        status: true,
        customStatus: true,
        createdAt: true
      }
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
}
