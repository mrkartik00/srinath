import React, { useState, useEffect, useCallback } from 'react';
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
  FAB,
} from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import { getMyAppointments } from '../api/appointments';
import haptics from '../utils/haptics';

const AppointmentsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const screenAnimation = useScreenAnimation();

  const [selectedTab, setSelectedTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { getItemStyle, triggerStagger } = useStaggerAnimation(appointments.length);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await getMyAppointments();
      if (response?.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    haptics.light();
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  const handleCardPress = (appointment) => {
    haptics.light();
    navigation.navigate('AppointmentDetail', { id: appointment._id });
  };

  const handleBookAppointment = () => {
    navigation.navigate('BookAppointment');
  };

  const now = new Date();

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.dateTime);
    if (selectedTab === 0) {
      return aptDate >= now;
    }
    return aptDate < now;
  });

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const dayOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return {
      date: date.toLocaleDateString('en-US', dayOptions),
      time: date.toLocaleTimeString('en-US', timeOptions),
    };
  };

  const getTypeBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'consultation':
        return theme.primary;
      case 'follow-up':
        return theme.textSecondary;
      case 'checkup':
        return theme.warning;
      default:
        return theme.textSecondary;
    }
  };

  const renderAppointmentCard = (appointment, index) => {
    const { date, time } = formatDateTime(appointment.dateTime);
    const animatedStyle = getItemStyle(index);

    return (
      <Animated.View key={appointment._id} style={animatedStyle}>
        <PressableButton onPress={() => handleCardPress(appointment)}>
          <GlassCard style={styles.appointmentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.dateTimeContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.dateText, { color: theme.text }]}>
                  {date}
                </Text>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={theme.textSecondary}
                  style={styles.timeIcon}
                />
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {time}
                </Text>
              </View>
              <StatusBadge status={appointment.status} />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.doctorRow}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={theme.textSecondary}
                />
                <Text style={[styles.doctorName, { color: theme.text }]}>
                  {appointment.doctorId?.name || 'Unknown Doctor'}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: getTypeBadgeColor(appointment.type) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: getTypeBadgeColor(appointment.type) },
                    ]}
                  >
                    {appointment.type}
                  </Text>
                </View>

                {appointment.duration && (
                  <View style={styles.durationContainer}>
                    <Ionicons
                      name="hourglass-outline"
                      size={14}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[styles.durationText, { color: theme.textSecondary }]}
                    >
                      {appointment.duration} min
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardArrow}>
              <Ionicons
                name="chevron-forward"
                size={20}
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
      return <SkeletonList count={5} />;
    }

    if (filteredAppointments.length === 0) {
      return (
        <EmptyState
          icon="calendar-outline"
          title={selectedTab === 0 ? 'No upcoming appointments' : 'No past appointments'}
          subtitle={
            selectedTab === 0
              ? 'Book your first appointment'
              : 'Your past appointments will appear here'
          }
          actionLabel={selectedTab === 0 ? 'Book Appointment' : null}
          onAction={selectedTab === 0 ? handleBookAppointment : null}
        />
      );
    }

    return filteredAppointments.map((appointment, index) =>
      renderAppointmentCard(appointment, index)
    );
  };

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.container}
    >
      <Animated.View style={[styles.content, screenAnimation]}>
        <ScreenHeader title="Appointments" />

        <SegmentedControl
          tabs={['Upcoming', 'Past']}
          selectedIndex={selectedTab}
          onTabPress={setSelectedTab}
          style={styles.segmentedControl}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {renderContent()}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>

      <FAB
        icon="add"
        onPress={handleBookAppointment}
        style={styles.fab}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  segmentedControl: {
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  appointmentCard: {
    marginBottom: 12,
    padding: 16,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  timeIcon: {
    marginLeft: 12,
  },
  timeText: {
    fontSize: 13,
    marginLeft: 4,
  },
  cardBody: {
    gap: 10,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
  },
  cardArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  bottomSpacer: {
    height: 120,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
  },
});

export default AppointmentsScreen;
