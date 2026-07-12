import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SWIPE_THRESHOLD = 80;
const TRACK_WIDTH = width - 56;
const KNOB_SIZE = 58;
const BG = '#EEF2FF';
// rgba version needed for gradient — 'transparent' = rgba(0,0,0,0) which causes dark midtones
const BG_TRANSPARENT = 'rgba(238, 242, 255, 0)';

export default function WelcomeScreen({ navigation }) {
  const { setJustLoggedIn } = useAuth();
  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });
  const knobX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const maxX = TRACK_WIDTH - KNOB_SIZE - 8;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(gestureState.dx, maxX));
        knobX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= SWIPE_THRESHOLD) {
          Animated.timing(knobX, {
            toValue: maxX,
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            setSwiped(true);
            setJustLoggedIn(false);
            navigation.replace('Main');
          });
        } else {
          Animated.spring(knobX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const fillWidth = knobX.interpolate({
    inputRange: [0, maxX],
    outputRange: [KNOB_SIZE + 8, TRACK_WIDTH],
    extrapolate: 'clamp',
  });
  const labelOpacity = knobX.interpolate({
    inputRange: [0, maxX * 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Font loading overlay */}
      {!fontsLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      )}

      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobTopLeft} />

      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>Janki Care</Text>
        </View>
        <View style={styles.plusIcon}>
          <MaterialCommunityIcons name="stethoscope" size={24} color="#2563C4" />
        </View>
      </View>

      {/* Headline */}
      <View style={styles.headlineContainer}>
        <Text style={styles.headlineLine1}>Professional Care,</Text>
        <View style={styles.headlineLine2Row}>
          <View style={styles.pulseIconWrapper}>
            <MaterialCommunityIcons name="pulse" size={24} color="#4A90D9" />
          </View>
          <Text style={styles.headlineLine2}>Smooth Experience</Text>
        </View>
        <View style={styles.ecgRow}>
          <MaterialCommunityIcons name="heart-pulse" size={28} color="#4A90D9" style={{ opacity: 0.5 }} />
        </View>
      </View>

      {/* Doctor image area */}
      <View style={styles.doctorContainer}>
        <Image
          source={require('../../assets/dr_srinath.png')}
          style={styles.doctorImage}
          resizeMode="cover"
        />

        {/* Fade all edges: top fades headline into image, bottom fades image into bg */}
        <LinearGradient
          colors={[BG, BG_TRANSPARENT]}
          locations={[0, 1]}
          style={styles.imageGradientTop}
        />
        <LinearGradient
          colors={[BG_TRANSPARENT, BG]}
          locations={[0, 1]}
          style={styles.imageGradientBottom}
        />
        <LinearGradient
          colors={[BG, BG_TRANSPARENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.imageGradientLeft}
        />
        <LinearGradient
          colors={[BG_TRANSPARENT, BG]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.imageGradientRight}
        />
      </View>

      {/* Swipe bar */}
      <View style={styles.swipeWrapper}>
        <Animated.View style={[styles.swipeTrack, { width: fillWidth }]} />
        <Animated.View
          style={[styles.swipeKnob, { transform: [{ translateX: knobX }] }]}
          {...panResponder.panHandlers}
        >
          <FontAwesome5 name="capsules" size={22} color="#4A90D9" />
        </Animated.View>
        <Animated.Text style={[styles.swipeLabel, { opacity: labelOpacity }]}>
          Get Started
        </Animated.Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginRight: 16 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    overflow: 'hidden',
  },

  blobTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#C4D9FF',
    opacity: 0.65,
  },
  blobTopLeft: {
    position: 'absolute',
    top: 100,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#B8E6C4',
    opacity: 0.65,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
  },
  brandBadge: {
    backgroundColor: '#A8D5B0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  brandBadgeText: {
    color: '#1A4731',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  plusIcon: {
    backgroundColor: '#C4D9FF',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headlineContainer: {
    paddingHorizontal: 28,
    marginTop: 20,
  },
  headlineLine1: {
    fontSize: 38,
    fontFamily: 'Urbanist_700Bold',
    color: '#1A1A2E',
    letterSpacing: -0.8,
    lineHeight: 48,
  },
  headlineLine2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pulseIconWrapper: {
    marginRight: 8,
  },
  headlineLine2: {
    fontSize: 38,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#4A90D9',
    letterSpacing: -0.8,
    lineHeight: 48,
  },
  ecgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    height: 32,
    overflow: 'visible',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  doctorContainer: {
    flex: 1,
    marginTop: -8,
    overflow: 'hidden',
    position: 'relative',
  },
  doctorImage: {
    width: width,
    height: '100%',
    marginTop: -20,
  },

  // Fade overlays — one per edge so the image dissolves into the BG on all sides
  imageGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  imageGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  imageGradientLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 50,
  },
  imageGradientRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 50,
  },

  swipeWrapper: {
    marginHorizontal: 28,
    marginTop: -40,
    marginBottom: 44,
    height: KNOB_SIZE + 8,
    backgroundColor: '#5A8DEE',
    borderRadius: (KNOB_SIZE + 8) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  swipeTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#7AAFF5',
    borderRadius: (KNOB_SIZE + 8) / 2,
  },
  swipeKnob: {
    position: 'absolute',
    left: 4,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 10,
  },
  swipeLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.4,
    marginLeft: KNOB_SIZE + 12,
  },
});
