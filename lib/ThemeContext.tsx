import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  text: string;
  textSecondary: string;
  background: string;
  surface: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
  surfaceGlass: string;
  shadowColor: string;
  cardBorder: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  isDark: true,
  colors: Colors.dark,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme !== 'light';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const colors = useMemo(() => (isDark ? Colors.dark : Colors.light), [isDark]);

  const value = useMemo(() => ({ mode, setMode, isDark, colors }), [mode, isDark, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
