import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get chat history with a specific user
router.get('/history/:partnerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { partnerId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get messages between the two users
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Mark messages as read
    if (messages.length > 0) {
      await prisma.chatMessage.updateMany({
        where: {
          senderId: partnerId,
          receiverId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    }
    
    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Count unread messages
    const unreadCount = await prisma.chatMessage.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
    
    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { messageId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if message exists and belongs to the user
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (message.senderId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }
    
    // Delete message
    await prisma.chatMessage.delete({
      where: { id: messageId }
    });
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 