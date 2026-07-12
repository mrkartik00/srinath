import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  ScreenHeader,
  GlassCard,
  PressableButton,
  EmptyState,
  SkeletonList,
  PageLoader,
} from '../components/ui';
import { useScreenAnimation } from '../hooks/useAnimations';
import { getPlans } from '../api/config';
import haptics from '../utils/haptics';

const SubscriptionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const screenAnimation = useScreenAnimation();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPlans();
      const activePlans = (response?.data || []).filter((p) => p.isActive);
      setPlans(activePlans);
    } catch (err) {
      setError(err?.message || 'Failed to load plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, interval) => {
    const amount = price / 100;
    const suffix = interval === 'yearly' || interval === 'year' ? '/yr' : '/mo';
    return `₹${amount}${suffix}`;
  };

  const handleCardTap = (plan) => {
    haptics.light();
    setSelectedPlan(selectedPlan === plan._id ? null : plan._id);
  };

  const handleSubscribeTap = () => {
    haptics.selection();
  };

  const renderStatusSection = () => (
    <GlassCard style={styles.statusCard}>
      <View style={styles.statusRow}>
        <Ionicons
          name={hasActiveSubscription ? 'checkmark-circle' : 'alert-circle-outline'}
          size={24}
          color={hasActiveSubscription ? '#4CAF50' : theme.textSecondary}
        />
        <View style={styles.statusTextContainer}>
          {hasActiveSubscription ? (
            <>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
              <Text style={[styles.statusSubtext, { color: theme.textSecondary }]}>
                Your subscription is active
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.statusTitle, { color: theme.text }]}>
                No active plan
              </Text>
              <Text style={[styles.statusSubtext, { color: theme.textSecondary }]}>
                Choose a plan below to unlock premium features
              </Text>
            </>
          )}
        </View>
      </View>
    </GlassCard>
  );

  const renderPlanCard = (plan, index) => {
    const isPopular = index === 0 || plan.recommended;
    const isSelected = selectedPlan === plan._id;

    return (
      <PressableButton
        key={plan._id}
        onPress={() => handleCardTap(plan)}
        style={styles.planPressable}
      >
        <GlassCard
          style={[
            styles.planCard,
            isSelected && { borderColor: theme.primary, borderWidth: 2 },
          ]}
        >
          {isPopular && (
            <View style={styles.popularBadge}>
              <Ionicons name="star" size={12} color="#FFF" />
              <Text style={styles.popularBadgeText}>Most Popular</Text>
            </View>
          )}

          <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>

          <Text style={[styles.planPrice, { color: theme.primary }]}>
            {formatPrice(plan.price, plan.interval)}
          </Text>

          {plan.maxPatients && (
            <Text style={[styles.maxPatients, { color: theme.textSecondary }]}>
              Up to {plan.maxPatients} patients
            </Text>
          )}

          <View style={styles.featuresContainer}>
            {(plan.features || []).map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={[styles.featureText, { color: theme.text }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          <PressableButton
            onPress={handleSubscribeTap}
            disabled
            style={styles.subscribeCta}
          >
            <LinearGradient
              colors={['#9E9E9E', '#757575']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              <Ionicons name="diamond-outline" size={18} color="#FFF" />
              <Text style={styles.subscribeText}>Coming Soon</Text>
            </LinearGradient>
          </PressableButton>
        </GlassCard>
      </PressableButton>
    );
  };

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.container}
    >
      <ScreenHeader
        title="Subscription"
        subtitle="Choose your plan"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            icon="card-outline"
            title="Unable to load plans"
            subtitle={error}
          />
        ) : plans.length === 0 ? (
          <EmptyState
            icon="pricetags-outline"
            title="No plans available"
            subtitle="Subscription plans will be available soon"
          />
        ) : (
          <>
            {renderStatusSection()}
            {plans.map((plan, index) => renderPlanCard(plan, index))}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statusCard: {
    marginBottom: 20,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planPressable: {
    marginBottom: 16,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  maxPatients: {
    fontSize: 13,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  subscribeCta: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  subscribeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 120,
  },
});

export default SubscriptionScreen;
