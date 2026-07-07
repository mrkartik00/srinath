import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import PressableButton from './PressableButton';

/**
 * EmptyState — friendly empty state with icon, message, and optional CTA.
 *
 * Props:
 *   icon (string) — Ionicons name
 *   title (string) — bold headline
 *   message (string) — descriptive text
 *   actionLabel (string) — CTA button text (if provided, shows button)
 *   onAction (fn) — CTA handler
 *   color (string) — accent color for icon bg (defaults to theme.primary)
 */
export default function EmptyState({ icon = 'folder-open-outline', title = 'Nothing here yet', message, actionLabel, onAction, color }) {
  const { theme } = useTheme();
  const accent = color || theme.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.iconBg, { backgroundColor: `${accent}14` }]}>
        <Ionicons name={icon} size={36} color={accent} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>}
      {actionLabel && onAction && (
        <PressableButton onPress={onAction} hapticType="medium" style={styles.btnWrap} scaleTo={0.96}>
          <LinearGradient colors={[accent, `${accent}CC`]} style={styles.btn}>
            <Text style={styles.btnText}>{actionLabel}</Text>
          </LinearGradient>
        </PressableButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  iconBg: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  btnWrap: { marginTop: 20, borderRadius: 12 },
  btn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
