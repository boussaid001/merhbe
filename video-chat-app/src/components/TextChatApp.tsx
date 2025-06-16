import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Message as DBMessage, saveMessage, getConversationMessages, getRecentChatPartners, ChatHistoryEntry, savePartnerInfo } from '../utils/indexedDB';
import { 
  Friend,
  FriendRequest,
  addFriend, 
  getFriends, 
  removeFriend, 
  getSentRequests, 
  getReceivedRequests, 
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  updateFriendStatus
} from '../utils/friends';

interface Message {
  id: string;
  sender: 'user' | 'stranger' | 'system';
  text: string;
  timestamp: Date;
  isLocal?: boolean;
}

const TextChatApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [strangerName, setStrangerName] = useState('Anonymous');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState<string>('both');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [interestsVisible, setInterestsVisible] = useState(false);
  const [recentChats, setRecentChats] = useState<ChatHistoryEntry[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'friends'>('chat');
  const [pendingFriendRequest, setPendingFriendRequest] = useState<{
    id: string;
    username: string;
    timestamp: Date;
  } | null>(null);
  // Add a flag to track if this is a new chat connection
  const [isNewChat, setIsNewChat] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const tunisianNames = [
    'Ahmed', 'Mohamed', 'Youssef', 'Ali', 'Amine', 
    'Fatima', 'Mariem', 'Yasmine', 'Leila', 'Nour'
  ];
  
  // Interests available to select
  const interestOptions = [
    'Music', 'Movies', 'Gaming', 'Sports', 'Travel',
    'Art', 'Books', 'Technology', 'Cooking', 'Tunisia'
  ];

  // Initialize socket connection
  useEffect(() => {
    // Create a temporary user ID if we don't have one
    const tempUserId = localStorage.getItem('tempUserId') || uuidv4();
    const tempUserName = localStorage.getItem('tempUserName') || 'User_' + tempUserId.substring(0, 5);
    
    if (!localStorage.getItem('tempUserId')) {
      localStorage.setItem('tempUserId', tempUserId);
      localStorage.setItem('tempUserName', tempUserName);
    }
    
    setUserId(tempUserId);
    setUserName(tempUserName);

    // Create socket connection
    const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:4000' 
      : `http://${window.location.hostname}:4000`;
      
    console.log('Connecting to server at:', serverUrl);
    
    const newSocket = io(serverUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });
    
    // Socket connection events
    newSocket.on('connect', () => {
      console.log('Socket connected with ID:', newSocket.id);
      setIsSocketConnected(true);
      addSystemMessage('Connected to server. Authenticating...');
      
      // Generate a mock token for demonstration
      // In a real app, you would get this from authentication
      const mockToken = `mock_token_${tempUserId}`;
      
      // Try authentication after a short delay to ensure connection is stable
      setTimeout(() => {
        // Authenticate with the server
        console.log('Sending authentication with token:', mockToken);
        newSocket.emit('authenticate', mockToken);
      }, 500);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      addSystemMessage(`Connection error: ${error.message}. Please refresh the page.`);
      setIsSocketConnected(false);
      setIsAuthenticated(false);
    });
    
    newSocket.on('authenticated', (data) => {
      console.log('Authenticated with server', data);
      setIsAuthenticated(true);
      setUserId(data.userId);
      setUserName(data.username);
      addSystemMessage('Connected to server. Click "New Chat" to start a conversation.');
    });
    
    newSocket.on('auth_error', (error) => {
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
      
      // Try as anonymous user
      console.log('Attempting anonymous authentication');
      addSystemMessage('Attempting to connect anonymously...');
      
      // Just start searching, the server will auto-authenticate
      setTimeout(() => {
        newSocket.emit('search_chat');
      }, 1000);
    });
    
    newSocket.on('searching', () => {
      console.log('Searching for chat partner');
      setIsSearching(true);
      addSystemMessage('Looking for someone to chat with...');
    });
    
    newSocket.on('chat_connected', (data) => {
      console.log('Chat connected:', data);
      
      // Clear previous conversation messages completely
      setMessages([]);
      
      setIsSearching(false);
      setIsConnected(true);
      setPartnerId(data.partnerId);
      setStrangerName(data.username || 'Anonymous');
      // Set this as a new chat connection
      setIsNewChat(true);
      
      // Add a clean connection message
      const connectionMessage: Message = {
        id: uuidv4(),
        sender: 'system',
        text: `Connected with ${data.username || 'Anonymous'}! Say hello!`,
        timestamp: new Date()
      };
      
      setMessages([connectionMessage]);
      
      // Focus on the input field
      inputRef.current?.focus();
    });
    
    newSocket.on('receive_message', (messageData) => {
      console.log('Received message:', messageData);
      setIsTyping(false);
      
      // Add the message to state
      const newMessage: Message = {
        id: messageData.id,
        sender: 'stranger',
        text: messageData.content,
        timestamp: new Date(messageData.timestamp),
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Save message to IndexedDB
      if (userId && partnerId) {
        saveMessage({
          id: messageData.id,
          content: messageData.content,
          senderId: partnerId,
          receiverId: userId,
          timestamp: new Date(messageData.timestamp)
        });
      }
    });
    
    newSocket.on('partner_typing', (isTyping) => {
      setIsTyping(isTyping);
    });
    
    newSocket.on('partner_left', () => {
      setIsConnected(false);
      setPartnerId(null);
      addSystemMessage('Your chat partner has disconnected.');
    });
    
    newSocket.on('chat_ended', () => {
      setIsConnected(false);
      setPartnerId(null);
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      addSystemMessage(`Error: ${error}`);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      addSystemMessage('Disconnected from server. Attempting to reconnect...');
      setIsSocketConnected(false);
      setIsAuthenticated(false);
    });
    
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to server after', attemptNumber, 'attempts');
      setIsSocketConnected(true);
      addSystemMessage('Reconnected to server. Authenticating...');
      
      // Re-authenticate on reconnect
      const mockToken = `mock_token_${tempUserId}`;
      newSocket.emit('authenticate', mockToken);
    });
    
    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      addSystemMessage('Failed to reconnect. Please refresh the page.');
    });
    
    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed after multiple attempts');
      addSystemMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    });
    
    setSocket(newSocket);
    
    // Cleanup on component unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Load conversation history from IndexedDB when partner changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!userId || !partnerId) return;
      
      try {
        // Only load history if we're chatting with a friend AND it's not a new random chat
        const isFriend = friends.some(friend => friend.id === partnerId);
        
        if (isFriend && !isNewChat) {
          const history = await getConversationMessages(userId, partnerId);
          
          const formattedMessages: Message[] = history.map(msg => ({
            id: msg.id,
            sender: msg.senderId === userId ? 'user' : 'stranger',
            text: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          
          setMessages(prev => [
            ...prev.filter(m => m.sender === 'system'),
            ...formattedMessages
          ]);
        } else {
          // Mark that we've handled the new chat state
          setIsNewChat(false);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    
    if (partnerId) {
      loadMessages();
    }
  }, [partnerId, userId, friends, isNewChat]);

  // Load recent chat history
  useEffect(() => {
    if (userId) {
      const loadRecentChats = async () => {
        const history = await getRecentChatPartners(userId);
        setRecentChats(history);
      };
      
      loadRecentChats();
      
      // Refresh chat history every minute
      const intervalId = setInterval(loadRecentChats, 60000);
      return () => clearInterval(intervalId);
    }
  }, [userId]);
  
  // Save partner info when connected
  useEffect(() => {
    if (partnerId && strangerName && strangerName !== 'Anonymous') {
      savePartnerInfo(partnerId, strangerName);
    }
  }, [partnerId, strangerName]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Add a system message
  const addSystemMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: uuidv4(),
        sender: 'system',
        text,
        timestamp: new Date()
      }
    ]);
  };

  const startNewChat = () => {
    if (!socket || !isSocketConnected) {
      addSystemMessage('Not connected to server. Please wait or refresh the page.');
      return;
    }
    
    // Leave current chat if any
    if (isConnected && partnerId) {
      socket.emit('leave_chat');
    }
    
    // Completely clear all messages, including system messages
    setMessages([]);
    
    // Add a single welcome message
    const welcomeMessage: Message = {
      id: uuidv4(),
      sender: 'system',
      text: 'Welcome to the chat! Click "New Chat" to start a conversation.',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setIsConnected(false);
    setIsSearching(false);
    setPartnerId(null);
    setStrangerName('Anonymous');
    setIsTyping(false);
    
    // Reset the pending friend request if there is any
    setPendingFriendRequest(null);
    
    // Start searching for a new chat partner
    console.log('Sending search_chat event to server');
    socket.emit('search_chat');
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    // Send typing indicator
    if (socket && isConnected) {
      socket.emit('typing', true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', false);
      }, 2000);
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '' || !isConnected || !socket || !partnerId || !userId) return;
    
    // Create message object
    const messageId = uuidv4();
    const newMessage: Message = {
      id: messageId,
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date(),
      isLocal: true
    };
    
    // Add to UI immediately
    setMessages(prev => [...prev, newMessage]);
    
    console.log('Sending message to server:', inputValue.trim());
    // Send to socket server
    socket.emit('send_message', inputValue.trim());
    
    // Save message to IndexedDB
    saveMessage({
      id: messageId,
      content: inputValue.trim(),
      senderId: userId,
      receiverId: partnerId,
      timestamp: new Date()
    });
    
    // Clear input
    setInputValue('');
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing', false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };
  
  const reportUser = () => {
    if (!socket || !partnerId) return;
    
    console.log('Reporting user:', partnerId);
    socket.emit('report_user', {
      userId: partnerId,
      reason: 'Inappropriate behavior'
    });
    
    addSystemMessage('User has been reported. A moderator will review this chat.');
  };

  const retryConnection = () => {
    if (socket) {
      // Disconnect and reconnect
      socket.disconnect();
      socket.connect();
      addSystemMessage('Retrying connection...');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleInterestsSection = () => {
    setInterestsVisible(!interestsVisible);
  };

  // Add effect to track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      
      // Auto-show filters on larger screens
      if (newWidth > 1024) {
        setFiltersVisible(true);
      } else {
        setFiltersVisible(false);
      }
      
      // Auto-show interests on larger screens
      if (newWidth > 768) {
        setInterestsVisible(true);
      } else {
        setInterestsVisible(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on initial load
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Add effect to add viewport meta tag for mobile devices
  useEffect(() => {
    // Add viewport meta tag if it doesn't exist
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }, []);

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const openSavedChat = (chat: ChatHistoryEntry) => {
    // For now, we'll just start a new chat
    // In a real implementation, you would connect directly to this user
    startNewChat();
    
    // Let the user know this functionality is not fully implemented
    addSystemMessage(`Starting a new chat. In a full implementation, you would reconnect with ${chat.username}.`);
  };
  
  // Format timestamp for chat history display
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                   date.getMonth() === now.getMonth() && 
                   date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Load friends and requests
  useEffect(() => {
    if (userId) {
      const loadFriendsData = () => {
        console.log('Loading friends data for user:', userId);
        
        // Use the utility functions directly to get the latest data
        const userFriends = getFriends(userId);
        const userSentRequests = getSentRequests(userId);
        const userReceivedRequests = getReceivedRequests(userId);
        
        console.log('Friends loaded:', userFriends.length, 'Sent requests:', userSentRequests.length, 'Received requests:', userReceivedRequests.length);
        
        setFriends(userFriends);
        setSentRequests(userSentRequests);
        setReceivedRequests(userReceivedRequests);
      };
      
      loadFriendsData();
      
      // Refresh friends data every 15 seconds (more frequent updates)
      const intervalId = setInterval(loadFriendsData, 15000);
      return () => clearInterval(intervalId);
    }
  }, [userId]); // Only re-run when userId changes, not on every render

  // Track online friends via socket events
  useEffect(() => {
    if (socket && userId) {
      // Listen for online status updates
      socket.on('friend_online_status', (data) => {
        if (!data || !data.userId) return;
        
        console.log('Received friend online status update:', data);
        
        // Update friend's online status
        const updatedFriends = getFriends(userId).map(friend => {
          if (friend.id === data.userId) {
            return {
              ...friend,
              isOnline: data.isOnline,
              lastSeen: data.isOnline ? new Date() : new Date()
            };
          }
          return friend;
        });
        
        // Update in localStorage directly instead of causing a state update loop
        localStorage.setItem(`tn4_friends_${userId}`, JSON.stringify(updatedFriends));
        
        // Update state
        setFriends(updatedFriends);
      });
      
      // Also listen for batch status updates
      socket.on('friends_status_update', (data: { statuses: { userId: string, isOnline: boolean }[] }) => {
        if (!data || !data.statuses || !data.statuses.length) return;
        
        console.log('Received batch friend status update:', data);
        
        // Get current friends
        const currentFriends = getFriends(userId);
        
        // Update all friends with their new status
        const updatedFriends = currentFriends.map(friend => {
          const statusUpdate = data.statuses.find(status => status.userId === friend.id);
          if (statusUpdate) {
            return {
              ...friend,
              isOnline: statusUpdate.isOnline,
              lastSeen: statusUpdate.isOnline ? new Date() : new Date()
            };
          }
          return friend;
        });
        
        // Update in localStorage and state
        localStorage.setItem(`tn4_friends_${userId}`, JSON.stringify(updatedFriends));
        setFriends(updatedFriends);
      });
      
      // Emit our online status for our friends to see
      socket.emit('update_online_status', { isOnline: true });
      
      return () => {
        socket.off('friend_online_status');
        socket.off('friends_status_update');
        // Signal we're going offline when component unmounts
        socket.emit('update_online_status', { isOnline: false });
      };
    }
  }, [socket, userId]); // Only depend on socket and userId
  
  // Add friend functions
  const handleAddCurrentPartner = () => {
    if (!userId || !userName || !partnerId || !strangerName || !isConnected) {
      // Only allow adding friends when connected to a chat partner
      addSystemMessage("You need to be connected to a chat partner to add them as a friend.");
      return;
    }
    
    // Check if already friends or request already sent
    const existingFriend = friends.find(f => f.id === partnerId);
    const existingSentRequest = sentRequests.find(r => r.id === partnerId);
    
    if (existingFriend) {
      addSystemMessage(`${strangerName} is already in your friends list.`);
      return;
    }
    
    if (existingSentRequest) {
      addSystemMessage(`You already sent a friend request to ${strangerName}.`);
      return;
    }
    
    // Emit friend request event to the partner through socket
    if (socket) {
      socket.emit('friend_request', {
        toUserId: partnerId,
        fromUserId: userId,
        fromUsername: userName
      });
      
      // Show confirmation message
      addSystemMessage(`Friend request sent to ${strangerName}. Waiting for response...`);
    }
  };
  
  // Add socket event listeners for friend requests
  useEffect(() => {
    if (!socket || !userId) return;
    
    // Listen for incoming friend requests
    socket.on('friend_request_received', (data) => {
      console.log('Friend request received:', data);
      // Set the pending friend request to show the notification
      setPendingFriendRequest({
        id: data.fromUserId,
        username: data.fromUsername,
        timestamp: new Date()
      });
    });
    
    // Listen for friend request accepted
    socket.on('friend_request_accepted', (data) => {
      console.log('Friend request accepted:', data);
      
      // Add friend locally using the imported function
      // Use our component's function to ensure proper state update
      addFriend(userId, {
        id: data.userId,
        username: data.username,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.userId}`,
        lastSeen: new Date(),
        isOnline: true
      });
      
      // Show message
      addSystemMessage(`${data.username} accepted your friend request!`);
    });
    
    // Listen for friend request rejected
    socket.on('friend_request_rejected', (data) => {
      console.log('Friend request rejected:', data);
      // Show message
      addSystemMessage(`${data.username} declined your friend request.`);
    });
    
    return () => {
      socket.off('friend_request_received');
      socket.off('friend_request_accepted');
      socket.off('friend_request_rejected');
    };
  }, [socket, userId]); // Only depend on socket and userId
  
  // Handle accepting a friend request
  const handleAcceptFriendRequestInChat = () => {
    if (!socket || !userId || !userName || !pendingFriendRequest) return;
    
    console.log('Accepting friend request from:', pendingFriendRequest);
    
    // Emit friend request accepted event
    socket.emit('friend_request_response', {
      toUserId: pendingFriendRequest.id,
      fromUserId: userId,
      fromUsername: userName,
      response: 'accepted'
    });
    
    // Add friend locally using our component function
    addFriend(userId, {
      id: pendingFriendRequest.id,
      username: pendingFriendRequest.username,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${pendingFriendRequest.id}`,
      lastSeen: new Date(),
      isOnline: true
    });
    
    // Show message
    addSystemMessage(`You are now friends with ${pendingFriendRequest.username}.`);
    
    // Clear pending request
    setPendingFriendRequest(null);
  };
  
  // Handle rejecting a friend request
  const handleRejectFriendRequestInChat = () => {
    if (!socket || !userId || !userName || !pendingFriendRequest) return;
    
    // Emit friend request rejected event
    socket.emit('friend_request_response', {
      toUserId: pendingFriendRequest.id,
      fromUserId: userId,
      fromUsername: userName,
      response: 'rejected'
    });
    
    // Show message
    addSystemMessage(`You declined ${pendingFriendRequest.username}'s friend request.`);
    
    // Clear pending request
    setPendingFriendRequest(null);
  };
  
  // Format timestamp for display
  const formatLastSeen = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  // Add the missing functions inside the component
  const addFriend = (userId: string, friend: Friend) => {
    if (!userId) return;
    
    // Use the imported function directly instead of requiring it
    // This was causing the "require is not defined" error
    const friendsToUpdate = getFriends(userId);
    const existingIndex = friendsToUpdate.findIndex(f => f.id === friend.id);
    
    if (existingIndex >= 0) {
      // Update existing friend
      friendsToUpdate[existingIndex] = {
        ...friend,
        lastSeen: new Date()
      };
    } else {
      // Add new friend
      friendsToUpdate.push({
        ...friend,
        lastSeen: new Date()
      });
    }
    
    // Use the same key format as in the friends.ts utility
    localStorage.setItem(`tn4_friends_${userId}`, JSON.stringify(friendsToUpdate));
    
    // Refresh the friends list
    setFriends(getFriends(userId));
    
    console.log('Friend added:', friend, 'Current friends:', getFriends(userId));
  };
  
  // Update the startChatWithFriend function to properly handle starting a chat with a friend
  const startChatWithFriend = (friend: Friend) => {
    // First, if we're in an active chat, leave it
    if (isConnected && partnerId && socket) {
      socket.emit('leave_chat');
    }
    
    // Reset the chat state
    setIsConnected(true);
    setIsSearching(false);
    setPartnerId(friend.id);
    setStrangerName(friend.username);
    
    // Clear previous messages
    setMessages([]);
    
    // Add system message about starting chat with friend
    const connectionMessage: Message = {
      id: uuidv4(),
      sender: 'system',
      text: `Starting chat with ${friend.username}. Loading your conversation history...`,
      timestamp: new Date()
    };
    
    setMessages([connectionMessage]);
    
    // Load conversation history between the user and this friend
    if (userId) {
      getConversationMessages(userId, friend.id)
        .then(history => {
          if (history.length === 0) {
            // No history, just add a welcome message
            addSystemMessage(`No previous messages with ${friend.username}. Say hello!`);
          } else {
            // Format the messages for display
            const formattedMessages: Message[] = history.map(msg => ({
              id: msg.id,
              sender: msg.senderId === userId ? 'user' : 'stranger',
              text: msg.content,
              timestamp: new Date(msg.timestamp),
            }));
            
            // Add the history messages, keeping system messages
            setMessages(prev => [
              ...prev.filter(m => m.sender === 'system'),
              ...formattedMessages
            ]);
            
            // Add a message indicating history was loaded
            addSystemMessage(`Loaded ${history.length} previous messages with ${friend.username}.`);
          }
        })
        .catch(error => {
          console.error('Error loading chat history with friend:', error);
          addSystemMessage('Failed to load chat history. Please try again.');
        });
    }
    
    // In a real app, we would emit an event to connect with this friend
    // For now, we'll just simulate a direct connection
    console.log(`Starting chat with friend: ${friend.username}`);
  };
  
  const handleAcceptFriendRequest = (requestId: string) => {
    if (!userId || !userName) return;
    
    // Find the request in the received requests
    const request = receivedRequests.find(r => r.id === requestId);
    if (!request) return;
    
    // Add as friend
    addFriend(userId, {
      id: request.id,
      username: request.username,
      avatar: request.avatar,
      lastSeen: new Date(),
      isOnline: true
    });
    
    // Remove from received requests
    const updatedRequests = receivedRequests.filter(r => r.id !== requestId);
    localStorage.setItem(`receivedRequests_${userId}`, JSON.stringify(updatedRequests));
    
    // Update state
    setReceivedRequests(updatedRequests);
    setFriends(getFriends(userId));
    
    // Show confirmation message
    addSystemMessage(`You are now friends with ${request.username}.`);
  };
  
  const handleRejectFriendRequest = (requestId: string) => {
    if (!userId) return;
    
    // Find the request in the received requests
    const request = receivedRequests.find(r => r.id === requestId);
    if (!request) return;
    
    // Remove from received requests
    const updatedRequests = receivedRequests.filter(r => r.id !== requestId);
    localStorage.setItem(`receivedRequests_${userId}`, JSON.stringify(updatedRequests));
    
    // Update state
    setReceivedRequests(updatedRequests);
    
    // Show confirmation message
    addSystemMessage(`You declined ${request.username}'s friend request.`);
  };

  // Add a useEffect to update friends' online status periodically
  useEffect(() => {
    if (!userId || !socket) return;
    
    // Check which friends are online by checking the socket connections
    const checkOnlineFriends = () => {
      const currentFriends = getFriends(userId);
      if (currentFriends.length === 0) return;
      
      // Emit a request to check which friends are online
      socket.emit('check_friends_status', {
        friendIds: currentFriends.map(f => f.id)
      });
    };
    
    // Check immediately when component mounts
    checkOnlineFriends();
    
    // Then check periodically every 30 seconds
    const intervalId = setInterval(checkOnlineFriends, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [userId, socket]); // Only depend on userId and socket

  return (
    <Container>
      <MobileBackdrop $isActive={sidebarOpen} onClick={() => setSidebarOpen(false)} />
      
      <Sidebar className={sidebarOpen ? 'active' : ''}>
        <SidebarHeader>
          <Logo>
            <LogoIcon src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ac.svg" alt="Chat" />
            <LogoText>Merhba<LogoDomain>.tn</LogoDomain></LogoText>
          </Logo>
        </SidebarHeader>
        
        <NavButtons>
          <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
            <NavIcon>💬</NavIcon>
            <span>Chat</span>
          </NavButton>
          <NavButton active={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>
            <NavIcon>👥</NavIcon>
            <span>Friends</span>
            {receivedRequests.length > 0 && (
              <RequestBadge>{receivedRequests.length}</RequestBadge>
            )}
          </NavButton>
        </NavButtons>
        
        {activeTab === 'chat' && (
          <DirectMessages>
            <SectionTitle>CHAT HISTORY</SectionTitle>
            {recentChats.length === 0 ? (
              <EmptyMessage>No recent chats</EmptyMessage>
            ) : (
              <ChatHistoryList>
                {recentChats.map(chat => (
                  <ChatHistoryItem key={chat.partnerId} onClick={() => openSavedChat(chat)}>
                    <ChatAvatar src={`https://api.dicebear.com/7.x/bottts/svg?seed=${chat.partnerId}`} alt="Avatar" />
                    <ChatInfo>
                      <ChatPartnerName>{chat.username}</ChatPartnerName>
                      <ChatLastMessage>{chat.lastMessage.length > 25 
                        ? `${chat.lastMessage.substring(0, 25)}...` 
                        : chat.lastMessage}
                      </ChatLastMessage>
                    </ChatInfo>
                    <ChatTime>{formatTimestamp(chat.timestamp)}</ChatTime>
                  </ChatHistoryItem>
                ))}
              </ChatHistoryList>
            )}
          </DirectMessages>
        )}
        
        {activeTab === 'friends' && (
          <FriendsSection>
            <SectionHeader>
              <SectionTitle>FRIENDS</SectionTitle>
              <AddButton onClick={() => setShowFriendRequests(!showFriendRequests)}>
                {showFriendRequests ? '▲' : '▼'}
              </AddButton>
            </SectionHeader>
            
            {friends.length === 0 ? (
              <EmptyMessage>No friends yet. Add some friends!</EmptyMessage>
            ) : (
              <FriendsList>
                {friends.map(friend => (
                  <FriendItem key={friend.id} onClick={() => startChatWithFriend(friend)}>
                    <FriendAvatarContainer>
                      <FriendAvatar src={friend.avatar} alt={friend.username} />
                      <OnlineIndicator $isOnline={friend.isOnline || false} $pulse={friend.isOnline || false} />
                    </FriendAvatarContainer>
                    <FriendInfo>
                      <FriendName>{friend.username}</FriendName>
                      <FriendStatus>
                        <StatusDot $isOnline={friend.isOnline || false} />
                        {friend.isOnline ? 'Online now' : `Last seen ${formatLastSeen(friend.lastSeen)}`}
                      </FriendStatus>
                    </FriendInfo>
                    <ChatIcon>💬</ChatIcon>
                  </FriendItem>
                ))}
              </FriendsList>
            )}
            
            {receivedRequests.length > 0 && (
              <>
                <RequestsHeader onClick={() => setShowFriendRequests(!showFriendRequests)}>
                  <RequestsTitle>FRIEND REQUESTS ({receivedRequests.length})</RequestsTitle>
                  <RequestsToggle>{showFriendRequests ? '▲' : '▼'}</RequestsToggle>
                </RequestsHeader>
                
                {showFriendRequests && (
                  <RequestsList>
                    {receivedRequests.map(request => (
                      <RequestItem key={request.id}>
                        <RequestAvatar src={request.avatar} alt={request.username} />
                        <RequestInfo>
                          <RequestName>{request.username}</RequestName>
                          <RequestTime>
                            {formatTimestamp(request.timestamp)}
                          </RequestTime>
                        </RequestInfo>
                        <RequestActions>
                          <AcceptButton onClick={() => handleAcceptFriendRequest(request.id)}>
                            ✓
                          </AcceptButton>
                          <RejectButton onClick={() => handleRejectFriendRequest(request.id)}>
                            ✕
                          </RejectButton>
                        </RequestActions>
                      </RequestItem>
                    ))}
                  </RequestsList>
                )}
              </>
            )}
            
            {sentRequests.length > 0 && (
              <>
                <SectionTitle>SENT REQUESTS</SectionTitle>
                <RequestsList>
                  {sentRequests.map(request => (
                    <RequestItem key={request.id}>
                      <RequestAvatar src={request.avatar} alt={request.username} />
                      <RequestInfo>
                        <RequestName>{request.username}</RequestName>
                        <RequestStatus>{request.status === 'pending' ? 'Pending' : request.status}</RequestStatus>
                      </RequestInfo>
                    </RequestItem>
                  ))}
                </RequestsList>
              </>
            )}
          </FriendsSection>
        )}
        
        <PremiumBanner>
          <CrownIcon src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f451.svg" alt="Premium" />
          <PremiumText>
            Unlock chat filters, send images and videos and more!
          </PremiumText>
          <PremiumButton>Get Premium</PremiumButton>
        </PremiumBanner>
      </Sidebar>
      
      <MainContent>
        <ChatHeader>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MenuToggle onClick={toggleSidebar}>☰</MenuToggle>
            <NewChatButton onClick={startNewChat}>
              <PlusIcon>+</PlusIcon>
              <span>New Chat</span>
              {!isSocketConnected && <ConnectionStatus>⚠️ Offline</ConnectionStatus>}
            </NewChatButton>
            {!isSocketConnected && (
              <RetryButton onClick={retryConnection}>
                Retry
              </RetryButton>
            )}
            <AddFriendButton 
              onClick={handleAddCurrentPartner} 
              disabled={!isConnected}
              $isActive={isConnected}
            >
              <AddFriendIcon>👥+</AddFriendIcon>
              <span>Add Friend</span>
            </AddFriendButton>
          </div>
          
          <UserControls>
            <UserName>{userName || 'Anonymous'}</UserName>
            <IconButton>👤</IconButton>
            <IconButton onClick={() => setActiveTab('friends')}>
              👥
              {receivedRequests.length > 0 && <NotificationBadge>{receivedRequests.length}</NotificationBadge>}
            </IconButton>
            <IconButton>💬</IconButton>
          </UserControls>
        </ChatHeader>
        
        <ChatInterface>
          <ChatArea>
            <MessageList>
              <AnimatePresence>
                {messages.map(message => (
                  <MessageItem
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    $isSender={message.sender === 'user'}
                    $isSystem={message.sender === 'system'}
                  >
                    {message.sender === 'stranger' && (
                      <Avatar src={`https://api.dicebear.com/7.x/bottts/svg?seed=${strangerName}`} alt="Avatar" />
                    )}
                    
                    {message.sender === 'system' ? (
                      <SystemMessageContent>
                        <SystemMessageText>{message.text}</SystemMessageText>
                        <SystemMessageTime>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </SystemMessageTime>
                      </SystemMessageContent>
                    ) : (
                      <MessageContent $isSender={message.sender === 'user'}>
                        <MessageSender $isSender={message.sender === 'user'}>
                          {message.sender === 'user' ? (userName || 'You') : strangerName}
                        </MessageSender>
                        <MessageText>{message.text}</MessageText>
                        <MessageTime>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </MessageTime>
                      </MessageContent>
                    )}
                    
                    {message.sender === 'user' && (
                      <Avatar src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`} alt="Avatar" />
                    )}
                  </MessageItem>
                ))}
              </AnimatePresence>
              
              {/* Friend Request Notification */}
              {pendingFriendRequest && (
                <FriendRequestNotification
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <FriendRequestIcon>👥</FriendRequestIcon>
                  <FriendRequestContent>
                    <FriendRequestTitle>Friend Request</FriendRequestTitle>
                    <FriendRequestMessage>
                      <strong>{pendingFriendRequest.username}</strong> wants to add you as a friend
                    </FriendRequestMessage>
                    <FriendRequestTime>
                      {pendingFriendRequest.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </FriendRequestTime>
                  </FriendRequestContent>
                  <FriendRequestActions>
                    <FriendRequestAccept onClick={handleAcceptFriendRequestInChat}>
                      Accept
                    </FriendRequestAccept>
                    <FriendRequestDecline onClick={handleRejectFriendRequestInChat}>
                      Decline
                    </FriendRequestDecline>
                  </FriendRequestActions>
                </FriendRequestNotification>
              )}
              
              {isTyping && (
                <TypingIndicator
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TypingDot delay={0} />
                  <TypingDot delay={0.2} />
                  <TypingDot delay={0.4} />
                  <TypingText>{strangerName} is typing...</TypingText>
                </TypingIndicator>
              )}
              
              <div ref={messagesEndRef} />
            </MessageList>
            
            <ChatInputArea>
              <ChatInput 
                ref={inputRef}
                value={inputValue} 
                onChange={handleInputChange} 
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Type a message..." : "Click 'New Chat' to start"} 
                disabled={!isConnected}
              />
              <SendButton onClick={handleSendMessage} disabled={!isConnected || inputValue.trim() === ''}>
                <SendIcon>➤</SendIcon>
              </SendButton>
            </ChatInputArea>
            
            <ChatActions>
              {isConnected && (
                <>
                  <ActionButton onClick={() => startNewChat()}>Next Chat</ActionButton>
                  <ActionButton onClick={reportUser}>Report User</ActionButton>
                </>
              )}
            </ChatActions>
            
            <RulesNotice>
              Be respectful and follow our <RulesLink>chat rules</RulesLink>
            </RulesNotice>
            
            <MobileOnly>
              <MobileButtons>
                <MobileButton onClick={toggleFilters}>
                  <ButtonIcon>⚙️</ButtonIcon>
                  <ButtonText>Filters</ButtonText>
                </MobileButton>
                <MobileButton onClick={toggleInterestsSection}>
                  <ButtonIcon>🔖</ButtonIcon>
                  <ButtonText>Interests</ButtonText>
                </MobileButton>
                <MobileButton onClick={startNewChat}>
                  <ButtonIcon>🔄</ButtonIcon>
                  <ButtonText>New Chat</ButtonText>
                </MobileButton>
              </MobileButtons>
            </MobileOnly>
          </ChatArea>
          
          {(filtersVisible || windowWidth > 1024) && (
            <FilterPanel>
              <FilterSection>
                <FilterTitleRow onClick={toggleInterestsSection}>
                  <FilterTitle>Your Interests <OnStatus>(ON)</OnStatus></FilterTitle>
                  <InterestToggleIcon>{interestsVisible ? '▲' : '▼'}</InterestToggleIcon>
                </FilterTitleRow>
                
                {interestsVisible && (
                  <>
                    <InterestTags>
                      {selectedInterests.length === 0 ? (
                        <NoInterests>You have no interests. Click to add some.</NoInterests>
                      ) : (
                        selectedInterests.map(interest => (
                          <InterestTag key={interest} onClick={() => toggleInterest(interest)}>
                            {interest}
                            <RemoveIcon>×</RemoveIcon>
                          </InterestTag>
                        ))
                      )}
                    </InterestTags>
                    
                    <InterestSelector>
                      {interestOptions.filter(i => !selectedInterests.includes(i)).map(interest => (
                        <InterestOption key={interest} onClick={() => toggleInterest(interest)}>
                          {interest}
                        </InterestOption>
                      ))}
                    </InterestSelector>
                  </>
                )}
              </FilterSection>
              
              <FilterSection>
                <FilterTitle>Gender Filter:</FilterTitle>
                <GenderOptions>
                  <GenderOption 
                    $isSelected={genderFilter === 'male'}
                    onClick={() => setGenderFilter('male')}
                  >
                    <GenderIcon>♂️</GenderIcon>
                    <span>Male</span>
                    {genderFilter === 'male' && <CheckIcon>✓</CheckIcon>}
                  </GenderOption>
                  
                  <GenderOption 
                    $isSelected={genderFilter === 'both'}
                    onClick={() => setGenderFilter('both')}
                  >
                    <GenderIcon>⚥</GenderIcon>
                    <span>Both</span>
                    {genderFilter === 'both' && <CheckIcon>✓</CheckIcon>}
                  </GenderOption>
                  
                  <GenderOption 
                    $isSelected={genderFilter === 'female'}
                    onClick={() => setGenderFilter('female')}
                  >
                    <GenderIcon>♀️</GenderIcon>
                    <span>Female</span>
                    {genderFilter === 'female' && <CheckIcon>✓</CheckIcon>}
                  </GenderOption>
                </GenderOptions>
              </FilterSection>
              
              <StartChatButtons>
                <VideoButton>
                  <VideoIcon>🎥</VideoIcon>
                </VideoButton>
                <TextChatButton onClick={startNewChat}>
                  <ChatIcon>💬</ChatIcon>
                  Start Text Chat
                </TextChatButton>
              </StartChatButtons>
            </FilterPanel>
          )}
        </ChatInterface>
      </MainContent>
    </Container>
  );
};

// New components
const RetryButton = styled.button`
  background-color: transparent;
  color: #E70013;
  border: 1px solid #E70013;
  border-radius: 4px;
  padding: 5px 10px;
  margin-left: 10px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(231, 0, 19, 0.1);
  }
  
  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 0.75rem;
  }
`;

const UserName = styled.span`
  font-size: 0.9rem;
  margin-right: 10px;
  font-weight: 500;
`;

// Connection status component
const ConnectionStatus = styled.span`
  margin-left: 10px;
  font-size: 0.8rem;
  color: #E70013;
`;

// Add ChatActions component
const ChatActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  padding: 0 10px;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: #f3f4f6;
  color: #4b5563;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e5e7eb;
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 0.9rem;
    border-radius: 8px; /* Slightly larger for touch */
    min-height: 44px; /* Apple's recommended minimum touch target size */
  }
`;

// Styled Components
const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #1E1E2D;
  color: white;
  font-family: 'Poppins', sans-serif;
  overflow: hidden;
  position: relative;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div`
  width: 260px;
  background-color: #191927;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2A2A3A;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    position: fixed;
    height: 100%;
    z-index: 20;
    transform: translateX(-100%);
    width: 80%;
    max-width: 300px;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
    
    &.active {
      transform: translateX(0);
    }
  }
`;

const SidebarHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #2A2A3A;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoIcon = styled.img`
  width: 24px;
  height: 24px;
`;

const LogoText = styled.h1`
  font-size: 1.2rem;
  margin: 0;
  background: linear-gradient(90deg, #E70013 0%, #FFFFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
`;

const LogoDomain = styled.span`
  color: #E70013;
  -webkit-text-fill-color: #E70013;
`;

const NavButtons = styled.div`
  display: flex;
  padding: 8px;
  border-bottom: 1px solid #2A2A3A;
`;

const NavButton = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.active ? '#2F2F40' : 'transparent'};
  margin-right: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #2F2F40;
  }
`;

const NavIcon = styled.span`
  font-size: 16px;
`;

const DirectMessages = styled.div`
  padding: 16px 0;
  flex: 1;
  overflow-y: auto;
`;

const SectionTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: #9999AA;
  margin-bottom: 8px;
  padding: 0 16px;
`;

const EmptyMessage = styled.div`
  font-size: 0.8rem;
  color: #6F6F7F;
  padding: 0 16px;
  margin-top: 8px;
`;

const PremiumBanner = styled.div`
  margin: 16px;
  padding: 12px;
  background-color: #2A2A3A;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const CrownIcon = styled.img`
  width: 24px;
  height: 24px;
  margin-bottom: 8px;
`;

const PremiumText = styled.p`
  font-size: 0.8rem;
  margin: 8px 0;
  color: #CCCCDD;
`;

const PremiumButton = styled.button`
  background-color: #E70013;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #D10012;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; // Prevent flex items from overflowing
  
  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
  }
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #2A2A3A;
  
  @media (max-width: 768px) {
    padding: 8px 12px;
  }
`;

const NewChatButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: transparent;
  color: white;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #E70013;
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const PlusIcon = styled.span`
  font-size: 1.2rem;
  font-weight: 400;
`;

const UserControls = styled.div`
  display: flex;
  gap: 16px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
  
  @media (max-width: 480px) {
    & > :nth-child(2) {
      display: none; /* Hide less important icons on very small screens */
    }
  }
`;

const IconButton = styled.button`
  background-color: transparent;
  border: none;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.2s;
  
  &:hover {
    background-color: #2A2A3A;
  }
  
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const ChatInterface = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  
  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-width: 0; // Prevent flex items from overflowing
  
  @media (max-width: 768px) {
    padding: 8px;
    height: 100%;
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  @media (max-width: 768px) {
    padding: 8px;
    gap: 12px;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  }
`;

const MessageItem = styled(motion.div)<{ $isSender: boolean; $isSystem?: boolean }>`
  display: flex;
  flex-direction: ${props => props.$isSender ? 'row-reverse' : 'row'};
  align-items: flex-start;
  gap: 12px;
  max-width: 80%;
  align-self: ${props => props.$isSender ? 'flex-end' : props.$isSystem ? 'center' : 'flex-start'};
  
  @media (max-width: 768px) {
    max-width: 90%;
    gap: 8px;
  }
  
  @media (max-width: 480px) {
    max-width: 95%;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #2A2A3A;
  
  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
  }
`;

const MessageContent = styled.div<{ $isSender: boolean }>`
  background-color: ${props => props.$isSender ? '#E70013' : '#2F2F40'};
  padding: 12px;
  border-radius: 12px;
  border-top-left-radius: ${props => props.$isSender ? '12px' : '0'};
  border-top-right-radius: ${props => props.$isSender ? '0' : '12px'};
  max-width: 100%;
  word-break: break-word;
`;

const MessageSender = styled.div<{ $isSender: boolean }>`
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: ${props => props.$isSender ? 'rgba(255, 255, 255, 0.9)' : '#E70013'};
`;

const MessageText = styled.div`
  font-size: 0.9rem;
  line-height: 1.4;
  word-break: break-word;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  text-align: right;
`;

const TypingIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  max-width: 120px;
  border-radius: 16px;
  background-color: #2A2A3A;
  margin-top: 8px;
`;

const TypingDot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  background-color: #E70013;
  border-radius: 50%;
  margin-right: 4px;
  animation: typing 1s infinite;
  animation-delay: ${props => props.delay}s;
  
  @keyframes typing {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
`;

const TypingText = styled.div`
  font-size: 0.8rem;
  color: #CCCCDD;
  margin-left: 4px;
`;

const ChatInputArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #2A2A3A;
  border-radius: 8px;
  
  @media (max-width: 768px) {
    padding: 12px;
    gap: 8px;
  }
`;

const ChatInput = styled.input`
  flex: 1;
  background-color: #1E1E2D;
  border: none;
  border-radius: 4px;
  padding: 12px 16px;
  color: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(231, 0, 19, 0.3);
  }
  
  &::placeholder {
    color: #6F6F7F;
  }
  
  &:disabled {
    background-color: #222233;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 16px; /* Prevents zoom on focus in iOS */
    -webkit-appearance: none; /* Remove default iOS styling */
    border-radius: 8px; /* Slightly larger for touch */
  }
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  background-color: ${props => props.disabled ? '#333344' : '#E70013'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.disabled ? '#333344' : '#D10012'};
  }
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const SendIcon = styled.span`
  font-size: 0.8rem;
`;

const RulesNotice = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: #9999AA;
  margin-top: 8px;
`;

const RulesLink = styled.a`
  color: #E70013;
  text-decoration: none;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const FilterPanel = styled.div`
  width: 300px;
  background-color: #1A1A28;
  border-left: 1px solid #2A2A3A;
  padding: 16px;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 1024px) {
    width: 100%;
    border-left: none;
    border-top: 1px solid #2A2A3A;
    padding: 12px;
    max-height: 40%;
    overflow-y: auto;
  }
  
  @media (max-width: 768px) {
    max-height: 50%;
    padding: 10px;
    border-top: 1px solid #2A2A3A;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  }
`;

const FilterSection = styled.div`
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
`;

const FilterTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 2px 0;
  
  @media (max-width: 768px) {
    background-color: #2A2A3A;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 8px;
  }
`;

const FilterTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
`;

const OnStatus = styled.span`
  font-size: 0.7rem;
  color: #4CAF50;
  margin-left: 8px;
  font-weight: normal;
`;

const InterestTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  min-height: 50px;
  background-color: #212132;
  border-radius: 4px;
  padding: 12px;
  
  @media (max-width: 768px) {
    padding: 8px;
    min-height: 40px;
  }
`;

const NoInterests = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6F6F7F;
  font-size: 0.8rem;
  font-style: italic;
`;

const InterestTag = styled.div`
  background-color: #E70013;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #D10012;
  }
`;

const RemoveIcon = styled.span`
  font-size: 1.1rem;
  font-weight: bold;
`;

const InterestSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const InterestOption = styled.div`
  background-color: #2A2A3A;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #333344;
  }
`;

const GenderOptions = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 6px;
  }
`;

const GenderOption = styled.div<{ $isSelected: boolean }>`
  flex: 1;
  background-color: ${props => props.$isSelected ? '#E70013' : '#2A2A3A'};
  border-radius: 4px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    background-color: ${props => props.$isSelected ? '#D10012' : '#333344'};
  }
  
  @media (max-width: 768px) {
    padding: 10px 6px;
  }
  
  @media (max-width: 480px) {
    flex-direction: row;
    justify-content: space-between;
    padding: 8px 12px;
  }
`;

const GenderIcon = styled.div`
  font-size: 1.2rem;
`;

const CheckIcon = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.8rem;
  color: white;
`;

const StartChatButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
  
  @media (max-width: 768px) {
    margin-top: 12px;
  }
`;

const VideoButton = styled.button`
  background-color: #2A2A3A;
  border: none;
  border-radius: 4px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #333344;
  }
`;

const VideoIcon = styled.span`
  font-size: 1.2rem;
`;

const TextChatButton = styled.button`
  flex: 1;
  background-color: #4F46E5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #4338CA;
  }
`;

const ChatIcon = styled.span`
  font-size: 1.2rem;
`;

// Add responsive menu toggle button
const MenuToggle = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  margin-right: 10px;
  
  @media (max-width: 768px) {
    display: block;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

// Add a backdrop for mobile sidebar
const MobileBackdrop = styled.div<{ $isActive: boolean }>`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.$isActive ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 15;
    backdrop-filter: blur(2px);
  }
`;

// Add media query utility for responsive elements
const MobileOnly = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const DesktopOnly = styled.div`
  display: block;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

// Add mobile-specific buttons
const MobileButtons = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-around;
    background-color: #191927;
    padding: 8px 4px;
    border-radius: 12px;
    margin-top: 12px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  }
`;

const MobileButton = styled.button`
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  
  &:hover, &:active {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ButtonIcon = styled.div`
  font-size: 1.2rem;
  margin-bottom: 4px;
`;

const ButtonText = styled.div`
  font-size: 0.7rem;
  color: #CCCCDD;
`;

// Add back the missing InterestToggleIcon component
const InterestToggleIcon = styled.span`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    font-size: 0.8rem;
  }
`;

// Add these new styled components for chat history
const ChatHistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  overflow-y: auto;
`;

const ChatHistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2A2A3A;
  }
`;

const ChatAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #2A2A3A;
  flex-shrink: 0;
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0; // Prevent text overflow
`;

const ChatPartnerName = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 2px;
`;

const ChatLastMessage = styled.div`
  font-size: 0.75rem;
  color: #9999AA;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatTime = styled.div`
  font-size: 0.7rem;
  color: #6F6F7F;
  flex-shrink: 0;
`;

// Add Friend Button
const AddFriendButton = styled.button<{ disabled?: boolean, $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: ${props => props.$isActive ? '#4F46E5' : '#2A2A3A'};
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  color: white;
  font-size: 0.9rem;
  margin-left: 10px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.disabled ? '#2A2A3A' : props.$isActive ? '#4338CA' : '#3A3A4A'};
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    
    span {
      display: none;
    }
  }
`;

const AddFriendIcon = styled.span`
  font-size: 1rem;
`;

// Notification Badge
const NotificationBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #E70013;
  color: white;
  font-size: 0.7rem;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RequestBadge = styled.div`
  background-color: #E70013;
  color: white;
  font-size: 0.7rem;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  margin-left: 5px;
`;

// Friends section components
const FriendsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 0 10px 0;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
`;

const AddButton = styled.button`
  background-color: transparent;
  border: none;
  color: #9999AA;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  
  &:hover {
    color: white;
  }
`;

const FriendsList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2A2A3A;
  }
`;

const FriendAvatarContainer = styled.div`
  position: relative;
  margin-right: 10px;
`;

const FriendAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #2A2A3A;
`;

const FriendInfo = styled.div`
  flex: 1;
`;

const FriendName = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: #FFFFFF;
`;

const FriendStatus = styled.div`
  font-size: 0.75rem;
  color: #9999AA;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const StatusDot = styled.div<{ $isOnline: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$isOnline ? '#4CAF50' : '#9999AA'};
  margin-right: 4px;
  ${props => props.$isOnline && `
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  `}
`;

// Friend requests components
const RequestsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  margin-top: 16px;
  
  &:hover {
    background-color: #2A2A3A;
  }
`;

const RequestsTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: #E70013;
`;

const RequestsToggle = styled.div`
  font-size: 0.7rem;
  color: #9999AA;
`;

const RequestsList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
`;

const RequestItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
`;

const RequestAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
  background-color: #2A2A3A;
`;

const RequestInfo = styled.div`
  flex: 1;
`;

const RequestName = styled.div`
  font-size: 0.85rem;
`;

const RequestTime = styled.div`
  font-size: 0.75rem;
  color: #9999AA;
`;

const RequestStatus = styled.div`
  font-size: 0.75rem;
  color: #E70013;
`;

const RequestActions = styled.div`
  display: flex;
  gap: 5px;
`;

const AcceptButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  border: none;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: #43A047;
  }
`;

const RejectButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #E70013;
  color: white;
  border: none;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: #D10012;
  }
`;

// Modal components
const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(3px);
`;

const ModalContent = styled.div`
  background-color: #1E1E2D;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #2A2A3A;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #9999AA;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  
  &:hover {
    color: white;
  }
`;

const ModalBody = styled.div`
  padding: 16px;
`;

const ModalFooter = styled.div`
  padding: 16px;
  border-top: 1px solid #2A2A3A;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  margin-bottom: 6px;
  color: #CCCCDD;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background-color: #2A2A3A;
  border: 1px solid #3A3A4A;
  border-radius: 4px;
  color: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4F46E5;
  }
`;

const FormHelp = styled.div`
  font-size: 0.8rem;
  color: #9999AA;
  margin-top: 8px;
`;

const CancelButton = styled.button`
  background-color: transparent;
  border: 1px solid #3A3A4A;
  border-radius: 4px;
  padding: 8px 16px;
  color: #CCCCDD;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    background-color: #2A2A3A;
  }
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  background-color: ${props => props.disabled ? '#3A3A4A' : '#4F46E5'};
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  color: white;
  font-size: 0.9rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &:hover {
    background-color: ${props => props.disabled ? '#3A3A4A' : '#4338CA'};
  }
`;

// Friend Request Notification styled components
const FriendRequestNotification = styled(motion.div)`
  display: flex;
  align-items: center;
  background-color: #2F2F40;
  border-left: 4px solid #4F46E5;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 95%;
  align-self: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 12px;
    gap: 10px;
  }
`;

const FriendRequestIcon = styled.div`
  font-size: 1.8rem;
  margin-right: 12px;
  
  @media (max-width: 768px) {
    margin-right: 0;
  }
`;

const FriendRequestContent = styled.div`
  flex: 1;
`;

const FriendRequestTitle = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: #E70013;
  margin-bottom: 4px;
`;

const FriendRequestMessage = styled.div`
  font-size: 0.9rem;
  margin-bottom: 4px;
`;

const FriendRequestTime = styled.div`
  font-size: 0.75rem;
  color: #9999AA;
`;

const FriendRequestActions = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FriendRequestAccept = styled.button`
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #43A047;
  }
  
  @media (max-width: 768px) {
    flex: 1;
    padding: 10px;
  }
`;

const FriendRequestDecline = styled.button`
  background-color: transparent;
  color: #CCCCDD;
  border: 1px solid #3A3A4A;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(231, 0, 19, 0.1);
    color: #E70013;
    border-color: #E70013;
  }
  
  @media (max-width: 768px) {
    flex: 1;
    padding: 10px;
  }
`;

// Enhanced online indicator
const OnlineIndicator = styled.div<{ $isOnline: boolean; $pulse: boolean }>`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.$isOnline ? '#4CAF50' : 'transparent'};
  border: 2px solid #191927;
  display: ${props => props.$isOnline ? 'block' : 'none'};
  animation: ${props => props.$pulse ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
    }
  }
`;

// Add these new styled components
const SystemMessageContent = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  padding: 10px 16px;
  border-radius: 8px;
  margin: 4px auto;
  max-width: 85%;
  text-align: center;
`;

const SystemMessageText = styled.div`
  font-size: 0.85rem;
  color: #9999AA;
  margin-bottom: 4px;
`;

const SystemMessageTime = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: right;
`;

export default TextChatApp; 