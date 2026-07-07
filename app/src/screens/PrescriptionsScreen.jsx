import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  GlassCard,
  PressableButton,
  ScreenHeader,
  StatusBadge,
  SegmentedControl,
  EmptyState,
  SkeletonList,
} from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import { getMyPrescriptions } from '../api/prescriptions';
import haptics from '../utils/haptics';

const PrescriptionsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState(0);

  const { fadeAnim, slideAnim } = useScreenAnimation();

  const filteredPrescriptions = prescriptions.filter((p) => {
    if (activeSegment === 0) {
      return p.status === 'active';
    }
    return p.status === 'completed' || p.status === 'cancelled';
  });

  const { staggerStyles } = useStaggerAnimation(filteredPrescriptions.length);

  const fetchPrescriptions = async () => {
    try {
      const response = await getMyPrescriptions();
      setPrescriptions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    haptics.light();
    setRefreshing(true);
    try {
      const response = await getMyPrescriptions();
      setPrescriptions(response.data || []);
    } catch (error) {
      console.error('Failed to refresh prescriptions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCardPress = (prescription) => {
    haptics.light();
    navigation.navigate('PrescriptionDetail', {
      id: prescription._id,
      prescription,
    });
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderPrescriptionCard = (prescription, index) => {
    const itemStyle = staggerStyles[index] || {};

    return (
      <Animated.View key={prescription._id} style={itemStyle}>
        <PressableButton onPress={() => handleCardPress(prescription)}>
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.diagnosis, { color: theme.text }]}>
                  {prescription.diagnosis}
                </Text>
                <StatusBadge status={prescription.status} />
              </View>
              <Text style={[styles.doctorName, { color: theme.textSecondary }]}>
                <Ionicons name="person-outline" size={14} color={theme.textSecondary} />{' '}
                Dr. {prescription.doctorId?.name || 'Unknown'}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <Ionicons name="medical-outline" size={16} color={theme.primary} />
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  {prescription.medicines?.length || 0} medicine
                  {(prescription.medicines?.length || 0) !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  {formatDate(prescription.issuedAt)}
                </Text>
              </View>
            </View>
          </GlassCard>
        </PressableButton>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={theme.gradientBackground}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScreenHeader title="Prescriptions" onBack={() => navigation.goBack()} />

        <SegmentedControl
          segments={['Active', 'Past']}
          selectedIndex={activeSegment}
          onChange={setActiveSegment}
        />

        {loading ? (
          <SkeletonList count={4} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
              />
            }
          >
            {filteredPrescriptions.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title={activeSegment === 0 ? 'No Active Prescriptions' : 'No Past Prescriptions'}
                subtitle={
                  activeSegment === 0
                    ? 'Your active prescriptions will appear here'
                    : 'Your completed or cancelled prescriptions will appear here'
                }
              />
            ) : (
              filteredPrescriptions.map((prescription, index) =>
                renderPrescriptionCard(prescription, index)
              )
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  diagnosis: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  doctorName: {
    fontSize: 14,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
  },
  bottomSpacer: {
    height: 120,
  },
});

export default PrescriptionsScreen;
