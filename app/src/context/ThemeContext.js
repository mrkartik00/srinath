import React, { createContext, useContext, useState, useMemo } from 'react';

const ThemeContext = createContext();

const shared = {
  primary: '#007AFF',
  primaryDark: '#0056CC',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  heart: '#FF3B30',
  purple: '#AF52DE',
  teal: '#5AC8FA',
  pink: '#FF2D55',
};

export const light = {
  ...shared,
  bg: '#F2F2F7',
  card: '#FFFFFF',
  cardGlass: 'rgba(255,255,255,0.7)',
  glassBorder: 'rgba(255,255,255,0.8)',
  pillBg: 'rgba(255,255,255,0.6)',
  text: '#000000',
  textSecondary: '#3C3C43',
  textMuted: '#8E8E93',
  inputBg: '#F2F2F7',
  chipBg: '#F2F2F7',
  border: '#E5E5EA',
  avatarBg: '#FFFFFF',
  gradient: ['#FFECD2', '#F2F2F7', '#F2F2F7'],
  blurTint: 'light',
  shadow: '#000',
};

export const dark = {
  ...shared,
  bg: '#000000',
  card: '#1C1C1E',
  cardGlass: 'rgba(28,28,30,0.85)',
  glassBorder: 'rgba(255,255,255,0.08)',
  pillBg: 'rgba(28,28,30,0.75)',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textMuted: '#8E8E93',
  inputBg: '#2C2C2E',
  chipBg: '#2C2C2E',
  border: '#38383A',
  avatarBg: '#2C2C2E',
  gradient: ['#1C1C1E', '#000000', '#000000'],
  blurTint: 'dark',
  shadow: '#000',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const value = useMemo(() => ({
    theme: isDark ? dark : light,
    isDark,
    toggleTheme: () => setIsDark(p => !p),
  }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
