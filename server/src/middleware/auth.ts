import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Graceful degradation: Use demo user if Clerk is not configured
  if (!process.env.CLERK_SECRET_KEY) {
    req.auth = { userId: 'demo-user-001' };
    return next();
  }

  // Service Worker / API Key bypass (for iOS Shortcuts, WhatsApp etc)
  if (req.headers['x-api-key'] && req.headers['x-api-key'] === process.env.SERVICE_API_KEY) {
    req.auth = { userId: req.body.userId || req.query.userId || 'demo-user-001' };
    return next();
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || (req.query.token as string);
    
    // In development mode, allow fallback to demo user if no token is provided
    if (!token && process.env.NODE_ENV !== 'production') {
      req.auth = { userId: 'demo-user-001' };
      return next();
    }

    if (!token) throw new Error('No token provided');
    
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    req.auth = { userId: verified.sub };
    next();
  } catch (error) {
    console.error('Clerk Auth Error:', error);
    res.status(401).json({ error: 'Unauthenticated' });
  }
};
