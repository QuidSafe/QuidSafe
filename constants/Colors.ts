// QuidSafe Design System Colors
export const Colors = {
  primary: '#0F4C75',
  secondary: '#1B9C85',
  accent: '#E8A838',
  white: '#FFFFFF',
  black: '#1A1A2E',
  grey: {
    50: '#F8F9FA',
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#868E96',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },
  success: '#1B9C85',
  warning: '#E8A838',
  error: '#E74C3C',
  info: '#0F4C75',
  light: {
    text: '#1A1A2E',
    textSecondary: '#495057',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    tint: '#0F4C75',
    tabIconDefault: '#ADB5BD',
    tabIconSelected: '#0F4C75',
    border: '#E9ECEF',
  },
  dark: {
    text: '#F8F9FA',
    textSecondary: '#ADB5BD',
    background: '#1A1A2E',
    surface: '#16213E',
    tint: '#1B9C85',
    tabIconDefault: '#495057',
    tabIconSelected: '#1B9C85',
    border: '#343A40',
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
  card: 14,
  input: 10,
  pill: 9999,
  button: 12,
};

export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};

export default Colors;
