import { Request, Response, NextFunction } from 'express';
import { getAuthProvider } from '../auth/provider';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    auth0Id?: string;
  };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: Missing or malformed Auth header');
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  const provider = getAuthProvider();

  try {
    const user = await provider.verifyToken(token);
    req.user = user;
    return next();
  } catch (err: any) {
    logger.warn(`Authentication failed: ${err.message}`);
    return res.status(401).json({ error: err.message || 'Authentication failed' });
  }
}
