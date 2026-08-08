import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import GlassCard from './GlassCard';
import PressableButton from './PressableButton';

/**
 * ListRow — reusable list item with icon, title, subtitle, trailing element.
 *
 * Props:
 *   icon (string) — Ionicons name
 *   iconColor (string) — icon/bg accent color
 *   title (string) — main text
 *   subtitle (string) — secondary text
 *   trailing (ReactNode) — right-side element (badge, chevron, etc.)
 *   onPress (fn) — tap handler
 *   showChevron (bool) — show chevron-forward on the right
 */
export default function ListRow({ icon, iconColor, title, subtitle, trailing, onPress, showChevron = true, style }) {
  const { theme } = useTheme();
  const color = iconColor || theme.primary;

  const content = (
    <GlassCard style={[styles.card, style]}>
      <View style={styles.row}>
        {icon && (
          <View style={[styles.iconBox, { backgroundColor: `${color}14` }]}>
            <Ionicons name={icon} size={18} color={color} />
          </View>
        )}
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {trailing}
        {showChevron && !trailing && (
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        )}
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <PressableButton onPress={onPress} hapticType="light" scaleTo={0.98} style={{ marginBottom: 8 }}>
        {content}
      </PressableButton>
    );
  }

  return <View style={{ marginBottom: 8 }}>{content}</View>;
}

const styles = StyleSheet.create({
  card: { padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  textBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 2 },
});
