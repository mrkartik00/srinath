import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const MEDICAL_ICONS = [
  'stethoscope',
  'heart-pulse',
  'pill',
  'bandage',
  'flask-outline',
  'thermometer',
  'medical-bag',
  'hospital-box-outline',
  'needle',
  'brain'
];

/**
 * PageLoader — A premium, beautiful loading overlay/center loader.
 * Features a revolving outer boundary and morphing medical icons in the center.
 *
 * Props:
 *   fullScreen (boolean) — If true, overlays the entire screen absolutely (default: true).
 *   backgroundColor (string) — Custom background color for fullScreen overlay.
 */
export default function PageLoader({ fullScreen = true, backgroundColor }) {
  const { theme } = useTheme();
  const [iconIndex, setIconIndex] = useState(0);
  
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 1. Boundary revolving animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 2. Morphing medical icons fade animation loop
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIconIndex((prev) => (prev + 1) % MEDICAL_ICONS.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  const loaderContent = (
    <View style={styles.loaderContainer}>
      <View style={styles.spinnerWrapper}>
        {/* Revolving outer boundary ring */}
        <Animated.View 
          style={[
            styles.revolvingCircle, 
            { 
              borderColor: `${theme.primary}15`,
              borderTopColor: theme.primary, 
              borderRightColor: theme.primary,
              transform: [{ rotate: spin }] 
            }
          ]} 
        />
        
        {/* Central static container holding morphing medical icon */}
        <View style={[styles.centerCard, { backgroundColor: theme.card }]}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <MaterialCommunityIcons 
              name={MEDICAL_ICONS[iconIndex]} 
              size={30} 
              color={theme.primary} 
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[
        styles.fullScreenOverlay, 
        { backgroundColor: backgroundColor || 'rgba(245, 247, 250, 0.96)' }
      ]}>
        {loaderContent}
      </View>
    );
  }

  return loaderContent;
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 999,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revolvingCircle: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3.5,
  },
  centerCard: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});
