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
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie;
    const match = cookies.split(';').find(c => c.trim().startsWith('chatbuzz_token='));
    if (match) {
      token = match.split('=')[1];
    }
  }

  if (!token) {
    logger.warn('Authentication failed: Missing token in Auth header and cookies');
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token or cookie.' });
  }

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
