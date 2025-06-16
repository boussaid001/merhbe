// IndexedDB storage for offline message history
export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  isLocal?: boolean;
}

// Database configuration
const DB_NAME = 'tn4ChatDB';
const DB_VERSION = 1;
const MESSAGES_STORE = 'messages';

/**
 * Interface for chat history entry
 */
export interface ChatHistoryEntry {
  partnerId: string;
  username: string;
  lastMessage: string;
  timestamp: Date;
}

/**
 * Initialize the IndexedDB database
 */
export const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.error('Your browser does not support IndexedDB');
      reject('IndexedDB not supported');
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create messages store
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        messagesStore.createIndex('by_conversation', ['senderId', 'receiverId'], { unique: false });
        messagesStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * Save a message to IndexedDB
 */
export const saveMessage = async (message: Message): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(MESSAGES_STORE, 'readwrite');
    const store = transaction.objectStore(MESSAGES_STORE);
    
    // Convert Date to string for storage
    const messageToStore = {
      ...message,
      timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp,
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(messageToStore);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  } catch (error) {
    console.error('Error saving message to IndexedDB:', error);
    throw error;
  }
};

/**
 * Get conversation messages between two users
 */
export const getConversationMessages = async (userId: string, partnerId: string): Promise<Message[]> => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(MESSAGES_STORE, 'readonly');
    const store = transaction.objectStore(MESSAGES_STORE);
    const index = store.index('by_conversation');
    
    const messages: Message[] = [];
    
    // Get messages where current user is sender and partner is receiver
    const userToPartnerMessages = await new Promise<Message[]>((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only([userId, partnerId]));
      
      request.onsuccess = () => {
        const result = request.result.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        resolve(result);
      };
      
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
    
    // Get messages where partner is sender and current user is receiver
    const partnerToUserMessages = await new Promise<Message[]>((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only([partnerId, userId]));
      
      request.onsuccess = () => {
        const result = request.result.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        resolve(result);
      };
      
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
    
    // Combine and sort messages by timestamp
    return [...userToPartnerMessages, ...partnerToUserMessages]
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    return [];
  }
};

/**
 * Clear conversation history with a specific user
 */
export const clearConversation = async (userId: string, partnerId: string): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(MESSAGES_STORE, 'readwrite');
    const store = transaction.objectStore(MESSAGES_STORE);
    const index = store.index('by_conversation');
    
    // Delete messages where current user is sender and partner is receiver
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only([userId, partnerId]));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
    
    // Delete messages where partner is sender and current user is receiver
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only([partnerId, userId]));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
    
  } catch (error) {
    console.error('Error clearing conversation:', error);
    throw error;
  }
};

/**
 * Get recent chat partners from the last 24 hours
 */
export const getRecentChatPartners = async (userId: string): Promise<ChatHistoryEntry[]> => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(MESSAGES_STORE, 'readonly');
    const store = transaction.objectStore(MESSAGES_STORE);
    const index = store.index('by_timestamp');
    
    // Calculate timestamp for 24 hours ago
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    // Get all messages from the last 24 hours
    const recentMessages = await new Promise<Message[]>((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.lowerBound(oneDayAgo.toISOString()));
      
      request.onsuccess = () => {
        const result = request.result.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        resolve(result);
      };
      
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
    
    // Filter messages where user is sender or receiver
    const userMessages = recentMessages.filter(
      msg => msg.senderId === userId || msg.receiverId === userId
    );
    
    // Get unique partners and their latest message
    const partnerMap = new Map<string, ChatHistoryEntry>();
    
    userMessages.forEach(msg => {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const isUserSender = msg.senderId === userId;
      
      // Only update if this is a newer message
      if (!partnerMap.has(partnerId) || 
          partnerMap.get(partnerId)!.timestamp < msg.timestamp) {
        
        // Extract username from localStorage or generate a placeholder
        let username = 'Anonymous';
        if (localStorage.getItem(`username_${partnerId}`)) {
          username = localStorage.getItem(`username_${partnerId}`) || 'Anonymous';
        }
        
        partnerMap.set(partnerId, {
          partnerId,
          username,
          lastMessage: msg.content,
          timestamp: msg.timestamp
        });
      }
    });
    
    // Convert map to array and sort by timestamp (newest first)
    return Array.from(partnerMap.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
  } catch (error) {
    console.error('Error getting recent chat partners:', error);
    return [];
  }
};

/**
 * Save partner username to localStorage for history display
 */
export const savePartnerInfo = (partnerId: string, username: string): void => {
  localStorage.setItem(`username_${partnerId}`, username);
}; 