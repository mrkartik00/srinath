import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import PressableButton from './PressableButton';

/**
 * FAB — Floating Action Button for primary screen actions.
 *
 * Props:
 *   icon (string) — Ionicons name (default 'add')
 *   onPress (fn) — tap handler
 *   color (string) — gradient start (defaults to theme.primary)
 */
export default function FAB({ icon = 'add', onPress, color, style }) {
  const { theme } = useTheme();
  const accent = color || theme.primary;

  return (
    <PressableButton onPress={onPress} hapticType="medium" style={[styles.container, style]} scaleTo={0.9}>
      <LinearGradient colors={[accent, `${accent}DD`]} style={styles.fab}>
        <Ionicons name={icon} size={26} color="#fff" />
      </LinearGradient>
    </PressableButton>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 82,
    right: 20,
    zIndex: 100,
    borderRadius: 28,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
