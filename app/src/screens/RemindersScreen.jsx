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
  SectionHeader,
  StatusBadge,
  SegmentedControl,
  EmptyState,
  SkeletonList,
  BottomSheet,
  Chip,
} from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import {
  getTodayReminders,
  acknowledgeReminder,
  snoozeReminder,
  missReminder,
} from '../api/reminders';
import haptics from '../utils/haptics';

const SNOOZE_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];

const getTimePeriod = (scheduledAt) => {
  const hour = new Date(scheduledAt).getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const formatTime = (scheduledAt) => {
  const date = new Date(scheduledAt);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const groupRemindersByPeriod = (reminders) => {
  const groups = { Morning: [], Afternoon: [], Evening: [] };
  reminders.forEach((reminder) => {
    const period = getTimePeriod(reminder.scheduledAt);
    groups[period].push(reminder);
  });
  return groups;
};

const RemindersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const screenAnimation = useScreenAnimation();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snoozeSheetVisible, setSnoozeSheetVisible] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState(null);

  const { getItemStyle, triggerStagger } = useStaggerAnimation(reminders.length);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await getTodayReminders();
      setReminders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    try {
      const response = await getTodayReminders();
      setReminders(response.data || []);
    } catch (error) {
      console.error('Failed to refresh reminders:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTaken = async (id) => {
    haptics.success();
    const previousReminders = [...reminders];
    setReminders((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: 'acknowledged' } : r))
    );
    try {
      await acknowledgeReminder(id);
    } catch (error) {
      setReminders(previousReminders);
      console.error('Failed to acknowledge reminder:', error);
    }
  };

  const handleSnoozePress = (id) => {
    setSelectedReminderId(id);
    setSnoozeSheetVisible(true);
  };

  const handleSnoozeConfirm = async (minutes) => {
    haptics.selection();
    const id = selectedReminderId;
    setSnoozeSheetVisible(false);
    setSelectedReminderId(null);

    const previousReminders = [...reminders];
    setReminders((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: 'snoozed' } : r))
    );
    try {
      await snoozeReminder(id, minutes);
    } catch (error) {
      setReminders(previousReminders);
      console.error('Failed to snooze reminder:', error);
    }
  };

  const handleMissed = async (id) => {
    haptics.error();
    const previousReminders = [...reminders];
    setReminders((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: 'missed' } : r))
    );
    try {
      await missReminder(id);
    } catch (error) {
      setReminders(previousReminders);
      console.error('Failed to mark reminder as missed:', error);
    }
  };

  const onBack = () => {
    navigation.goBack();
  };

  // Summary calculations
  const takenCount = reminders.filter((r) => r.status === 'acknowledged').length;
  const pendingCount = reminders.filter(
    (r) => r.status === 'pending' || r.status === 'sent'
  ).length;
  const missedCount = reminders.filter((r) => r.status === 'missed').length;

  const groupedReminders = groupRemindersByPeriod(reminders);

  const renderActionButtons = (reminder) => {
    const { _id, status } = reminder;

    if (status === 'pending' || status === 'sent') {
      return (
        <View style={styles.actionRow}>
          <PressableButton
            onPress={() => handleTaken(_id)}
            style={[styles.actionButton, { backgroundColor: theme.success + '20' }]}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.success} />
          </PressableButton>
          <PressableButton
            onPress={() => handleSnoozePress(_id)}
            style={[styles.actionButton, { backgroundColor: theme.warning + '20' }]}
          >
            <Ionicons name="time" size={20} color={theme.warning} />
          </PressableButton>
          <PressableButton
            onPress={() => handleMissed(_id)}
            style={[styles.actionButton, { backgroundColor: theme.danger + '20' }]}
          >
            <Ionicons name="close-circle" size={20} color={theme.danger} />
          </PressableButton>
        </View>
      );
    }

    if (status === 'acknowledged') {
      return (
        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle" size={18} color={theme.success} />
          <Text style={[styles.statusLabel, { color: theme.success }]}>Taken</Text>
        </View>
      );
    }

    if (status === 'missed') {
      return (
        <View style={styles.statusRow}>
          <Ionicons name="close-circle" size={18} color={theme.danger} />
          <Text style={[styles.statusLabel, { color: theme.danger }]}>Missed</Text>
        </View>
      );
    }

    if (status === 'snoozed') {
      return (
        <View style={styles.statusRow}>
          <Ionicons name="time" size={18} color={theme.warning} />
          <Text style={[styles.statusLabel, { color: theme.warning }]}>Snoozed</Text>
        </View>
      );
    }

    return null;
  };

  const renderReminderCard = (reminder, index) => {
    const animStyle = getItemStyle(index);

    return (
      <Animated.View key={reminder._id} style={animStyle}>
        <GlassCard style={styles.reminderCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={[styles.medicineName, { color: theme.text }]}>
                {reminder.medicineName}
              </Text>
              <Text style={[styles.dosageText, { color: theme.textSecondary }]}>
                {reminder.dosage}
              </Text>
              <Text style={[styles.timeText, { color: theme.textMuted }]}>
                {formatTime(reminder.scheduledAt)}
              </Text>
            </View>
            <StatusBadge status={reminder.status} />
          </View>
          {renderActionButtons(reminder)}
        </GlassCard>
      </Animated.View>
    );
  };

  const renderSections = () => {
    const periods = ['Morning', 'Afternoon', 'Evening'];
    let globalIndex = 0;

    return periods.map((period) => {
      const periodReminders = groupedReminders[period];
      if (periodReminders.length === 0) return null;

      const section = (
        <View key={period} style={styles.section}>
          <SectionHeader title={period} count={periodReminders.length} />
          {periodReminders.map((reminder) => {
            const card = renderReminderCard(reminder, globalIndex);
            globalIndex++;
            return card;
          })}
        </View>
      );

      return section;
    });
  };

  const renderSummary = () => (
    <GlassCard style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryRing, { borderColor: theme.success }]}>
            <Text style={[styles.summaryCount, { color: theme.success }]}>
              {takenCount}
            </Text>
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Taken
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryRing, { borderColor: theme.warning }]}>
            <Text style={[styles.summaryCount, { color: theme.warning }]}>
              {pendingCount}
            </Text>
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Pending
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryRing, { borderColor: theme.danger }]}>
            <Text style={[styles.summaryCount, { color: theme.danger }]}>
              {missedCount}
            </Text>
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Missed
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={theme.gradient}
        style={styles.container}
      >
        <ScreenHeader
          title="Reminders"
          subtitle="Today's schedule"
          onBack={onBack}
        />
        <SkeletonList count={5} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.container}
    >
      <Animated.View style={[styles.content, screenAnimation]}>
        <ScreenHeader
          title="Reminders"
          subtitle="Today's schedule"
          onBack={onBack}
        />

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
          {reminders.length === 0 ? (
            <EmptyState message="No reminders today" />
          ) : (
            <>
              {renderSummary()}
              {renderSections()}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>

      <BottomSheet
        visible={snoozeSheetVisible}
        onClose={() => {
          setSnoozeSheetVisible(false);
          setSelectedReminderId(null);
        }}
      >
        <View style={styles.snoozeSheet}>
          <Text style={[styles.snoozeTitle, { color: theme.text }]}>
            Snooze for
          </Text>
          <View style={styles.snoozeOptions}>
            {SNOOZE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onPress={() => handleSnoozeConfirm(option.value)}
                style={styles.snoozeChip}
              />
            ))}
          </View>
        </View>
      </BottomSheet>
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
    paddingTop: 8,
  },
  summaryCard: {
    marginBottom: 20,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  reminderCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  dosageText: {
    fontSize: 14,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 120,
  },
  snoozeSheet: {
    padding: 20,
  },
  snoozeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  snoozeOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  snoozeChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});

export default RemindersScreen;
