import { createGlobalStyle } from 'styled-components';
import { ThemeType } from './theme';

export const GlobalStyles = createGlobalStyle<{ theme: ThemeType }>`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: ${({ theme }) => theme.fontFamily};
    background-color: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.foreground};
    transition: all 0.3s ease;
  }
  
  button {
    cursor: pointer;
    border: none;
    font-family: ${({ theme }) => theme.fontFamily};
    font-weight: 600;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  select, input {
    font-family: ${({ theme }) => theme.fontFamily};
    border-radius: ${({ theme }) => theme.borderRadius};
    border: 1px solid rgba(0, 0, 0, 0.1);
    padding: 8px 12px;
    background-color: ${({ theme }) => theme.cardBackground};
    color: ${({ theme }) => theme.foreground};
  }
`; 