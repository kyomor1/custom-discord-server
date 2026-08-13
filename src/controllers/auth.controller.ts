import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { JWT_SECRET, AuthRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`
      }
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, avatarUrl: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
