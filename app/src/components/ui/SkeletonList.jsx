import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * SkeletonList — shimmer placeholder loading state.
 *
 * Props:
 *   count (number) — number of skeleton rows (default 4)
 *   style — container style override
 */
export default function SkeletonList({ count = 4, style }) {
  const { theme } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  const isAndroid = Platform.OS === 'android';

  useEffect(() => {
    const cycleDuration = isAndroid ? 650 : 1000;
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: cycleDuration, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: cycleDuration, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.row,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: isAndroid ? 1 : 0,
              opacity,
            },
          ]}
        >
          <View style={[styles.circle, { backgroundColor: theme.chipBg }]} />
          <View style={styles.lines}>
            <View style={[styles.lineL, { backgroundColor: theme.chipBg }]} />
            <View style={[styles.lineS, { backgroundColor: theme.chipBg }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 10 },
  circle: { width: 44, height: 44, borderRadius: 12 },
  lines: { flex: 1, marginLeft: 14, gap: 8 },
  lineL: { height: 12, borderRadius: 6, width: '75%' },
  lineS: { height: 10, borderRadius: 5, width: '50%' },
});
