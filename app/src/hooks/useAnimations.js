import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * useScreenAnimation — provides consistent fade+slide-up entrance.
 *
 * Usage:
 *   const { fadeAnim, slideAnim, staggerDelay } = useScreenAnimation();
 *   <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
 *
 * staggerDelay(index) → returns an Animated.Value for staggered list items.
 */
export function useScreenAnimation({ duration = 450, slideFrom = 20, delay = 0 } = {}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(slideFrom)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 6,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return { fadeAnim, slideAnim };
}

/**
 * useStaggerAnimation — animates N items with staggered entrance.
 *
 * Usage:
 *   const { getItemStyle, triggerStagger } = useStaggerAnimation(items.length);
 *   triggerStagger(); // call after data loads
 *   items.map((item, i) => <Animated.View style={getItemStyle(i)} />)
 */
export function useStaggerAnimation(count, { staggerMs = 40, slideFrom = 15 } = {}) {
  const anims = useRef(
    Array.from({ length: Math.max(count, 20) }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(slideFrom),
    }))
  ).current;

  const triggerStagger = (itemCount) => {
    const n = itemCount || count;
    const animations = [];
    for (let i = 0; i < Math.min(n, anims.length); i++) {
      animations.push(
        Animated.parallel([
          Animated.timing(anims[i].opacity, {
            toValue: 1,
            duration: 350,
            delay: i * staggerMs,
            useNativeDriver: true,
          }),
          Animated.spring(anims[i].translateY, {
            toValue: 0,
            delay: i * staggerMs,
            useNativeDriver: true,
            speed: 14,
            bounciness: 4,
          }),
        ])
      );
    }
    Animated.parallel(animations).start();
  };

  const getItemStyle = (index) => {
    if (index >= anims.length) return {};
    return {
      opacity: anims[index].opacity,
      transform: [{ translateY: anims[index].translateY }],
    };
  };

  const resetAnimations = () => {
    anims.forEach((a) => {
      a.opacity.setValue(0);
      a.translateY.setValue(slideFrom);
    });
  };

  return { getItemStyle, triggerStagger, resetAnimations };
}

export default useScreenAnimation;
