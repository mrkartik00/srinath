import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * StatusBadge — colored dot + label, used for appointment/prescription/reminder statuses.
 *
 * Props:
 *   status (string) — e.g. 'scheduled', 'completed', 'cancelled', 'active', 'missed'
 *   size ('sm' | 'md') — default 'sm'
 */

const STATUS_COLORS = {
  scheduled: '#007AFF',
  upcoming: '#007AFF',
  pending: '#FF9500',
  active: '#34C759',
  completed: '#34C759',
  taken: '#34C759',
  acknowledged: '#34C759',
  cancelled: '#FF3B30',
  missed: '#FF3B30',
  no_show: '#FF3B30',
  snoozed: '#FF9500',
  sent: '#5AC8FA',
  resolved: '#8E8E93',
  expired: '#8E8E93',
  past_due: '#FF9500',
};

export default function StatusBadge({ status, size = 'sm', label }) {
  const { theme } = useTheme();
  const color = STATUS_COLORS[status] || theme.textMuted;
  const displayLabel = label || status?.replace(/_/g, ' ') || 'unknown';
  const isMd = size === 'md';

  return (
    <View style={[styles.badge, { backgroundColor: `${color}14` }, isMd && styles.badgeMd]}>
      <View style={[styles.dot, { backgroundColor: color }, isMd && styles.dotMd]} />
      <Text style={[styles.text, { color }, isMd && styles.textMd]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeMd: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotMd: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  textMd: { fontSize: 13 },
});
