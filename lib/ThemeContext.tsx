import { createContext, useContext, useMemo } from 'react';
import { Colors } from '@/constants/Colors';

// Dark mode is the only theme - no light mode variants
export type ThemeMode = 'dark';

export interface ThemeColors {
  text: string;
  textSecondary: string;
  textMuted: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
  surfaceGlass: string;
  shadowColor: string;
  cardBorder: string;
  accent: string;
  accentPressed: string;
  accentGlow: string;
  success: string;
  successGlow: string;
  warning: string;
  error: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: true;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  setMode: () => {},
  isDark: true,
  colors: Colors.dark,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => ({
    mode: 'dark' as const,
    setMode: () => {},
    isDark: true as const,
    colors: Colors.dark,
  }), []);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
