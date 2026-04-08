// QuidSafe Design System — Dark-only palette

// ── Flat tokens ──────────────────────────────────────────
export const Colors = {
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
  success: '#00C853',
  warning: '#FF9500',
  error: '#FF3B30',

  // Legacy aliases — screens still reference these; remove when migrated
  primary: '#000000',
  secondary: '#0066FF',
  accent: '#0066FF',
  info: '#0066FF',
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

// ── Semantic tokens (single dark theme) ──────────────────
export const colors = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#1A1A1A',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  accent: '#0066FF',
  accentPressed: '#0052CC',
  accentGlow: 'rgba(0, 102, 255, 0.15)',
  success: '#00C853',
  warning: '#FF9500',
  error: '#FF3B30',
};

// ── Layout tokens ────────────────────────────────────────
export const BorderRadius = {
  card: 12,
  button: 8,
  input: 8,
  pill: 999,
  hero: 24, // legacy — remove when screens migrate
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ── Legacy compat — remove when screens migrate ─────────
export const Shadows = {
  soft: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  medium: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  large: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  darkSoft: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  darkMedium: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  darkLarge: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const PressedState = {
  opacity: 0.9,
  transform: [{ scale: 0.98 }] as const,
};

export const CategoryTints = {
  blue: { bg: 'rgba(0,102,255,0.15)', color: '#0066FF' },
  green: { bg: 'rgba(0,200,83,0.15)', color: '#00C853' },
  orange: { bg: 'rgba(255,149,0,0.15)', color: '#FF9500' },
  red: { bg: 'rgba(255,59,48,0.15)', color: '#FF3B30' },
  grey: { bg: 'rgba(160,160,160,0.12)', color: '#666666' },
};

export default Colors;
