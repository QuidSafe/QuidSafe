// QuidSafe Design System Colors
// New palette: Black + Electric Blue, flat and clean
export const Colors = {
  // Primary palette
  black: '#000000',
  charcoal: '#0A0A0A',
  darkGrey: '#1A1A1A',
  midGrey: '#2A2A2A',
  electricBlue: '#0066FF',
  blueHover: '#0052CC',
  blueGlow: 'rgba(0, 102, 255, 0.15)',
  white: '#FFFFFF',
  lightGrey: '#A0A0A0',
  muted: '#666666',

  // Semantic colours
  success: '#00C853',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#0066FF',

  // Legacy aliases (referenced across screens)
  primary: '#000000',
  secondary: '#0066FF',
  accent: '#0066FF',

  // Dark-only theme palette
  dark: {
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    background: '#000000',
    surface: '#0A0A0A',
    tint: '#0066FF',
    tabIconDefault: '#666666',
    tabIconSelected: '#0066FF',
    border: '#2A2A2A',
    surfaceGlass: 'rgba(255,255,255,0.05)',
    shadowColor: 'rgba(0,0,0,0.3)',
    cardBorder: '#2A2A2A',
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
  card: 12,
  input: 8,
  pill: 9999,
  button: 8,
  hero: 24,
};

export const Shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
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

/** Semantic category background tints — dark-only, use for icon containers and badges */
export const CategoryTints = {
  blue: { bg: 'rgba(0,102,255,0.15)', color: '#0066FF' },
  green: { bg: 'rgba(0,200,83,0.15)', color: '#00C853' },
  orange: { bg: 'rgba(255,149,0,0.15)', color: '#FF9500' },
  red: { bg: 'rgba(255,59,48,0.15)', color: '#FF3B30' },
  grey: { bg: 'rgba(160,160,160,0.12)', color: '#666666' },
};

export default Colors;
