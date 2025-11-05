// Theme tokens derived from USBGF logo colors
export const colors = {
  // Primary colors from logo (dark blue)
  primary: '#1B365D',
  primaryDark: '#0F0F1A',
  
  // Background colors
  bg: '#1A1A2E',
  surface: '#FFFFFF',
  
  // Text colors
  textPrimary: '#111111',
  textSecondary: '#5A5A5A',
  textOnDark: '#FFFFFF',
  
  // Accent colors
  accent: '#DC2626', // Red from logo
  success: '#1A9E55',
  error: '#DC2626',
  
  // Neutral colors
  border: '#E5E5E5',
  placeholder: '#9CA3AF',
  disabled: '#D1D5DB',
  grey: '#3D3935', // Grey for secondary buttons
  
  // OAuth brand colors
  apple: '#000000',
  google: '#4285F4',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    fontFamily: 'DunbarTall-Regular', // Dunbar Tall for headers - falls back to system font if not loaded
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    fontFamily: 'DunbarTall-Regular', // Dunbar Tall for headers - falls back to system font if not loaded
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    fontFamily: 'CaslonPro3-Regular', // Caslon Pro 3 for body text - falls back to system font if not loaded
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    fontFamily: 'CaslonPro3-Regular', // Caslon Pro 3 for body text - falls back to system font if not loaded
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    fontFamily: 'CaslonPro3-Regular', // Caslon Pro 3 for buttons - falls back to system font if not loaded
  },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;
