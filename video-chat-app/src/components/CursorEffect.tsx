import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const CursorEffect: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Random position changes to simulate cursor movement
    const interval = setInterval(() => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Random position within the screen bounds
      const newX = Math.random() * (screenWidth * 0.8); 
      const newY = Math.random() * (screenHeight * 0.6);
      
      setPosition({ x: newX, y: newY });
      setIsVisible(true);
      
      // Hide cursor after a short time
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <CursorContainer
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0,
        x: position.x,
        y: position.y
      }}
      transition={{ 
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
    >
      <CursorOuter />
      <CursorInner />
    </CursorContainer>
  );
};

const CursorContainer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 30px;
  height: 30px;
  pointer-events: none;
  z-index: 1000;
`;

const CursorOuter = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(231, 0, 19, 0.2); /* Using Tunisian red with transparency */
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.5);
      opacity: 0.2;
    }
    100% {
      transform: scale(1);
      opacity: 0.5;
    }
  }
`;

const CursorInner = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #E70013; /* Tunisian red */
`;

export default CursorEffect; 