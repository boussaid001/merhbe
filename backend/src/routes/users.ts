import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sanitizeUser } from '../utils/auth';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get the current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update the current user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Only allow certain fields to be updated
    const { username, email } = req.body;
    
    // Check if username is already taken
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId }
        }
      });
      
      if (existingUser) {
        return res.status(409).json({ message: 'Username already in use' });
      }
    }
    
    // Check if email is already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });
      
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email })
      }
    });
    
    res.status(200).json({ user: sanitizeUser(updatedUser) });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 