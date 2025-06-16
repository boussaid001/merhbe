import React, { ReactNode } from 'react';
import styled from 'styled-components';
import Header from './Header';
import CursorEffect from './CursorEffect';
// Import SVG as string to avoid TypeScript errors
import { ReactComponent as BgPattern } from '../assets/bg-pattern.svg';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Container>
      <BackgroundParticles />
      <CursorEffect />
      <Content>
        <Header />
        <Main>{children}</Main>
        <Footer>
          <FooterText>© 2023 Merhba Video Chat - Made in Tunisia 🇹🇳</FooterText>
        </Footer>
      </Content>
      <BottomWave />
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.foreground};
`;

const BackgroundParticles = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg width='1440' height='900' viewBox='0 0 1440 900' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='144' cy='100' r='2' fill='white' fill-opacity='0.5'/%3E%3Ccircle cx='344' cy='50' r='1.5' fill='white' fill-opacity='0.3'/%3E%3Ccircle cx='544' cy='150' r='2.5' fill='white' fill-opacity='0.4'/%3E%3Ccircle cx='744' cy='80' r='2' fill='white' fill-opacity='0.5'/%3E%3Ccircle cx='944' cy='200' r='1.5' fill='white' fill-opacity='0.3'/%3E%3Ccircle cx='1144' cy='120' r='2' fill='white' fill-opacity='0.4'/%3E%3Ccircle cx='1344' cy='180' r='2.5' fill='white' fill-opacity='0.5'/%3E%3Ccircle cx='94' cy='300' r='2' fill='white' fill-opacity='0.3'/%3E%3Ccircle cx='294' cy='250' r='1.5' fill='white' fill-opacity='0.5'/%3E%3Ccircle cx='494' cy='350' r='2.5' fill='white' fill-opacity='0.3'/%3E%3Ccircle cx='694' cy='280' r='2' fill='white' fill-opacity='0.4'/%3E%3Ccircle cx='894' cy='400' r='1.5' fill='white' fill-opacity='0.5'/%3E%3Ccircle cx='1094' cy='320' r='2' fill='white' fill-opacity='0.3'/%3E%3Ccircle cx='1294' cy='380' r='2.5' fill='white' fill-opacity='0.4'/%3E%3Ccircle cx='144' cy='500' r='2' fill='white' fill-opacity='0.4'/%3E%3Ccircle cx='344' cy='450' r='1.5' fill='white' fill-opacity='0.3'/%3E%3Ccircle cx='544' cy='550' r='2.5' fill='white' fill-opacity='0.5'/%3E%3Ccircle cx='744' cy='480' r='2' fill='white' fill-opacity='0.3'/%3E%3Ccircle cx='944' cy='600' r='1.5' fill='white' fill-opacity='0.4'/%3E%3Ccircle cx='1144' cy='520' r='2' fill='white' fill-opacity='0.5'/%3E%3Ccircle cx='1344' cy='580' r='2.5' fill='white' fill-opacity='0.3'/%3E%3C/svg%3E");
  background-size: cover;
  opacity: 0.4;
  z-index: 0;
`;

const Content = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 1;
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
`;

const Footer = styled.footer`
  margin-top: 3rem;
  padding: 1.5rem 0;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
`;

const FooterText = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.foreground};
  opacity: 0.7;
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

export default Layout; 