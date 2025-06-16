import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }
    
    const user = await verifyToken(token);
    
    if (!user) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    
    // Attach user info to the request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
}; 