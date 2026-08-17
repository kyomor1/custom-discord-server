import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error(
    '[FATAL] JWT_SECRET is not set. The server refuses to start without a JWT secret. ' +
    'Set the JWT_SECRET environment variable (Render → Environment, or a local .env / shell variable).'
  );
}
export const JWT_SECRET: string = jwtSecret;

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  console.log(`[AuthMiddleware] Incoming Request: ${req.method} ${req.originalUrl}`);

  let authHeader =
    (req.headers.authorization as string) ||
    (req.headers.Authorization as string) ||
    (req.headers['x-access-token'] as string);

  if (!authHeader && req.query && typeof req.query.token === 'string') {
    authHeader = `Bearer ${req.query.token}`;
  }

  if (!authHeader || typeof authHeader !== 'string') {
    console.warn(`[AuthMiddleware] Unauthorized access attempt to ${req.originalUrl} - Missing or malformed Authorization header.`);
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
