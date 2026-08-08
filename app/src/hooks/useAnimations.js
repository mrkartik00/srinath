import { useRef, useEffect } from 'react';
import { Animated, Platform, Easing } from 'react-native';

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
      scale: new Animated.Value(0.96),
    }))
  ).current;

  const triggerStagger = (itemCount) => {
    const n = itemCount || count;
    const animations = [];
    const isAndroid = Platform.OS === 'android';

    for (let i = 0; i < Math.min(n, anims.length); i++) {
      const delay = isAndroid ? Math.min(i * 35, 180) : i * staggerMs;
      animations.push(
        Animated.parallel([
          Animated.timing(anims[i].opacity, {
            toValue: 1,
            duration: isAndroid ? 240 : 350,
            delay,
            useNativeDriver: true,
            easing: isAndroid ? Easing.out(Easing.quad) : undefined,
          }),
          Animated.spring(anims[i].translateY, {
            toValue: 0,
            delay,
            useNativeDriver: true,
            speed: isAndroid ? 12 : 14,
            bounciness: isAndroid ? 2 : 4,
          }),
        ])
      );
    }
    Animated.parallel(animations).start();
  };

  const getItemStyle = (index) => {
    if (index >= anims.length) return {};
    return {
      // On Android, animating opacity on cards with elevation causes black ambient shadow bleed-through.
      // Keeping opacity solid (1) and using slide translateY prevents the black box artifact.
      opacity: Platform.OS === 'android' ? 1 : anims[index].opacity,
      transform: [{ translateY: anims[index].translateY }],
    };
  };

  const resetAnimations = () => {
    anims.forEach((a) => {
      a.opacity.setValue(0);
      a.translateY.setValue(slideFrom);
      a.scale.setValue(0.96);
    });
  };

  return { getItemStyle, triggerStagger, resetAnimations };
}

export default useScreenAnimation;
