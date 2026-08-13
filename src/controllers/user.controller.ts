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
    const { username, avatarUrl } = req.body;

    const dataToUpdate: { username?: string; avatarUrl?: string } = {};

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

    if (avatarUrl) {
      dataToUpdate.avatarUrl = avatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId! },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}
