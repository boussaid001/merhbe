import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// High-quality images from CDN
const BACKGROUND_PATTERN = "https://res.cloudinary.com/dxzitrwr1/image/upload/v1695341082/pattern_background_dark_xoq3si.svg";
const HERO_IMAGE = "https://res.cloudinary.com/dxzitrwr1/image/upload/v1695341082/tunisian_chat_hero_qdflzg.webp";
const TUNISIA_FLAG = "https://flagcdn.com/w80/tn.png";
const LOGO_ICON = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ac.svg";
const USERS_IMAGES = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leila",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zied",
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentUserImage, setCurrentUserImage] = useState(0);
  
  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = [
        BACKGROUND_PATTERN, 
        HERO_IMAGE, 
        TUNISIA_FLAG, 
        LOGO_ICON,
        ...USERS_IMAGES
      ].map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = reject;
        });
      });
      
      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (err) {
        console.error("Failed to load images", err);
        // Set loaded anyway to avoid blocking the UI
        setImagesLoaded(true);
      }
    };
    
    preloadImages();
  }, []);
  
  // Rotate user images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUserImage(prev => (prev + 1) % USERS_IMAGES.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {imagesLoaded && (
        <Container
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackgroundParticles />
          
          <Header>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Logo>
                <LogoImage src={LOGO_ICON} alt="Merhba Chat" />
                <LogoText>Merhba<LogoDot>.tn</LogoDot></LogoText>
              </Logo>
            </motion.div>
            
            <Navigation
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <NavItem whileHover={{ scale: 1.05 }}>Home</NavItem>
              <NavItem whileHover={{ scale: 1.05 }}>Blog</NavItem>
              <NavItem whileHover={{ scale: 1.05 }}>About</NavItem>
              <NavItem whileHover={{ scale: 1.05 }}>Support</NavItem>
            </Navigation>
            
            <Controls
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <SearchIcon whileHover={{ scale: 1.1 }}>🔍</SearchIcon>
              <LoginButton 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </LoginButton>
            </Controls>
          </Header>
          
          <MainContent>
            <HeroSection>
              <HeroTextContainer>
                <HeroTitle
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  Talk to strangers,
                  <br />
                  <GradientSpan>Make friends!</GradientSpan>
                </HeroTitle>
                
                <HeroDescription
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  Experience a random chat alternative to find
                  <br />
                  friends, connect with people, and chat with
                  <br />
                  strangers from all over Tunisia and the world!
                </HeroDescription>
                
                <TunisianFlag
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.5, type: 'spring' }}
                >
                  <img src={TUNISIA_FLAG} alt="Tunisia" />
                  <span>Made in Tunisia</span>
                </TunisianFlag>
                
                <ActionButtons
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <TextChatButton
                    onClick={() => navigate('/text-chat')}
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 15px rgba(79, 70, 229, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ButtonIcon>💬</ButtonIcon>
                    Text Chat
                  </TextChatButton>
                  
                  <VideoChatButton
                    onClick={() => navigate('/video-chat')}
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 15px rgba(231, 0, 19, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ButtonIcon>🎥</ButtonIcon>
                    Video Chat
                  </VideoChatButton>
                </ActionButtons>
                
                <StatsBar
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  <StatItem>
                    <StatValue>10,000+</StatValue>
                    <StatLabel>Daily Users</StatLabel>
                  </StatItem>
                  <StatDivider />
                  <StatItem>
                    <StatValue>5M+</StatValue>
                    <StatLabel>Chats</StatLabel>
                  </StatItem>
                  <StatDivider />
                  <StatItem>
                    <StatValue>100+</StatValue>
                    <StatLabel>Countries</StatLabel>
                  </StatItem>
                </StatsBar>
              </HeroTextContainer>
              
              <FloatingUIContainer
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <FloatingImageContainer>
                  <HeroImage src={HERO_IMAGE} alt="Friends chatting" />
                </FloatingImageContainer>
                
                <AnimatedElements>
                  <NotificationBadge
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                  >
                    New Notification
                  </NotificationBadge>
                  
                  <ChatBubble
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4, duration: 0.5 }}
                  >
                    <ChatAvatar>
                      <img src={USERS_IMAGES[currentUserImage]} alt="User" />
                    </ChatAvatar>
                    <ChatMessage>
                      <ChatName>Ahmed</ChatName>
                      <ChatText>Ahla! How are you?</ChatText>
                    </ChatMessage>
                  </ChatBubble>
                  
                  <AnimatedCursor
                    animate={{
                      x: [0, 100, 150, 80, 0],
                      y: [0, 50, 20, 100, 0],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  />
                </AnimatedElements>
              </FloatingUIContainer>
            </HeroSection>
            
            <FeaturesSection
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <SectionTitle>
                Why choose <TitleAccent>Merhba</TitleAccent>?
              </SectionTitle>
              
              <FeaturesGrid>
                <FeatureCard
                  whileHover={{ y: -10, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
                >
                  <FeatureIcon>🔒</FeatureIcon>
                  <FeatureTitle>Safe & Private</FeatureTitle>
                  <FeatureText>Your privacy is our priority. Chat anonymously with no data storage.</FeatureText>
                </FeatureCard>
                
                <FeatureCard
                  whileHover={{ y: -10, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
                >
                  <FeatureIcon>🌍</FeatureIcon>
                  <FeatureTitle>Global Community</FeatureTitle>
                  <FeatureText>Connect with people from Tunisia and around the world.</FeatureText>
                </FeatureCard>
                
                <FeatureCard
                  whileHover={{ y: -10, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
                >
                  <FeatureIcon>⚡</FeatureIcon>
                  <FeatureTitle>Fast & Reliable</FeatureTitle>
                  <FeatureText>High-speed connections for smooth video and text chats.</FeatureText>
                </FeatureCard>
                
                <FeatureCard
                  whileHover={{ y: -10, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
                >
                  <FeatureIcon>🎭</FeatureIcon>
                  <FeatureTitle>Interest Matching</FeatureTitle>
                  <FeatureText>Find people who share your interests and passions.</FeatureText>
                </FeatureCard>
              </FeaturesGrid>
            </FeaturesSection>
          </MainContent>
          
          <BottomWave />
          
          <Footer>
            <FooterContent>
              <FooterLogo>
                <LogoImage src={LOGO_ICON} alt="Merhba Chat" />
                <LogoText>Merhba<LogoDot>.tn</LogoDot></LogoText>
              </FooterLogo>
              
              <FooterLinks>
                <FooterLink>Terms</FooterLink>
                <FooterLink>Privacy</FooterLink>
                <FooterLink>Help</FooterLink>
                <FooterLink>About</FooterLink>
              </FooterLinks>
              
              <FooterSocial>
                <SocialIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.854 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </SocialIcon>
                <SocialIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm5.205 8.45c.007.16.01.32.01.48 0 4.89-3.717 10.53-10.52 10.53-2.087 0-4.03-.612-5.665-1.66.29.035.583.05.877.05 1.723 0 3.306-.587 4.565-1.573-1.608-.03-2.966-1.093-3.433-2.55.224.042.455.065.69.065.335 0 .66-.045.967-.13C3.56 14.42 2.246 12.88 2.246 11.01v-.05c.534.297 1.14.476 1.786.497C2.933 10.78 2.1 9.48 2.1 8.013c0-.736.197-1.426.543-2.018 1.962 2.407 4.9 3.99 8.212 4.153-.067-.29-.103-.59-.103-.9 0-2.18 1.767-3.95 3.95-3.95 1.14 0 2.168.48 2.89 1.248.9-.177 1.75-.507 2.518-.962-.298.923-.928 1.694-1.75 2.046z" />
                  </svg>
                </SocialIcon>
                <SocialIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </SocialIcon>
              </FooterSocial>
            </FooterContent>
            
            <FooterCopyright>
              © 2023 Merhba.tn - Made with ❤️ in Tunisia
            </FooterCopyright>
          </Footer>
        </Container>
      )}
    </AnimatePresence>
  );
};

const Container = styled(motion.div)`
  min-height: 100vh;
  background-color: #161628;
  color: white;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const BackgroundParticles = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${BACKGROUND_PATTERN});
  background-size: cover;
  opacity: 0.4;
  z-index: 0;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  position: relative;
  z-index: 1;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const LogoImage = styled.img`
  width: 28px;
  height: 28px;
`;

const LogoText = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(90deg, #E70013 0%, #FFFFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`;

const LogoDot = styled.span`
  color: #E70013;
  -webkit-text-fill-color: #E70013;
`;

const Navigation = styled(motion.nav)`
  display: flex;
  gap: 2rem;
`;

const NavItem = styled(motion.a)`
  color: white;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #E70013;
  }
`;

const Controls = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchIcon = styled(motion.span)`
  font-size: 1.2rem;
  cursor: pointer;
`;

const LoginButton = styled(motion.button)`
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 24px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
`;

const MainContent = styled.main`
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
  flex: 1;
`;

const HeroSection = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3rem 0;
`;

const HeroTextContainer = styled.div`
  max-width: 600px;
`;

const HeroTitle = styled(motion.h2)`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
`;

const GradientSpan = styled.span`
  background: linear-gradient(90deg, #E70013 0%, #FF6B6B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const HeroDescription = styled(motion.p)`
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
`;

const TunisianFlag = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  
  img {
    height: 20px;
    border-radius: 2px;
  }
  
  span {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const ActionButtons = styled(motion.div)`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BaseButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
`;

const TextChatButton = styled(BaseButton)`
  background-color: #4F46E5;
  color: white;
  
  &:hover {
    background-color: #4338CA;
  }
`;

const ButtonIcon = styled.span`
  font-size: 1.2rem;
`;

const StatsBar = styled(motion.div)`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1.5rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #E70013;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const StatDivider = styled.div`
  width: 1px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.1);
`;

const FloatingUIContainer = styled(motion.div)`
  position: relative;
  width: 550px;
  height: 550px;
`;

const FloatingImageContainer = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.2);
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AnimatedElements = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const NotificationBadge = styled(motion.div)`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: #1F1F3D;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const ChatBubble = styled(motion.div)`
  position: absolute;
  bottom: 40px;
  left: 30px;
  background-color: rgba(79, 70, 229, 0.8);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  gap: 10px;
  max-width: 250px;
  backdrop-filter: blur(5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
`;

const ChatAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ChatMessage = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChatName = styled.div`
  font-weight: 600;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
`;

const ChatText = styled.div`
  font-size: 0.9rem;
  color: white;
`;

const AnimatedCursor = styled(motion.div)`
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(231, 0, 19, 0.5);
  box-shadow: 0 0 0 5px rgba(231, 0, 19, 0.2);
  filter: blur(1px);
`;

const FeaturesSection = styled(motion.section)`
  padding: 5rem 0;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
`;

const TitleAccent = styled.span`
  color: #E70013;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
`;

const FeatureCard = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const FeatureText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
`;

const BottomWave = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23E70013' fill-opacity='0.2' d='M0,160L48,160C96,160,192,160,288,176C384,192,480,224,576,213.3C672,203,768,149,864,149.3C960,149,1056,203,1152,208C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover;
  background-position: center;
  z-index: 0;
`;

const Footer = styled.footer`
  background-color: rgba(0, 0, 0, 0.3);
  padding: 3rem 0 1rem;
  margin-top: auto;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
`;

const FooterContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const FooterLink = styled.a`
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
  cursor: pointer;
  
  &:hover {
    color: white;
  }
`;

const FooterSocial = styled.div`
  display: flex;
  gap: 1rem;
`;

const SocialIcon = styled.a`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    background-color: #E70013;
    transform: translateY(-3px);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const FooterCopyright = styled.div`
  text-align: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 1400px;
  margin: 0 auto;
  padding-left: 2rem;
  padding-right: 2rem;
`;

const VideoOffIndicator = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 12px;
  background-color: rgba(0, 0, 0, 0.7);
`;

const VideoChatButton = styled(BaseButton)`
  background-color: #E70013;
  color: white;
  
  &:hover {
    background-color: #D10012;
  }
`;

const ControlsBar = styled.div`
  // ... existing code ...
`;

export default LandingPage; 