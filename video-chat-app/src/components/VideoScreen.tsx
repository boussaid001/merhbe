import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Socket } from 'socket.io-client';
import {
  addIceCandidate,
  createOffer,
  endCall,
  getUserMedia,
  handleAnswer,
  handleOffer,
  toggleCamera,
  toggleMicrophone
} from '../utils/webrtc';

interface VideoScreenProps {
  socket: Socket | null;
  userId: string | null;
  partnerId: string | null;
  partnerName: string;
  onCallEnded: () => void;
}

const VideoScreen: React.FC<VideoScreenProps> = ({
  socket,
  userId,
  partnerId,
  partnerName,
  onCallEnded
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('initializing');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Initialize media and webRTC
  useEffect(() => {
    const initialize = async () => {
      if (!socket || !userId || !partnerId) {
        console.error('Missing required parameters for video call');
        setErrorMessage('Missing connection parameters');
        return;
      }

      try {
        setConnectionStatus('requesting_permissions');
        
        // Get user media
        const stream = await getUserMedia().catch(err => {
          console.error('Error getting user media:', err);
          setErrorMessage(`Camera/microphone access denied: ${err.message}`);
          throw err;
        });
        
        setLocalStream(stream);
        
        // Set local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setConnectionStatus('connecting');
        
        // Create RTCPeerConnection with enhanced ICE servers
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ],
          iceCandidatePoolSize: 10
        });
        
        // Add tracks to the peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
        
        // Handle incoming tracks
        peerConnection.ontrack = (event) => {
          console.log('Received remote stream');
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          }
        };
        
        // Set up ICE candidate handling
        peerConnection.onicecandidate = (event) => {
          if (event.candidate && socket && socket.connected) {
            console.log('Sending ICE candidate to peer');
            socket.emit('ice_candidate', {
              candidate: event.candidate,
              to: partnerId
            });
          }
        };
        
        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', peerConnection.iceConnectionState);
          
          if (peerConnection.iceConnectionState === 'disconnected' ||
              peerConnection.iceConnectionState === 'failed') {
            console.warn('ICE connection failed or disconnected');
            setErrorMessage('Connection to peer lost');
            
            // Try to restart ICE if possible
            if (peerConnection.restartIce) {
              console.log('Attempting to restart ICE connection');
              peerConnection.restartIce();
            }
          }
          
          if (peerConnection.iceConnectionState === 'connected') {
            console.log('ICE connection established successfully');
            setConnectionStatus('connected');
            setErrorMessage(null);
          }
        };
        
        // Log connection state changes
        peerConnection.onconnectionstatechange = () => {
          console.log('Connection state:', peerConnection.connectionState);
          setConnectionStatus(peerConnection.connectionState);
          
          if (peerConnection.connectionState === 'disconnected' || 
              peerConnection.connectionState === 'failed') {
            handleEndCall();
          }
        };
        
        // Handle negotiation needed
        peerConnection.onnegotiationneeded = async () => {
          console.log('Negotiation needed');
          try {
            if (socket && socket.connected && userId.localeCompare(partnerId) > 0) {
              await createOffer(peerConnection, socket, partnerId);
            }
          } catch (error) {
            console.error('Error during negotiation:', error);
          }
        };
        
        // Store the peer connection
        peerConnectionRef.current = peerConnection;
        
        // Create and send the offer if we're the initiator
        const isInitiator = userId.localeCompare(partnerId) > 0;
        if (isInitiator && socket) {
          await createOffer(peerConnection, socket, partnerId);
        }
        
        // Listen for signaling events
        setupSignalingListeners();
        
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        setConnectionStatus('failed');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error initializing video call');
      }
    };
    
    initialize();
    
    // Clean up on unmount
    return () => {
      handleEndCall();
      if (socket) {
        socket.off('video_offer');
        socket.off('video_answer');
        socket.off('ice_candidate');
      }
    };
  }, [socket, userId, partnerId]);
  
  // Set up signaling event listeners
  const setupSignalingListeners = () => {
    if (!socket) return;
    
    socket.on('video_offer', async (data: { offer: RTCSessionDescriptionInit, from: string }) => {
      if (!peerConnectionRef.current) return;
      
      try {
        console.log('Received video offer from:', data.from);
        await handleOffer(
          peerConnectionRef.current,
          socket,
          data.offer,
          data.from
        );
      } catch (error) {
        console.error('Error handling video offer:', error);
        setErrorMessage('Failed to process incoming call');
      }
    });
    
    socket.on('video_answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current) return;
      
      try {
        console.log('Received video answer');
        await handleAnswer(peerConnectionRef.current, data.answer);
      } catch (error) {
        console.error('Error handling video answer:', error);
        setErrorMessage('Failed to establish connection');
      }
    });
    
    socket.on('ice_candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      if (!peerConnectionRef.current) return;
      
      try {
        console.log('Received ICE candidate');
        await addIceCandidate(peerConnectionRef.current, data.candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });
    
    // Listen for end call event from server
    socket.on('end_video_call', () => {
      console.log('Received end call signal from server');
      handleEndCall();
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Socket disconnected during video call');
      setErrorMessage('Server connection lost');
    });
  };
  
  // Handle ending the call
  const handleEndCall = () => {
    // Notify server that call has ended
    if (socket && socket.connected && partnerId) {
      socket.emit('end_video_call', { partnerId });
    }
    
    // Clean up WebRTC resources
    endCall(peerConnectionRef.current, localStream);
    peerConnectionRef.current = null;
    
    // Reset state
    setRemoteStream(null);
    setConnectionStatus('disconnected');
    
    // Notify parent component
    onCallEnded();
  };

  // Handle retry connection
  const handleRetryConnection = async () => {
    if (peerConnectionRef.current && socket && socket.connected && userId && partnerId) {
      setErrorMessage(null);
      setConnectionStatus('connecting');
      
      try {
        // Close existing connection
        peerConnectionRef.current.close();
        
        // Create new connection
        const newPeerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ],
          iceCandidatePoolSize: 10
        });
        
        // Re-add tracks
        if (localStream) {
          localStream.getTracks().forEach(track => {
            newPeerConnection.addTrack(track, localStream);
          });
        }
        
        // Set up handlers again
        newPeerConnection.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          }
        };
        
        newPeerConnection.onicecandidate = (event) => {
          if (event.candidate && socket && socket.connected) {
            socket.emit('ice_candidate', {
              candidate: event.candidate,
              to: partnerId
            });
          }
        };
        
        newPeerConnection.onconnectionstatechange = () => {
          setConnectionStatus(newPeerConnection.connectionState);
          if (newPeerConnection.connectionState === 'disconnected' || 
              newPeerConnection.connectionState === 'failed') {
            handleEndCall();
          }
        };
        
        // Update ref
        peerConnectionRef.current = newPeerConnection;
        
        // Create new offer
        const isInitiator = userId.localeCompare(partnerId) > 0;
        if (isInitiator) {
          await createOffer(newPeerConnection, socket, partnerId);
        }
        
      } catch (error) {
        console.error('Error retrying connection:', error);
        setConnectionStatus('failed');
        setErrorMessage('Failed to reconnect');
      }
    }
  };

  // Handle mute toggle
  const handleToggleMute = () => {
    if (localStream) {
      const newMuteState = toggleMicrophone(localStream, isMuted);
      setIsMuted(newMuteState);
    }
  };
  
  // Handle video toggle
  const handleToggleVideo = () => {
    if (localStream) {
      const newVideoState = toggleCamera(localStream, isVideoOff);
      setIsVideoOff(newVideoState);
    }
  };
  
  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <Container>
      {connectionStatus === 'requesting_permissions' && (
        <StatusOverlay>
          <span>⏳ Requesting camera and microphone access...</span>
        </StatusOverlay>
      )}
      
      {connectionStatus === 'connecting' && (
        <StatusOverlay>
          <span>🔄 Connecting to {partnerName}...</span>
        </StatusOverlay>
      )}
      
      {connectionStatus === 'failed' && (
        <StatusOverlay>
          <span>❌ Connection failed</span>
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
          <ButtonGroup>
            <ActionButton onClick={handleRetryConnection}>Retry</ActionButton>
            <ActionButton onClick={onCallEnded}>Back</ActionButton>
          </ButtonGroup>
        </StatusOverlay>
      )}
      
      <VideoContainer isFullScreen={isFullScreen}>
        {/* Remote video (partner) */}
        <RemoteVideoWrapper>
          {remoteStream ? (
            <RemoteVideo 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline
              muted={false}
            />
          ) : (
            <VideoPlaceholder>
              <span>Waiting for {partnerName}'s video...</span>
            </VideoPlaceholder>
          )}
          
          <PartnerName>
            {partnerName}
          </PartnerName>
        </RemoteVideoWrapper>
        
        {/* Local video (self) */}
        <LocalVideoWrapper>
          <LocalVideo
            ref={localVideoRef}
            autoPlay
            playsInline
            muted={true}
            isVideoOff={isVideoOff}
          />
          
          {isVideoOff && (
            <VideoOffIndicator>
              <span>Camera Off</span>
            </VideoOffIndicator>
          )}
        </LocalVideoWrapper>
      </VideoContainer>
      
      {/* Controls */}
      <ControlsContainer>
        <ControlButton onClick={handleToggleMute}>
          {isMuted ? '🔇' : '🎤'}
        </ControlButton>
        
        <ControlButton onClick={handleToggleVideo}>
          {isVideoOff ? '📵' : '📹'}
        </ControlButton>
        
        <ControlButton onClick={toggleFullScreen}>
          {isFullScreen ? '↙️' : '↗️'}
        </ControlButton>
        
        <EndCallButton onClick={handleEndCall}>
          End Call
        </EndCallButton>
      </ControlsContainer>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #111;
  display: flex;
  flex-direction: column;
`;

const StatusOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  z-index: 100;
  
  span {
    margin-bottom: 20px;
  }
  
  button {
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 30px;
    padding: 12px 24px;
    font-size: 18px;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #4338CA;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  margin: 10px 0 20px;
  text-align: center;
  font-size: 16px;
  max-width: 80%;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  background-color: #4F46E5;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #4338CA;
  }
`;

const VideoContainer = styled.div<{ isFullScreen: boolean }>`
  position: relative;
  width: 100%;
  flex: 1;
  background-color: #111;
  overflow: hidden;
  
  ${props => props.isFullScreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  `}
`;

const RemoteVideoWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111;
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const VideoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a2e;
  color: white;
  font-size: 20px;
  text-align: center;
  padding: 20px;
`;

const LocalVideoWrapper = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 160px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 2px solid #333;
  z-index: 10;
`;

const LocalVideo = styled.video<{ isVideoOff: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* Mirror effect */
  background-color: ${props => props.isVideoOff ? '#222' : 'transparent'};
`;

const VideoOffIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
`;

const PartnerName = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 16px;
`;

const ControlsContainer = styled.div`
  position: relative;
  height: 80px;
  width: 100%;
  background-color: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const ControlButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #333;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #444;
  }
`;

const EndCallButton = styled.button`
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

export default VideoScreen; 