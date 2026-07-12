import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { Logo } from '../components/ui';

const { width } = Dimensions.get('window');
const NAVY = '#223263';
const NAVY_DARK = '#141d3d';

/**
 * SplashScreen — shown while AuthContext resolves the stored session.
 * Presentational only (no navigation prop): RootNavigator swaps it out for
 * AuthStack/MainTabs once the auth check + minimum display time are done.
 */
export default function SplashScreen() {
  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });

  const glowScale = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(14)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 10 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 8 }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(textTranslateY, { toValue: 0, useNativeDriver: true, speed: 10, bounciness: 6 }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const dotOpacity = (offset) =>
    pulse.interpolate({
      inputRange: [0, offset, Math.min(offset + 0.4, 1), 1],
      outputRange: [0.25, 0.25, 1, 0.25],
    });

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[NAVY, NAVY_DARK]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {/* Decorative glow blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.glow,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.logoBadge,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Logo size={40} color="#fff" strokeWidth={2.2} />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }], alignItems: 'center' }}>
          <Text style={styles.brandName}>Janki Care</Text>
          <Text style={styles.brandSub}>by Dr. Srinath Rathod</Text>
        </Animated.View>
      </View>

      <View style={styles.dotsRow}>
        {[0, 0.2, 0.4].map((offset, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dotOpacity(offset) }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  blobTop: {
    position: 'absolute',
    top: -width * 0.25,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logoBadge: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  brandName: {
    fontSize: 28,
    fontFamily: 'Urbanist_700Bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 12,
    fontFamily: 'Urbanist_600SemiBold',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#fff',
  },
});
