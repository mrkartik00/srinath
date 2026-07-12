import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * SegmentedControl — iOS-style segmented picker.
 *
 * Props:
 *   segments (string[]) — tab labels
 *   activeIndex (number) — currently active segment index
 *   onChange (fn(index)) — callback on segment change
 */
export default function SegmentedControl({ segments = [], activeIndex = 0, onChange }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.chipBg }]}>
      {segments.map((label, i) => {
        const active = i === activeIndex;
        return (
          <TouchableOpacity
            key={label}
            onPress={() => onChange?.(i)}
            activeOpacity={0.9}
            style={[
              styles.segment,
              active && [styles.activeSegment, { backgroundColor: theme.card }]
            ]}
          >
            <Text style={[
              styles.label,
              { color: active ? theme.primary : theme.textMuted },
              active && styles.activeLabel
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSegment: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 14, fontFamily: 'Urbanist_600SemiBold' },
  activeLabel: { fontFamily: 'Urbanist_700Bold' },
});
