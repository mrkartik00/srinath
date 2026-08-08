import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  ScreenHeader,
  GlassCard,
  PressableButton,
  EmptyState,
  PageLoader,
} from '../components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPlans } from '../api/config';
import haptics from '../utils/haptics';

const SubscriptionScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activePlan, setActivePlan] = useState(null); // The one open in the bottom sheet
  const [selectedPlanId, setSelectedPlanId] = useState(null); // The one checked in the list
  const [hasActiveSubscription] = useState(false); // Dynamic active plan check
  const [isAnnual, setIsAnnual] = useState(false); // Toggle state

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPlans();
      const activePlans = (response?.data || []).filter((p) => p.isActive);
      setPlans(activePlans);
      if (activePlans.length > 0) {
        setSelectedPlanId(activePlans[0]._id);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, interval) => {
    const suffix = interval === 'yearly' || interval === 'year' ? '/yr' : '/mo';
    return `₹${price}${suffix}`;
  };

  const openPlan = (plan) => {
    haptics.medium();
    setActivePlan(plan);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closePlan = () => {
    haptics.light();
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setActivePlan(null));
  };

  const handleSelectPlan = (plan) => {
    haptics.selection();
    setSelectedPlanId(plan._id);
  };

  const sheetTranslate = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [700, 0],
  });

  const renderPlanCard = (plan) => {
    const isSelected = selectedPlanId === plan._id;
    // Using the app's theme primary color instead of hardcoded blue
    const activeColor = theme.primary;

    return (
      <TouchableOpacity
        key={plan._id}
        activeOpacity={0.9}
        onPress={() => handleSelectPlan(plan)}
        style={[
          styles.planCard,
          {
            backgroundColor: theme.card,
            borderColor: isSelected ? activeColor : theme.border,
            borderWidth: isSelected ? 1.5 : 1,
          }
        ]}
      >
        <View style={styles.planCardContent}>
          {/* Left Side: Details */}
          <View style={styles.planCardLeft}>
            <Text style={[styles.planCardName, { color: theme.textSecondary }]}>
              {plan.name.toUpperCase()}
            </Text>
            
            <Text style={[styles.planCardPrice, { color: theme.text }]}>
              {formatPrice(plan.price, plan.interval)}
            </Text>
            
            <Text style={[styles.planCardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {(plan.features || []).slice(0, 2).join(' and ')}
            </Text>
            
            <TouchableOpacity onPress={() => openPlan(plan)} activeOpacity={0.7} style={{ alignSelf: 'flex-start', marginTop: 12 }}>
              <Text style={[styles.learnMoreText, { color: activeColor }]}>Learn More</Text>
            </TouchableOpacity>
          </View>

          {/* Right Side: Check Circle */}
          <View style={styles.planCardRight}>
            {isSelected ? (
              <View style={[styles.checkCircleActive, { backgroundColor: activeColor }]}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
              </View>
            ) : (
              <View style={[styles.checkCircleInactive, { borderColor: theme.border }]} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Detail bottom sheet ───────────────────────────────────────
  const renderDetailSheet = () => {
    if (!activePlan) return null;

    return (
      <Modal transparent visible animationType="none" onRequestClose={closePlan}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={closePlan} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[
          styles.sheet,
          { backgroundColor: theme.card, paddingBottom: insets.bottom + 20 },
          { transform: [{ translateY: sheetTranslate }] },
        ]}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={[styles.sheetHeader, { backgroundColor: theme.primary + '11' }]}>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} onPress={closePlan}>
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.sheetBigIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="diamond" size={36} color="#FFFFFF" />
            </View>

            <Text style={[styles.sheetName, { color: theme.text }]}>{activePlan.name}</Text>

            <View style={styles.sheetPriceRow}>
              <Text style={[styles.sheetPriceBig, { color: theme.primary }]}>
                {formatPrice(activePlan.price, activePlan.interval)}
              </Text>
            </View>

            {activePlan.maxPatients && (
              <View style={[styles.maxPatientsPill, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="people" size={13} color={theme.primary} />
                <Text style={[styles.maxPatientsText, { color: theme.primary }]}>
                  Up to {activePlan.maxPatients} patients
                </Text>
              </View>
            )}
          </View>

          {/* Features */}
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>WHAT'S INCLUDED</Text>

            {(activePlan.features || []).map((feat, i) => (
              <View key={i} style={[styles.featureItem, { borderBottomColor: theme.border }]}>
                <View style={[styles.featureCheck, { backgroundColor: theme.primary }]}>
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                </View>
                <Text style={[styles.featureText, { color: theme.text }]}>{feat}</Text>
              </View>
            ))}

            {activePlan.description && (
              <>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 20 }]}>
                  ABOUT THIS PLAN
                </Text>
                <Text style={[styles.descText, { color: theme.textSecondary }]}>
                  {activePlan.description}
                </Text>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </Modal>
    );
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      <ScreenHeader
        title="Choose a Plan"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Dynamic Status Card */}
        <View style={[styles.statusCard, {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        }]}>
          <View style={[styles.statusIconWrap, {
            backgroundColor: hasActiveSubscription ? '#34C75922' : '#FF950022',
          }]}>
            <Ionicons
              name={hasActiveSubscription ? 'checkmark-circle' : 'time-outline'}
              size={24}
              color={hasActiveSubscription ? '#34C759' : '#FF9500'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: theme.text }]}>
              {hasActiveSubscription ? 'Subscription Active' : 'No Active Plan'}
            </Text>
            <Text style={[styles.statusSub, { color: theme.textSecondary }]}>
              {hasActiveSubscription
                ? 'You have full access to all features'
                : 'Choose a plan below to see full details'}
            </Text>
          </View>
        </View>

        {loading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState icon="card-outline" title="Unable to load plans" subtitle={error} />
        ) : plans.length === 0 ? (
          <EmptyState
            icon="pricetags-outline"
            title="No plans available"
            subtitle="Subscription plans will be available soon"
          />
        ) : (
          <View style={styles.plansContainer}>
            {plans.map(renderPlanCard)}
          </View>
        )}

        {/* Coming Soon Button */}
        {plans.length > 0 && (
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: theme.primary, opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={() => haptics.selection()}
          >
            <Text style={styles.continueButtonText}>Coming Soon</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {renderDetailSheet()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 12 },

  // Status card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  statusIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  statusTitle: { fontSize: 16, fontFamily: 'Urbanist_700Bold', marginBottom: 2 },
  statusSub: { fontSize: 12, fontFamily: 'Urbanist_600SemiBold' },

  plansContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardLeft: {
    flex: 1,
    paddingRight: 16,
  },
  planCardName: {
    fontSize: 12,
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  planCardPrice: {
    fontSize: 32,
    fontFamily: 'Urbanist_800ExtraBold',
    marginBottom: 8,
  },
  planCardDesc: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    lineHeight: 20,
  },
  learnMoreText: {
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
  },
  planCardRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  checkCircleInactive: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2,
  },

  continueButton: {
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Urbanist_700Bold',
  },

  // Modal backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  // Bottom sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    width: 44, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 0,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 20,
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetBigIcon: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetName: { fontSize: 26, fontFamily: 'Urbanist_800ExtraBold', marginBottom: 8, textAlign: 'center' },
  sheetPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  sheetPriceBig: { fontSize: 40, fontFamily: 'Urbanist_800ExtraBold', letterSpacing: -1 },
  maxPatientsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  maxPatientsText: { fontSize: 13, fontFamily: 'Urbanist_700Bold' },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 1.2,
  },

  sheetScroll: { maxHeight: 360 },
  sheetScrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },

  featureItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureCheck: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  featureText: { fontSize: 15, fontFamily: 'Urbanist_600SemiBold', flex: 1 },
  descText: { fontSize: 14, fontFamily: 'Urbanist_500Medium', lineHeight: 22, marginTop: 8 },

});

export default SubscriptionScreen;
