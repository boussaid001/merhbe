import 'styled-components';
import { ThemeType } from './styles/theme';

// Extend the DefaultTheme interface from styled-components
declare module 'styled-components' {
  export interface DefaultTheme extends ThemeType {}
} 