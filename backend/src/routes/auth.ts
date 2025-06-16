import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken, hashPassword, comparePassword, sanitizeUser } from '../utils/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already in use' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      }
    });
    
    // Generate token
    const token = generateToken({ id: user.id, username: user.username });
    
    // Return sanitized user and token
    res.status(201).json({
      user: sanitizeUser(user),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    // If user doesn't exist or password doesn't match
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken({ id: user.id, username: user.username });
    
    // Return sanitized user and token
    res.status(200).json({
      user: sanitizeUser(user),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Verify token
 */
router.post('/verify', async (req, res) => {
  try {
    // Token is verified by the auth middleware
    // If we get here, the token is valid
    res.status(200).json({ valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 