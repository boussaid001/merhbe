// Friends system utility functions

// Friend interfaces
export interface Friend {
  id: string;
  username: string;
  avatar: string;
  lastSeen: Date;
  isOnline?: boolean;
}

export interface FriendRequest {
  id: string;
  username: string;
  avatar: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

// Storage keys
const FRIENDS_KEY = 'tn4_friends';
const SENT_REQUESTS_KEY = 'tn4_sent_requests';
const RECEIVED_REQUESTS_KEY = 'tn4_received_requests';

/**
 * Get all friends for a user
 */
export const getFriends = (userId: string): Friend[] => {
  try {
    const friendsData = localStorage.getItem(`${FRIENDS_KEY}_${userId}`);
    if (!friendsData) return [];
    
    const friends: Friend[] = JSON.parse(friendsData);
    return friends.map(friend => ({
      ...friend,
      lastSeen: new Date(friend.lastSeen)
    }));
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
};

/**
 * Add a new friend
 */
export const addFriend = (userId: string, friend: Friend): void => {
  try {
    const friends = getFriends(userId);
    const existingIndex = friends.findIndex(f => f.id === friend.id);
    
    if (existingIndex >= 0) {
      // Update existing friend
      friends[existingIndex] = {
        ...friend,
        lastSeen: new Date()
      };
    } else {
      // Add new friend
      friends.push({
        ...friend,
        lastSeen: new Date()
      });
    }
    
    localStorage.setItem(`${FRIENDS_KEY}_${userId}`, JSON.stringify(friends));
  } catch (error) {
    console.error('Error adding friend:', error);
  }
};

/**
 * Remove a friend
 */
export const removeFriend = (userId: string, friendId: string): void => {
  try {
    const friends = getFriends(userId);
    const updatedFriends = friends.filter(f => f.id !== friendId);
    localStorage.setItem(`${FRIENDS_KEY}_${userId}`, JSON.stringify(updatedFriends));
  } catch (error) {
    console.error('Error removing friend:', error);
  }
};

/**
 * Get sent friend requests
 */
export const getSentRequests = (userId: string): FriendRequest[] => {
  try {
    const requestsData = localStorage.getItem(`${SENT_REQUESTS_KEY}_${userId}`);
    if (!requestsData) return [];
    
    const requests: FriendRequest[] = JSON.parse(requestsData);
    return requests.map(req => ({
      ...req,
      timestamp: new Date(req.timestamp)
    }));
  } catch (error) {
    console.error('Error getting sent requests:', error);
    return [];
  }
};

/**
 * Get received friend requests
 */
export const getReceivedRequests = (userId: string): FriendRequest[] => {
  try {
    const requestsData = localStorage.getItem(`${RECEIVED_REQUESTS_KEY}_${userId}`);
    if (!requestsData) return [];
    
    const requests: FriendRequest[] = JSON.parse(requestsData);
    return requests.map(req => ({
      ...req,
      timestamp: new Date(req.timestamp)
    }));
  } catch (error) {
    console.error('Error getting received requests:', error);
    return [];
  }
};

/**
 * Send a friend request
 */
export const sendFriendRequest = (
  userId: string, 
  username: string,
  targetId: string, 
  targetUsername: string
): void => {
  try {
    // Add to sender's sent requests
    const sentRequests = getSentRequests(userId);
    const newSentRequest: FriendRequest = {
      id: targetId,
      username: targetUsername,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${targetId}`,
      timestamp: new Date(),
      status: 'pending'
    };
    
    sentRequests.push(newSentRequest);
    localStorage.setItem(`${SENT_REQUESTS_KEY}_${userId}`, JSON.stringify(sentRequests));
    
    // Add to receiver's received requests
    const receivedRequests = getReceivedRequests(targetId);
    const newReceivedRequest: FriendRequest = {
      id: userId,
      username: username,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      timestamp: new Date(),
      status: 'pending'
    };
    
    receivedRequests.push(newReceivedRequest);
    localStorage.setItem(`${RECEIVED_REQUESTS_KEY}_${targetId}`, JSON.stringify(receivedRequests));
    
    // Check if there's a mutual friend request and automatically accept
    const targetSentRequests = getSentRequests(targetId);
    const mutualRequest = targetSentRequests.find(req => req.id === userId);
    
    if (mutualRequest) {
      // Accept both requests
      acceptFriendRequest(userId, targetId);
      acceptFriendRequest(targetId, userId);
    }
  } catch (error) {
    console.error('Error sending friend request:', error);
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = (userId: string, requesterId: string): void => {
  try {
    // Update received request status
    const receivedRequests = getReceivedRequests(userId);
    const requestIndex = receivedRequests.findIndex(req => req.id === requesterId);
    
    if (requestIndex >= 0) {
      const request = receivedRequests[requestIndex];
      request.status = 'accepted';
      
      // Add as friend
      addFriend(userId, {
        id: request.id,
        username: request.username,
        avatar: request.avatar,
        lastSeen: new Date()
      });
      
      // Update sent requests on the other side
      const requesterSentRequests = getSentRequests(requesterId);
      const sentRequestIndex = requesterSentRequests.findIndex(req => req.id === userId);
      
      if (sentRequestIndex >= 0) {
        requesterSentRequests[sentRequestIndex].status = 'accepted';
        localStorage.setItem(`${SENT_REQUESTS_KEY}_${requesterId}`, JSON.stringify(requesterSentRequests));
      }
      
      // Add as friend on the other side
      const currentUserInfo = {
        id: userId,
        username: localStorage.getItem(`username_${userId}`) || 'User',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
        lastSeen: new Date()
      };
      
      addFriend(requesterId, currentUserInfo);
      
      // Update local storage
      localStorage.setItem(`${RECEIVED_REQUESTS_KEY}_${userId}`, JSON.stringify(receivedRequests));
    }
  } catch (error) {
    console.error('Error accepting friend request:', error);
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = (userId: string, requesterId: string): void => {
  try {
    // Update received request status
    const receivedRequests = getReceivedRequests(userId);
    const updatedRequests = receivedRequests.filter(req => req.id !== requesterId);
    
    localStorage.setItem(`${RECEIVED_REQUESTS_KEY}_${userId}`, JSON.stringify(updatedRequests));
  } catch (error) {
    console.error('Error rejecting friend request:', error);
  }
};

/**
 * Update friend online status
 */
export const updateFriendStatus = (userId: string, friendId: string, isOnline: boolean): void => {
  try {
    const friends = getFriends(userId);
    const friendIndex = friends.findIndex(f => f.id === friendId);
    
    if (friendIndex >= 0) {
      friends[friendIndex].isOnline = isOnline;
      friends[friendIndex].lastSeen = new Date();
      
      localStorage.setItem(`${FRIENDS_KEY}_${userId}`, JSON.stringify(friends));
    }
  } catch (error) {
    console.error('Error updating friend status:', error);
  }
};

// First, let's see what's in the file
// This will help us understand how friends are stored and managed 