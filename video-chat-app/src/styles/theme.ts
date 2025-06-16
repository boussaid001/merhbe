// Tunisian theme colors and settings
// Red from Tunisian flag as accent, dark purple background like Chitchat.gg

export const lightTheme = {
  // Primary colors
  primary: '#E70013', // Red from Tunisian flag
  secondary: '#FFFFFF', // White from Tunisian flag
  accent: '#00A651', // Green accent
  
  // Background colors
  background: '#f8f9fa',
  foreground: '#212529',
  cardBackground: '#FFFFFF',
  
  // UI elements
  buttonBackground: '#E70013',
  buttonText: '#FFFFFF',
  borderRadius: '12px',
  fontFamily: "'Poppins', sans-serif",
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  
  // Status colors
  statusOnline: '#00A651',
  statusSearching: '#FFC107',
  statusTyping: '#0D6EFD',
};

export const darkTheme = {
  // Primary colors
  primary: '#E70013', // Red from Tunisian flag
  secondary: '#FFFFFF', // White from Tunisian flag
  accent: '#00A651', // Green accent
  
  // Background colors - dark purple like Chitchat.gg
  background: '#161628',
  foreground: '#f8f9fa',
  cardBackground: '#1F1F3D',
  
  // UI elements
  buttonBackground: '#E70013',
  buttonText: '#FFFFFF',
  borderRadius: '12px',
  fontFamily: "'Poppins', sans-serif",
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  
  // Status colors
  statusOnline: '#00A651',
  statusSearching: '#FFC107',
  statusTyping: '#0D6EFD',
};

export type ThemeType = typeof lightTheme; 