import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <HeaderContainer>
      <Logo>
        <Link to="/">
          <LogoText>
            <span>Merh</span>
            <LogoAccent>ba</LogoAccent>
          </LogoText>
        </Link>
      </Logo>
      
      <Navigation>
        <NavItem>Home</NavItem>
        <NavItem>Blog</NavItem>
        <NavItem>About</NavItem>
        <NavItem>Support</NavItem>
      </Navigation>
      
      <Controls>
        <SearchIcon>🔍</SearchIcon>
        <ThemeToggle 
          onClick={toggleTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </ThemeToggle>
        <LoginButton>Login</LoginButton>
      </Controls>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  margin-bottom: 2rem;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  
  a {
    text-decoration: none;
  }
`;

const LogoText = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.foreground};
  margin: 0;
`;

const LogoAccent = styled.span`
  color: ${({ theme }) => theme.primary};
`;

const Navigation = styled.nav`
  display: flex;
  gap: 2rem;
`;

const NavItem = styled.a`
  color: ${({ theme }) => theme.foreground};
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchIcon = styled.span`
  font-size: 1.2rem;
  cursor: pointer;
`;

const ThemeToggle = styled(motion.button)`
  background-color: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const LoginButton = styled.button`
  background-color: transparent;
  border: 1px solid rgba(127, 127, 127, 0.2);
  color: ${({ theme }) => theme.foreground};
  padding: 0.5rem 1.5rem;
  border-radius: 24px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

export default Header; 