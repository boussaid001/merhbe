import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import VideoScreen from './VideoScreen';

const VideoChatApp: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>('disconnected');
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>('Anonymous');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    // Create a temporary user ID if we don't have one
    const tempUserId = localStorage.getItem('tempUserId') || Math.random().toString(36).substring(2, 15);
    const tempUserName = localStorage.getItem('tempUserName') || 'User_' + tempUserId.substring(0, 5);
    
    if (!localStorage.getItem('tempUserId')) {
      localStorage.setItem('tempUserId', tempUserId);
      localStorage.setItem('tempUserName', tempUserName);
    }
    
    setUserId(tempUserId);
    setUsername(tempUserName);

    // Create socket connection with improved configuration
    const serverUrl = process.env.NODE_ENV === 'development'
      ? window.location.origin // Use the same origin, which will go through the Vite proxy
      : window.location.protocol === 'https:'
        ? `https://${window.location.hostname}:4000`
        : `http://${window.location.hostname}:4000`;
      
    console.log('Connecting to server at:', serverUrl);
    
    let connectionAttempts = 0;
    const maxConnectionAttempts = 5;
    
    const connectSocket = () => {
      if (connectionAttempts >= maxConnectionAttempts) {
        console.error('Max connection attempts reached. Please check server status.');
        return;
      }
      
      // Close any existing connection
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      connectionAttempts++;
      
      const newSocket = io(serverUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        forceNew: true,
        autoConnect: true,
        withCredentials: true,
        extraHeaders: {
          "Access-Control-Allow-Origin": window.location.origin
        }
      });
      
      // Socket connection events
      newSocket.on('connect', () => {
        console.log('Socket connected with ID:', newSocket.id);
        setIsSocketConnected(true);
        setStatus('connecting');
        connectionAttempts = 0; // Reset connection attempts on successful connection
        
        // Generate a mock token for demonstration
        const mockToken = `mock_token_${tempUserId}`;
        
        // Try authentication after a short delay
        setTimeout(() => {
          console.log('Sending authentication with token:', mockToken);
          newSocket.emit('authenticate', mockToken);
        }, 500);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsSocketConnected(false);
        setIsAuthenticated(false);
        setStatus('disconnected');
        
        // Try to reconnect with a delay
        setTimeout(() => {
          if (connectionAttempts < maxConnectionAttempts) {
            console.log(`Reconnection attempt ${connectionAttempts + 1}/${maxConnectionAttempts}`);
            connectSocket();
          }
        }, 2000);
      });
      
      newSocket.on('authenticated', (data) => {
        console.log('Authenticated with server', data);
        setIsAuthenticated(true);
        setUserId(data.userId);
        setUsername(data.username);
        setStatus('disconnected');
      });
      
      newSocket.on('auth_error', (error) => {
        console.error('Authentication error:', error);
        setIsAuthenticated(false);
        setStatus('disconnected');
      });
      
      newSocket.on('searching', () => {
        console.log('Searching for chat partner');
        setIsSearching(true);
        setStatus('searching');
      });
      
      newSocket.on('chat_connected', (data) => {
        console.log('Chat connected:', data);
        
        setIsSearching(false);
        setIsConnected(true);
        setPartnerId(data.partnerId);
        setPartnerName(data.username || 'Anonymous');
        setStatus('connected');
      });
      
      newSocket.on('partner_left', () => {
        endChatSession();
      });
      
      newSocket.on('chat_ended', () => {
        endChatSession();
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server. Reason:', reason);
        setIsSocketConnected(false);
        setIsAuthenticated(false);
        setStatus('disconnected');
        setIsConnected(false);
        setPartnerId(null);
        
        // Only attempt to reconnect if it wasn't an intentional disconnection
        if (reason !== 'io client disconnect') {
          setTimeout(() => {
            if (connectionAttempts < maxConnectionAttempts) {
              console.log(`Attempting reconnect after disconnect. Attempt ${connectionAttempts + 1}/${maxConnectionAttempts}`);
              connectSocket();
            }
          }, 2000);
        }
      });
      
      // Store socket in ref
      socketRef.current = newSocket;
    };
    
    // Start connection process
    connectSocket();
    
    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Start searching for a chat partner
  const startSearching = () => {
    if (socketRef.current && isAuthenticated) {
      socketRef.current.emit('search_chat');
      setStatus('searching');
      setIsSearching(true);
    } else {
      console.error('Cannot start searching: not authenticated or socket not connected');
    }
  };
  
  // End the current chat session
  const endChatSession = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_chat');
    }
    
    setIsConnected(false);
    setPartnerId(null);
    setStatus('disconnected');
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (isConnected) {
      endChatSession();
    } else {
      startSearching();
    }
  };
  
  // Handle call ended from VideoScreen
  const handleCallEnded = () => {
    endChatSession();
  };

  return (
    <Container>
      {isConnected && partnerId ? (
        <VideoScreen
          socket={socketRef.current}
          userId={userId}
          partnerId={partnerId}
          partnerName={partnerName}
          onCallEnded={handleCallEnded}
        />
      ) : (
        <WelcomeContainer>
          <WelcomeCard 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WelcomeTitle>
              {status === 'searching' ? 'Finding a partner...' : 'Start Video Chatting'}
            </WelcomeTitle>
            
            <StatusMessage>
              {status === 'disconnected' && !isSocketConnected && 'Connecting to server...'}
              {status === 'disconnected' && isSocketConnected && 'Ready to connect with someone new?'}
              {status === 'connecting' && 'Connecting to server...'}
              {status === 'searching' && 'Looking for a chat partner...'}
            </StatusMessage>
            
            {status === 'searching' && <Spinner />}
            
            {isAuthenticated ? (
              <ActionButton 
                onClick={handleSearchClick}
                isSearching={isSearching}
                disabled={status === 'connecting' || !isSocketConnected}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isConnected ? 'End Chat' : 
                  status === 'searching' ? 'Cancel' : 'Find a Partner'}
              </ActionButton>
            ) : (
              <ActionButton 
                disabled={true}
                isSearching={false}
              >
                Connecting...
              </ActionButton>
            )}
            
            <InfoText>
              By using this service, you agree to our Terms of Service and Privacy Policy.
            </InfoText>
          </WelcomeCard>
        </WelcomeContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100vh;
  background-color: #161628;
  display: flex;
  flex-direction: column;
`;

const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 20px;
`;

const WelcomeCard = styled(motion.div)`
  background-color: rgba(26, 26, 48, 0.8);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const WelcomeTitle = styled.h1`
  color: white;
  font-size: 28px;
  margin-bottom: 16px;
`;

const StatusMessage = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 30px;
`;

const ActionButton = styled(motion.button)<{ isSearching: boolean }>`
  background-color: ${props => props.isSearching ? '#FF5722' : '#4F46E5'};
  color: white;
  border: none;
  border-radius: 30px;
  padding: 14px 28px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: block;
  width: 100%;
  
  &:hover {
    background-color: ${props => props.isSearching ? '#E64A19' : '#4338CA'};
  }
  
  &:disabled {
    background-color: #333;
    cursor: not-allowed;
  }
`;

const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  margin-top: 24px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  margin: 0 auto 30px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #4F46E5;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default VideoChatApp; 