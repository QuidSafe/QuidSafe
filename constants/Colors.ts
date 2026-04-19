// QuidSafe Design System
//
// Web uses a light palette, native (iOS/Android) uses dark. Token names are
// kept for backwards compatibility - e.g. `Colors.charcoal` still means "card
// background" semantically, which resolves to near-white on web. When adding
// new code, prefer the semantic `colors` export (e.g. `colors.surface`) over
// the flat `Colors.*` tokens.

import { Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';

// ── Flat tokens ──────────────────────────────────────────
// These names describe their role in the dark palette. The values resolve
// platform-appropriately so screens using them directly still look right.
export const Colors = {
  // Role: app background / page chrome
  black: IS_WEB ? '#FFFFFF' : '#000000',
  // Role: card and primary surfaces
  charcoal: IS_WEB ? '#FFFFFF' : '#0A0A0A',
  // Role: elevated / secondary surfaces
  darkGrey: IS_WEB ? '#F2F2F7' : '#1A1A1A',
  // Role: borders and dividers
  midGrey: IS_WEB ? '#E5E5EA' : '#2A2A2A',
  // Accent (same on both themes)
  electricBlue: '#0066FF',
  blueHover: '#0052CC',
  blueGlow: IS_WEB ? 'rgba(0, 102, 255, 0.08)' : 'rgba(0, 102, 255, 0.15)',
  // Role: primary text
  white: IS_WEB ? '#0A0A0A' : '#FFFFFF',
  // Role: secondary text - AAA on both themes
  lightGrey: IS_WEB ? '#3A3A3C' : '#C4C4C4',
  // Role: tertiary text - AA normal / AAA large on both themes
  muted: IS_WEB ? '#6B6B70' : '#8A8A8A',
  // Status colours - darker on light mode for contrast against #FFF
  success: IS_WEB ? '#00A342' : '#00C853',
  warning: IS_WEB ? '#E88600' : '#FF9500',
  error: IS_WEB ? '#D70015' : '#FF3B30',

  // Legacy aliases - screens still reference these; remove when migrated
  primary: IS_WEB ? '#FFFFFF' : '#000000',
  secondary: '#0066FF',
  accent: '#0066FF',
  info: '#0066FF',
  dark: {
    text: IS_WEB ? '#0A0A0A' : '#FFFFFF',
    textSecondary: IS_WEB ? '#3A3A3C' : '#C4C4C4',
    textMuted: IS_WEB ? '#6B6B70' : '#8A8A8A',
    background: IS_WEB ? '#FFFFFF' : '#000000',
    surface: IS_WEB ? '#FFFFFF' : '#0A0A0A',
    surfaceSecondary: IS_WEB ? '#F2F2F7' : '#1A1A1A',
    tint: '#0066FF',
    tabIconDefault: IS_WEB ? '#8A8A8E' : '#666666',
    tabIconSelected: '#0066FF',
    border: IS_WEB ? '#E5E5EA' : '#2A2A2A',
    surfaceGlass: IS_WEB ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
    shadowColor: IS_WEB ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.3)',
    cardBorder: IS_WEB ? '#E5E5EA' : '#2A2A2A',
    accent: '#0066FF',
    accentPressed: '#0052CC',
    accentGlow: IS_WEB ? 'rgba(0, 102, 255, 0.08)' : 'rgba(0, 102, 255, 0.15)',
    success: IS_WEB ? '#00A342' : '#00C853',
    successGlow: IS_WEB ? 'rgba(0, 200, 83, 0.08)' : 'rgba(0, 200, 83, 0.15)',
    warning: IS_WEB ? '#E88600' : '#FF9500',
    error: IS_WEB ? '#D70015' : '#FF3B30',
  },
};

// ── Semantic tokens ──────────────────────────────────────
export const colors = {
  background: IS_WEB ? '#FFFFFF' : '#000000',
  surface: IS_WEB ? '#FFFFFF' : '#0A0A0A',
  surfaceSecondary: IS_WEB ? '#F2F2F7' : '#1A1A1A',
  border: IS_WEB ? '#E5E5EA' : '#2A2A2A',
  cardBorder: IS_WEB ? '#E5E5EA' : '#2A2A2A',
  text: IS_WEB ? '#0A0A0A' : '#FFFFFF',
  textSecondary: IS_WEB ? '#3A3A3C' : '#C4C4C4',
  textMuted: IS_WEB ? '#6B6B70' : '#8A8A8A',
  accent: '#0066FF',
  accentPressed: '#0052CC',
  accentGlow: IS_WEB ? 'rgba(0, 102, 255, 0.08)' : 'rgba(0, 102, 255, 0.15)',
  tint: '#0066FF',
  tabIconDefault: IS_WEB ? '#8A8A8E' : '#666666',
  tabIconSelected: '#0066FF',
  surfaceGlass: IS_WEB ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
  shadowColor: IS_WEB ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.3)',
  success: IS_WEB ? '#00A342' : '#00C853',
  successGlow: IS_WEB ? 'rgba(0, 200, 83, 0.08)' : 'rgba(0, 200, 83, 0.15)',
  warning: IS_WEB ? '#E88600' : '#FF9500',
  error: IS_WEB ? '#D70015' : '#FF3B30',
};

// ── Layout tokens ────────────────────────────────────────
export const BorderRadius = {
  card: 12,
  button: 8,
  input: 8,
  pill: 999,
  hero: 24, // legacy - remove when screens migrate
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ── Shadows - subtle on web, off on native (dark bg makes them invisible) ─
const webSoftShadow = {
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 1,
  shadowRadius: 2,
  elevation: 0,
};
const webMediumShadow = {
  shadowColor: 'rgba(0,0,0,0.1)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 6,
  elevation: 0,
};
const noShadow = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

export const Shadows = {
  soft: IS_WEB ? webSoftShadow : noShadow,
  medium: IS_WEB ? webMediumShadow : noShadow,
  large: IS_WEB ? webMediumShadow : noShadow,
  darkSoft: noShadow,
  darkMedium: noShadow,
  darkLarge: noShadow,
};

export const PressedState = {
  opacity: 0.9,
  transform: [{ scale: 0.98 }] as const,
};

export const CategoryTints = {
  blue: { bg: IS_WEB ? 'rgba(0,102,255,0.08)' : 'rgba(0,102,255,0.15)', color: '#0066FF' },
  green: { bg: IS_WEB ? 'rgba(0,200,83,0.08)' : 'rgba(0,200,83,0.15)', color: IS_WEB ? '#00A342' : '#00C853' },
  orange: { bg: IS_WEB ? 'rgba(255,149,0,0.1)' : 'rgba(255,149,0,0.15)', color: IS_WEB ? '#E88600' : '#FF9500' },
  red: { bg: IS_WEB ? 'rgba(255,59,48,0.08)' : 'rgba(255,59,48,0.15)', color: IS_WEB ? '#D70015' : '#FF3B30' },
  grey: { bg: IS_WEB ? 'rgba(0,0,0,0.05)' : 'rgba(160,160,160,0.12)', color: IS_WEB ? '#6B6B70' : '#666666' },
};

export default Colors;
