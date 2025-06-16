import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '@prisma/client';

// JWT token payload type
interface TokenPayload {
  userId: string;
  username: string;
}

/**
 * Generate a JWT token
 */
export const generateToken = (user: { id: string; username: string }): string => {
  const secret = process.env.JWT_SECRET || 'default_secret_change_this';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    { userId: user.id, username: user.username } as TokenPayload,
    secret,
    { expiresIn }
  );
};

/**
 * Verify a JWT token
 */
export const verifyToken = async (token: string): Promise<TokenPayload | null> => {
  try {
    const secret = process.env.JWT_SECRET || 'default_secret_change_this';
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare a password with a hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Sanitize user object by removing sensitive fields
 */
export const sanitizeUser = (user: User): Omit<User, 'password'> => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}; 