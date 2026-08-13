import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'custom-discord-secret-key-2026';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let authHeader =
    (req.headers.authorization as string) ||
    (req.headers.Authorization as string) ||
    (req.headers['x-access-token'] as string);

  if (!authHeader && req.query && typeof req.query.token === 'string') {
    authHeader = `Bearer ${req.query.token}`;
  }

  if (!authHeader || typeof authHeader !== 'string') {
    console.warn(`[AuthMiddleware] Unauthorized access attempt to ${req.originalUrl} - Missing or malformed Authorization header. Received headers:`, Object.keys(req.headers));
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (err: any) {
    console.warn(`[AuthMiddleware] JWT verification failed for ${req.originalUrl}:`, err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
