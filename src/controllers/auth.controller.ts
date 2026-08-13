import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { JWT_SECRET, AuthRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response) {
  const { username, password } = req.body || {};
  console.log(`[Auth/Register] Attempt received. Username: "${username || ''}"`);

  try {
    if (!username || !password) {
      console.warn(`[Auth/Register] Validation failed: Username or password missing.`);
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 2) {
      console.warn(`[Auth/Register] Validation failed: Username "${cleanUsername}" is shorter than 2 chars.`);
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }

    console.log(`[Auth/Register] Checking database for existing user: "${cleanUsername}"`);
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });

    if (existingUser) {
      console.warn(`[Auth/Register] Registration failed: Username "${cleanUsername}" is already taken.`);
      return res.status(400).json({ error: 'Username is already taken' });
    }

    console.log(`[Auth/Register] Hashing password and creating user record...`);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`
      }
    });

    console.log(`[Auth/Register] User created successfully! ID: ${user.id}, Username: ${user.username}`);

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`[Auth/Register] JWT token generated successfully for user ID: ${user.id}`);

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    console.error(`[Auth/Register] EXCEPTION CAUGHT during registration:`, error);
    if (error.code) {
      console.error(`[Auth/Register] Prisma/DB Error Code: ${error.code}, Message: ${error.message}`);
    }
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body || {};
  console.log(`[Auth/Login] Attempt received. Username: "${username || ''}"`);

  try {
    if (!username || !password) {
      console.warn(`[Auth/Login] Validation failed: Username or password missing.`);
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim();
    console.log(`[Auth/Login] Querying database for user: "${cleanUsername}"`);
    const user = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });

    if (!user) {
      console.warn(`[Auth/Login] Login failed: User "${cleanUsername}" not found in database.`);
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    console.log(`[Auth/Login] User found (${user.id}). Comparing password hash...`);
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.warn(`[Auth/Login] Login failed: Password mismatch for user "${cleanUsername}".`);
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    console.log(`[Auth/Login] Password match verified! Generating JWT token...`);
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`[Auth/Login] Login successful for user ID: ${user.id}`);

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    console.error(`[Auth/Login] EXCEPTION CAUGHT during login:`, error);
    if (error.code) {
      console.error(`[Auth/Login] Prisma/DB Error Code: ${error.code}, Message: ${error.message}`);
    }
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  console.log(`[Auth/Me] Fetching current user details for userId: ${req.userId}`);
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, avatarUrl: true, createdAt: true }
    });

    if (!user) {
      console.warn(`[Auth/Me] User with ID ${req.userId} not found in database.`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Auth/Me] User details fetched successfully for: ${user.username}`);
    return res.json({ user });
  } catch (error: any) {
    console.error(`[Auth/Me] EXCEPTION CAUGHT during getMe:`, error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
