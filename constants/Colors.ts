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
  // Centralized dark mode shadows — use instead of redefining inline
  darkSoft: {
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  darkMedium: {
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
  },
  darkLarge: {
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 8,
  },
};

/** Standard press state — use in Pressable style callback */
export const PressedState = {
  opacity: 0.9,
  transform: [{ scale: 0.98 }] as const,
};

/** Semantic category background tints — use for icon containers and badges */
export const CategoryTints = {
  blue: { bg: '#EFF6FF', bgDark: 'rgba(30,58,138,0.15)', color: '#1E3A8A' },
  green: { bg: '#F0FDF4', bgDark: 'rgba(22,163,74,0.15)', color: '#16A34A' },
  gold: { bg: '#FEF9C3', bgDark: 'rgba(202,138,4,0.15)', color: '#A16207' },
  purple: { bg: '#F5F3FF', bgDark: 'rgba(124,58,237,0.15)', color: '#7C3AED' },
  orange: { bg: '#FFF7ED', bgDark: 'rgba(234,88,12,0.15)', color: '#EA580C' },
  red: { bg: '#FEF2F2', bgDark: 'rgba(220,38,38,0.15)', color: '#DC2626' },
  grey: { bg: '#F1F5F9', bgDark: 'rgba(148,163,184,0.12)', color: '#475569' },
  pink: { bg: '#FDF2F8', bgDark: 'rgba(236,72,153,0.15)', color: '#EC4899' },
  cyan: { bg: '#ECFEFF', bgDark: 'rgba(6,182,212,0.15)', color: '#06B6D4' },
};

export default Colors;
