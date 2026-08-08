import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import PressableButton from './PressableButton';

/**
 * Chip — selectable filter/tag pill.
 *
 * Props:
 *   label (string) — text
 *   active (bool) — selected state
 *   onPress (fn) — toggle handler
 *   color (string) — custom active color (defaults to theme.primary)
 *   size ('sm' | 'md') — default 'md'
 */
export default function Chip({ label, active, onPress, color, size = 'md' }) {
  const { theme } = useTheme();
  const accent = color || theme.primary;
  const isSm = size === 'sm';

  return (
    <PressableButton
      onPress={onPress}
      hapticType="selection"
      style={[
        styles.chip,
        isSm && styles.chipSm,
        { backgroundColor: active ? accent : theme.chipBg },
      ]}
      scaleTo={0.94}
    >
      <Text style={[
        styles.text,
        isSm && styles.textSm,
        { color: active ? '#fff' : theme.text },
      ]}>
        {label}
      </Text>
    </PressableButton>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  chipSm: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  text: { fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  textSm: { fontSize: 12 },
});
