import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  PanResponder,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const FULL_HEIGHT = SCREEN_HEIGHT - 60;

/**
 * BottomSheet — modal overlay from bottom with drag handle.
 * Dragging upward expands it to full screen; dragging downward dismisses it.
 * Manages local lifecycle state so opening and closing animations run completely before unmounting.
 *
 * Props:
 *   visible (bool) — controls visibility
 *   onClose (fn) — callback to close
 *   children (ReactNode) — sheet content
 *   height (number) — min/resting height (default 400)
 */
export default function BottomSheet({ visible, onClose, children, height = 400 }) {
  const { theme } = useTheme();
  
  // Local state to keep sheet mounted while closing animation is running
  const [shouldRender, setShouldRender] = useState(visible);

  const minHeight = height;
  const snapMin = FULL_HEIGHT - minHeight;
  const snapMax = 0; // Full screen

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Track the current translation value so we can calculate drag offsets correctly
  const lastTranslateY = useRef(SCREEN_HEIGHT);
  const startTranslateY = useRef(SCREEN_HEIGHT);
  
  useEffect(() => {
    const listenerId = translateY.addListener((state) => {
      lastTranslateY.current = state.value;
    });
    return () => translateY.removeListener(listenerId);
  }, []);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: snapMin,
          useNativeDriver: true,
          speed: 14,
          bounciness: 4,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only drag if there is significant vertical movement
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        startTranslateY.current = lastTranslateY.current;
        translateY.setOffset(startTranslateY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const absoluteY = startTranslateY.current + gestureState.dy;
        // Clamp absoluteY during dragging between 0 (full screen) and SCREEN_HEIGHT
        const clampedY = Math.min(Math.max(absoluteY, 0), SCREEN_HEIGHT);
        translateY.setValue(clampedY - startTranslateY.current);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const startY = startTranslateY.current;
        const dy = gestureState.dy;

        if (startY === snapMax) {
          // Starting from full screen
          if (dy > 240) {
            // Dragged down very far -> dismiss
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 220,
                useNativeDriver: true,
              }),
              Animated.timing(backdropAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              onClose();
            });
          } else if (dy > 60) {
            // Dragged down a moderate amount -> snap back to min height
            Animated.spring(translateY, {
              toValue: snapMin,
              useNativeDriver: true,
              speed: 12,
              bounciness: 4,
            }).start();
          } else {
            // Stay at full screen
            Animated.spring(translateY, {
              toValue: snapMax,
              useNativeDriver: true,
              speed: 12,
              bounciness: 3,
            }).start();
          }
        } else {
          // Starting from min height (snapMin)
          if (dy > 80) {
            // Dragged down past threshold -> dismiss
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 220,
                useNativeDriver: true,
              }),
              Animated.timing(backdropAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              onClose();
            });
          } else if (dy < -60) {
            // Dragged up -> snap to full screen
            Animated.spring(translateY, {
              toValue: snapMax,
              useNativeDriver: true,
              speed: 12,
              bounciness: 3,
            }).start();
          } else {
            // Snap back to min height
            Animated.spring(translateY, {
              toValue: snapMin,
              useNativeDriver: true,
              speed: 12,
              bounciness: 4,
            }).start();
          }
        }
      },
    })
  ).current;

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height: FULL_HEIGHT,
              backgroundColor: theme.card,
              transform: [{ translateY: translateY }],
            },
          ]}
        >
          {/* Draggable handle header bar */}
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>
          
          <View style={styles.innerContent}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  dragHandleArea: {
    width: '100%',
    paddingTop: 14,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  innerContent: {
    flex: 1,
  },
});
