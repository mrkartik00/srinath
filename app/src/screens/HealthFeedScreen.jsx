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
  ScreenHeader,
  GlassCard,
  PressableButton,
  EmptyState,
  SkeletonList,
  Chip,
} from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import haptics from '../utils/haptics';
import api from '../api/axios';

const CATEGORY_COLORS = {
  nutrition: '#4CAF50',
  exercise: '#2196F3',
  medication: '#FF9800',
  lifestyle: '#9C27B0',
};

const HealthFeedScreen = () => {
  const { theme } = useTheme();
  const screenAnimation = useScreenAnimation();

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  const { getItemStyle, triggerStagger } = useStaggerAnimation(updates.length);

  useEffect(() => {
    fetchHealthUpdates();
  }, []);

  const fetchHealthUpdates = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(false);

      const response = await api.get('/api/v1/my/health-updates');
      setUpdates(response?.data?.data || response?.data || []);
    } catch (err) {
      setError(true);
      setUpdates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchHealthUpdates(true);
  };

  const handleCardExpand = (id) => {
    haptics.light();
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleBookmark = () => {
    haptics.selection();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderUpdateCard = (update, index) => {
    const isExpanded = expandedCards[update._id];
    const categoryColor = CATEGORY_COLORS[update.category] || theme.primary;
    const animStyle = getItemStyle(index);

    return (
      <Animated.View key={update._id} style={animStyle}>
        <PressableButton onPress={() => handleCardExpand(update._id)}>
          <GlassCard style={styles.updateCard}>
            <View style={styles.cardHeader}>
              <Chip
                label={update.category || 'general'}
                color={categoryColor}
                style={styles.categoryChip}
              />
              {!update.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
            </View>

            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {update.title}
            </Text>

            <Text
              style={[styles.cardBody, { color: theme.textSecondary }]}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {update.body || update.content}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
                {formatDate(update.createdAt || update.date)}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.textSecondary}
              />
            </View>
          </GlassCard>
        </PressableButton>
      </Animated.View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <SkeletonList count={4} />;
    }

    if (error || updates.length === 0) {
      return (
        <EmptyState
          icon="leaf-outline"
          title="Health tips coming soon"
          subtitle="Personalized wellness content will appear here once available"
        />
      );
    }

    return updates.map((update, index) => renderUpdateCard(update, index));
  };

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.container}
    >
      <View style={styles.headerWrapper}>
        <ScreenHeader
          title="Health Feed"
          subtitle="Daily wellness tips"
          rightIcon="bookmark-outline"
          onRightPress={handleBookmark}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {renderContent()}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  updateCard: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 120,
  },
});

export default HealthFeedScreen;
