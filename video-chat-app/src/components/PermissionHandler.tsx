import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface PermissionHandlerProps {
  onPermissionsGranted: () => void;
}

const PermissionHandler: React.FC<PermissionHandlerProps> = ({ onPermissionsGranted }) => {
  const [permissionStatus, setPermissionStatus] = useState<'initial' | 'requesting' | 'granted' | 'denied'>('initial');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        setPermissionStatus('requesting');
        
        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support media devices. Please try with a modern browser.');
        }
        
        // Request camera and microphone permissions
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } 
        });
        
        // Stop all tracks (we don't need them yet, just the permissions)
        stream.getTracks().forEach(track => track.stop());
        
        // Set permission status to granted
        setPermissionStatus('granted');
        
        // Call the callback function to proceed
        onPermissionsGranted();
        
      } catch (error) {
        console.error('Error requesting permissions:', error);
        setPermissionStatus('denied');
        
        // Provide helpful error messages based on error type
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setErrorMessage('Camera and/or microphone access was denied. Please allow access and try again.');
          } else if (error.name === 'NotFoundError') {
            setErrorMessage('No camera or microphone was found on your device.');
          } else if (error.name === 'NotReadableError') {
            setErrorMessage('Your camera or microphone is already in use by another application.');
          } else if (error.name === 'OverconstrainedError') {
            setErrorMessage('The requested media settings cannot be satisfied by your hardware.');
          } else if (error.name === 'AbortError') {
            setErrorMessage('Media capture was aborted.');
          } else {
            setErrorMessage(`Error accessing media devices: ${error.message}`);
          }
        } else {
          setErrorMessage('An unknown error occurred while trying to access your camera and microphone.');
        }
      }
    };
    
    requestPermissions();
  }, [onPermissionsGranted]);

  const handleRetryPermissions = async () => {
    setErrorMessage(null);
    setPermissionStatus('initial');
  };

  const handleGoBack = () => {
    navigate('/');
  };

  if (permissionStatus === 'requesting' || permissionStatus === 'initial') {
    return (
      <Container>
        <PermissionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Title>Camera & Microphone Access</Title>
          <Description>
            Please allow access to your camera and microphone to enable video calling.
          </Description>
          <PermissionIcon>🎥 🎤</PermissionIcon>
          <StatusText>Requesting access...</StatusText>
          <Spinner />
          <InfoText>
            If you see a permission dialog, please click "Allow" to continue.
          </InfoText>
        </PermissionCard>
      </Container>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <Container>
        <PermissionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Title>Access Denied</Title>
          <ErrorIcon>❌</ErrorIcon>
          <ErrorMessage>{errorMessage || 'Could not access camera or microphone.'}</ErrorMessage>
          
          <HelpText>
            You may need to:
            <ul>
              <li>Allow access in your browser's permission settings</li>
              <li>Make sure no other application is using your camera</li>
              <li>Check if your camera and microphone are connected properly</li>
            </ul>
          </HelpText>
          
          <ButtonGroup>
            <Button onClick={handleRetryPermissions}>Try Again</Button>
            <Button secondary onClick={handleGoBack}>Go Back</Button>
          </ButtonGroup>
        </PermissionCard>
      </Container>
    );
  }

  // This should not be visible as we call onPermissionsGranted() when granted
  return null;
};

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #161628;
  padding: 20px;
`;

const PermissionCard = styled(motion.div)`
  background-color: rgba(26, 26, 48, 0.8);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h1`
  color: white;
  font-size: 28px;
  margin-bottom: 16px;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24px;
  line-height: 1.5;
`;

const StatusText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 16px 0;
  font-weight: 500;
`;

const PermissionIcon = styled.div`
  font-size: 48px;
  margin: 20px 0;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin: 20px 0;
  color: #e74c3c;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  margin-bottom: 20px;
  line-height: 1.5;
  font-weight: 500;
`;

const HelpText = styled.div`
  color: rgba(255, 255, 255, 0.7);
  text-align: left;
  margin: 20px 0;
  line-height: 1.5;
  
  ul {
    margin-top: 10px;
    margin-left: 20px;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

const Button = styled.button<{ secondary?: boolean }>`
  background-color: ${props => props.secondary ? 'transparent' : '#4F46E5'};
  color: white;
  border: ${props => props.secondary ? '1px solid #4F46E5' : 'none'};
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.secondary ? 'rgba(79, 70, 229, 0.1)' : '#4338CA'};
  }
  
  &:disabled {
    background-color: #333;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
`;

const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  margin-top: 24px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #4F46E5;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default PermissionHandler; 