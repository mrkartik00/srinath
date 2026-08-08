import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { haptics } from '../../utils/haptics';

/**
 * PressableButton — premium tactile button with scale animation + haptic feedback.
 * Layout props (flex/alignSelf/width/margins) are lifted to the Pressable so it
 * sizes and spaces correctly inside flex rows; visual styling stays on the inner view.
 */
export default function PressableButton({ onPress, style, children, hapticType = 'light', scaleTo = 0.96, disabled = false }) {
  const scale = useRef(new Animated.Value(1)).current;

  const flat = StyleSheet.flatten(style) || {};
  const { flex, alignSelf, width, marginBottom, marginTop, marginHorizontal, marginVertical, margin, ...inner } = flat;
  const outer = { flex, alignSelf, width, marginBottom, marginTop, marginHorizontal, marginVertical, margin };

  const handlePressIn = () => {
    if (disabled) return;
    if (haptics[hapticType]) haptics[hapticType]();
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} style={outer}>
      <Animated.View style={[inner, { transform: [{ scale }] }, flex ? { width: '100%', justifyContent: 'center' } : null, disabled && styles.disabled]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
});
