// QuidSafe Design System Colors
// Based on mockup.html — Trust Navy + Royal Blue + Warm Gold
export const Colors = {
  primary: '#0F172A',
  secondary: '#1E3A8A',
  accent: '#CA8A04',
  white: '#FFFFFF',
  black: '#1A1A2E',
  gold: {
    50: '#FEF9C3',
    100: '#FEF3C7',
    600: '#CA8A04',
    700: '#A16207',
  },
  grey: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  success: '#16A34A',
  warning: '#CA8A04',
  error: '#DC2626',
  info: '#1E3A8A',
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    tint: '#0F172A',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#0F172A',
    border: '#E2E8F0',
    surfaceGlass: 'rgba(255,255,255,0.95)',
    shadowColor: '#0F172A',
    cardBorder: 'rgba(226,232,240,0.8)',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0A0A0F',
    surface: '#16161D',
    tint: '#CA8A04',
    tabIconDefault: '#475569',
    tabIconSelected: '#CA8A04',
    border: '#222233',
    surfaceGlass: 'rgba(255,255,255,0.05)',
    shadowColor: 'rgba(0,0,0,0.3)',
    cardBorder: 'rgba(255,255,255,0.06)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  card: 16,
  input: 12,
  pill: 9999,
  button: 12,
  hero: 24,
};

export const Shadows = {
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
};

export default Colors;
