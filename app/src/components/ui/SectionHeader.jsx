import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import haptics from '../../utils/haptics';

/**
 * SectionHeader — section title with optional "See all" action link.
 *
 * Props:
 *   title (string) — section label
 *   actionLabel (string) — right-side link text (e.g. "View all")
 *   onAction (fn) — link handler
 */
export default function SectionHeader({ title, actionLabel, onAction }) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={() => { haptics.light(); onAction(); }} activeOpacity={0.7}>
          <Text style={[styles.action, { color: theme.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  action: { fontSize: 15, fontWeight: '600' },
});
