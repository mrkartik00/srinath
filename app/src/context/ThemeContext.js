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
  primary: '#223263',
  primaryDark: '#223263',
  bg: '#F5F7FA',
  card: '#FFFFFF',
  cardGlass: '#FFFFFF',
  glassBorder: '#EEF2F8',
  pillBg: '#F5F7FA',
  text: '#223263',
  textSecondary: '#8F9BB3',
  textMuted: '#8F9BB3',
  inputBg: '#FFFFFF',
  chipBg: '#EEF2F8',
  border: '#EEF2F8',
  avatarBg: '#FFFFFF',
  gradient: ['#F5F7FA', '#F5F7FA', '#F5F7FA'],
  blurTint: 'light',
  shadow: '#223263',
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
