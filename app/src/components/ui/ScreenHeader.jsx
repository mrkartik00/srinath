import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import haptics from '../../utils/haptics';

/**
 * ScreenHeader — large title header with optional back button & right action.
 *
 * Props:
 *   title (string) — large title text
 *   subtitle (string) — optional subtitle/description below title
 *   onBack (fn) — if provided, shows a back arrow
 *   rightIcon (string) — Ionicons name for right action
 *   onRightPress (fn) — handler for right action
 *   rightComponent (ReactNode) — custom right element
 */
export default function ScreenHeader({ title, subtitle, onBack, rightIcon, onRightPress, rightComponent }) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {onBack && (
          <TouchableOpacity
            onPress={() => { haptics.light(); onBack(); }}
            style={[styles.backBtn, { backgroundColor: theme.chipBg }]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (rightIcon && onRightPress && (
        <TouchableOpacity
          onPress={() => { haptics.light(); onRightPress(); }}
          style={[styles.rightBtn, { backgroundColor: theme.chipBg }]}
          activeOpacity={0.7}
        >
          <Ionicons name={rightIcon} size={20} color={theme.primary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  leftRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  titleBlock: { flex: 1 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  rightBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
