import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

export type StatusType = 'connected' | 'searching' | 'typing' | 'disconnected' | 'connecting';

interface StatusBarProps {
  status: StatusType;
  username?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, username }) => {
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return `Connected with ${username || 'Anonymous'}`;
      case 'searching':
        return 'Searching for someone to chat with...';
      case 'typing':
        return `${username || 'They'} is typing...`;
      case 'connecting':
        return 'Connecting to server...';
      case 'disconnected':
      default:
        return 'Disconnected. Click "Next" to start a new chat.';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return '🔗';
      case 'searching':
        return '🔍';
      case 'typing':
        return '⌨️';
      case 'disconnected':
        return '⏸️';
      default:
        return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#4CAF50'; // Green
      case 'searching':
        return '#FFC107'; // Amber
      case 'typing':
        return '#2196F3'; // Blue
      case 'disconnected':
        return '#E70013'; // Red (Tunisian red)
      default:
        return '#E0E0E0'; // Light gray
    }
  };

  return (
    <StatusContainer
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StatusContent>
        <StatusLeft>
          <StatusIndicator 
            statusColor={getStatusColor()}
            $pulse={status === 'typing' || status === 'searching'}
          />
          <StatusText>{getStatusText()}</StatusText>
        </StatusLeft>
        
        <AnimatePresence mode="wait">
          <StatusRight
            key={status}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <StatusIcon>{getStatusIcon()}</StatusIcon>
            {status === 'connected' && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <ConnectionDuration>00:03:45</ConnectionDuration>
              </motion.div>
            )}
            {status === 'typing' && (
              <TypingAnimation>
                <TypingDot delay="0s" />
                <TypingDot delay="0.2s" />
                <TypingDot delay="0.4s" />
              </TypingAnimation>
            )}
          </StatusRight>
        </AnimatePresence>
      </StatusContent>

      {status === 'connected' && (
        <ConnectionBar
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 30 }}
        />
      )}
    </StatusContainer>
  );
};

const StatusContainer = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #1F1F3D;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
`;

const StatusContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const StatusLeft = styled.div`
  display: flex;
  align-items: center;
`;

const StatusRight = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIndicator = styled.div<{ statusColor: string; $pulse: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.statusColor};
  margin-right: 12px;
  
  ${({ $pulse, statusColor }) => $pulse && `
    animation: pulse 2s infinite;
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 ${statusColor}80;
      }
      70% {
        box-shadow: 0 0 0 10px ${statusColor}00;
      }
      100% {
        box-shadow: 0 0 0 0 ${statusColor}00;
      }
    }
  `}
`;

const StatusText = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin: 0;
`;

const StatusIcon = styled.div`
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
`;

const ConnectionDuration = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  background-color: rgba(76, 175, 80, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
`;

const TypingAnimation = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TypingDot = styled.div<{ delay: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #2196F3;
  animation: bounce 1.4s infinite ease-in-out;
  animation-delay: ${props => props.delay};

  @keyframes bounce {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-6px);
    }
  }
`;

const ConnectionBar = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #4CAF50, #E70013);
`;

export default StatusBar; 