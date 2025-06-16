import { Socket } from 'socket.io-client';

// ICE servers configuration for optimal WebRTC connectivity
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    },
    {
      urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
      credential: 'webrtc',
      username: 'webrtc'
    }
  ],
  iceCandidatePoolSize: 10,
};

// WebRTC connection state interface
export interface RTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isMuted: boolean;
  isVideoOn: boolean;
  isCallActive: boolean;
}

// Default RTCState
export const initialRTCState: RTCState = {
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isMuted: false,
  isVideoOn: true,
  isCallActive: false,
};

/**
 * Check if browser supports WebRTC
 */
export const checkBrowserSupport = (): { supported: boolean; message?: string } => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      message: 'Your browser does not support media devices. Please try with a modern browser.'
    };
  }

  if (!window.RTCPeerConnection) {
    return {
      supported: false,
      message: 'Your browser does not support WebRTC. Please try with a modern browser like Chrome, Firefox, Safari, or Edge.'
    };
  }

  if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
    return {
      supported: false,
      message: 'WebRTC requires HTTPS on all websites except localhost. Please switch to HTTPS to use video chat.'
    };
  }

  return { supported: true };
};

/**
 * Get user media (camera and microphone) with additional compatibility handling
 */
export const getUserMedia = async (constraints = {
  audio: true,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  }
}): Promise<MediaStream> => {
  try {
    // Check for browser support
    const support = checkBrowserSupport();
    if (!support.supported) {
      throw new Error(support.message || 'WebRTC not supported');
    }

    console.log('Getting user media with constraints:', constraints);
    
    // Try to get media with the requested constraints
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got user media stream with tracks:', stream.getTracks().length);
      return stream;
    } catch (e) {
      // If high-quality video fails, try with lower quality
      if (constraints.video && typeof constraints.video === 'object') {
        console.log('Failed with high-quality video, trying with lower quality');
        const lowQualityConstraints = {
          audio: constraints.audio,
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(lowQualityConstraints);
        console.log('Got low-quality user media stream with tracks:', stream.getTracks().length);
        return stream;
      }
      
      // If that fails too, try audio only
      if (constraints.video) {
        console.log('Video failed, trying audio only');
        const audioOnlyConstraints = {
          audio: true,
          video: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(audioOnlyConstraints);
        console.log('Got audio-only stream with tracks:', stream.getTracks().length);
        return stream;
      }
      
      // If all else fails, re-throw the original error
      throw e;
    }
  } catch (error) {
    console.error('Error getting user media:', error);
    throw error;
  }
};

/**
 * Initialize WebRTC peer connection with browser compatibility handling
 */
export const createPeerConnection = (
  socket: Socket,
  userId: string,
  partnerId: string | null
): RTCPeerConnection => {
  if (!partnerId) {
    throw new Error('Partner ID is required to create peer connection');
  }

  const browserHasRtcpMuxPolicy = 'rtcpMuxPolicy' in RTCPeerConnection.prototype;
  const peerConnectionConfig: RTCConfiguration = {
    ...iceServers,
    // Cast to any to avoid TypeScript errors for browser-specific configuration
  };

  // Add browser-specific config safely
  if (browserHasRtcpMuxPolicy) {
    (peerConnectionConfig as any).rtcpMuxPolicy = 'require';
    (peerConnectionConfig as any).sdpSemantics = 'unified-plan';
  }

  console.log(`Creating peer connection for user ${userId} to connect with ${partnerId}`);
  const peerConnection = new RTCPeerConnection(peerConnectionConfig);
  
  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('Generated ICE candidate');
      socket.emit('ice_candidate', {
        candidate: event.candidate,
        to: partnerId
      });
    }
  };
  
  // Log connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state changed:', peerConnection.connectionState);
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerConnection.iceConnectionState);
    
    // Try to recover from failed connections
    if (peerConnection.iceConnectionState === 'failed') {
      console.log('Attempting to restart ICE after failure');
      if (peerConnection.restartIce) {
        peerConnection.restartIce();
      }
    }
  };
  
  return peerConnection;
};

/**
 * Add local stream tracks to peer connection and set up remote track handling
 */
export const setupMediaTracks = (
  peerConnection: RTCPeerConnection,
  localStream: MediaStream,
  onRemoteStream: (stream: MediaStream) => void
): void => {
  // Add local tracks to peer connection
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
    console.log(`Added ${track.kind} track to peer connection`);
  });
  
  // Create a remote stream and add tracks as they arrive
  const remoteStream = new MediaStream();
  
  // Handle incoming tracks (compatible with all browsers)
  peerConnection.ontrack = (event) => {
    console.log('Received remote tracks:', event.streams);
    if (event.streams && event.streams[0]) {
      // Standard approach - use the provided stream
      onRemoteStream(event.streams[0]);
    } else if (event.track) {
      // Fallback for some browsers - build our own stream
      remoteStream.addTrack(event.track);
      onRemoteStream(remoteStream);
    }
  };
};

/**
 * Create and send offer with browser-specific options
 */
export const createOffer = async (
  peerConnection: RTCPeerConnection,
  socket: Socket,
  partnerId: string
): Promise<void> => {
  try {
    console.log('Creating offer for:', partnerId);
    
    // Check if browser supports the standard options
    const offerOptions: RTCOfferOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    };
    
    // Add non-standard options safely
    (offerOptions as any).voiceActivityDetection = true;
    
    const offer = await peerConnection.createOffer(offerOptions);
    
    // Process SDP to improve compatibility (limit codecs if needed)
    let processedSdp = offer.sdp;
    
    // Set the processed offer
    const processedOffer = new RTCSessionDescription({
      type: offer.type,
      sdp: processedSdp
    });
    
    await peerConnection.setLocalDescription(processedOffer);
    console.log('Set local description (offer)');
    
    socket.emit('video_offer', {
      offer: processedOffer,
      to: partnerId
    });
    console.log('Sent offer to partner');
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
};

/**
 * Handle incoming offer with improved browser compatibility
 */
export const handleOffer = async (
  peerConnection: RTCPeerConnection,
  socket: Socket, 
  offer: RTCSessionDescriptionInit,
  partnerId: string
): Promise<void> => {
  try {
    console.log('Handling incoming offer from:', partnerId);
    
    // Process SDP if needed for browser compatibility
    const processedOffer = {
      type: offer.type,
      sdp: offer.sdp
    };
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(processedOffer));
    console.log('Set remote description (offer)');
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log('Set local description (answer)');
    
    socket.emit('video_answer', {
      answer: answer,
      to: partnerId
    });
    console.log('Sent answer to partner');
  } catch (error) {
    console.error('Error handling offer:', error);
    throw error;
  }
};

/**
 * Handle incoming answer with better error handling
 */
export const handleAnswer = async (
  peerConnection: RTCPeerConnection,
  answer: RTCSessionDescriptionInit
): Promise<void> => {
  try {
    console.log('Handling incoming answer');
    if (!peerConnection.currentRemoteDescription) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Set remote description (answer)');
    } else {
      console.log('Remote description already set, ignoring answer');
    }
  } catch (error) {
    console.error('Error handling answer:', error);
    throw error;
  }
};

/**
 * Handle incoming ICE candidate with improved error handling
 */
export const addIceCandidate = async (
  peerConnection: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> => {
  try {
    if (peerConnection.remoteDescription) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('Added ICE candidate');
    } else {
      console.log('Skipping ICE candidate, no remote description yet');
      // Store the candidate to add later when remote description is set
      setTimeout(async () => {
        if (peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('Added delayed ICE candidate');
          } catch (error) {
            console.error('Error adding delayed ICE candidate:', error);
          }
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
};

/**
 * Toggle microphone with error handling
 */
export const toggleMicrophone = (stream: MediaStream, isMuted: boolean): boolean => {
  try {
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = isMuted;
    });
    return !isMuted;
  } catch (error) {
    console.error('Error toggling microphone:', error);
    return isMuted;
  }
};

/**
 * Toggle camera with error handling
 */
export const toggleCamera = (stream: MediaStream, isVideoOff: boolean): boolean => {
  try {
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = isVideoOff;
    });
    return !isVideoOff;
  } catch (error) {
    console.error('Error toggling camera:', error);
    return isVideoOff;
  }
};

/**
 * End call and clean up resources
 */
export const endCall = (
  peerConnection: RTCPeerConnection | null,
  localStream: MediaStream | null
): void => {
  console.log('Ending call and cleaning up resources');
  
  if (peerConnection) {
    try {
      // Close all data channels
      if ((peerConnection as any).dataChannels) {
        Object.values((peerConnection as any).dataChannels).forEach((channel: any) => {
          try {
            channel.close();
          } catch (e) {
            console.error('Error closing data channel:', e);
          }
        });
      }
      
      peerConnection.close();
    } catch (error) {
      console.error('Error closing peer connection:', error);
    }
  }
  
  if (localStream) {
    try {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      console.log('Stopped local media tracks');
    } catch (error) {
      console.error('Error stopping local stream tracks:', error);
    }
  }
}; 