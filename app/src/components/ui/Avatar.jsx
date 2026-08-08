import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Avatar — circular avatar with image or initials fallback.
 *
 * Props:
 *   uri (string) — image URL
 *   name (string) — fallback: show first letter
 *   size (number) — diameter (default 44)
 *   color (string) — accent color for initials bg
 */
export default function Avatar({ uri, name = '', size = 44, color }) {
  const { theme } = useTheme();
  const accent = color || theme.primary;
  const fontSize = size * 0.38;
  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.img, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius, backgroundColor: `${accent}18` }]}>
      <Text style={[styles.initial, { fontSize, color: accent }]}>
        {(name || '?')[0].toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: '#E5E5EA' },
  fallback: { justifyContent: 'center', alignItems: 'center' },
  initial: { fontWeight: '700' },
});
