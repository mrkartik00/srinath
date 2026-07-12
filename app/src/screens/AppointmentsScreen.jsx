import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useTheme } from '../context/ThemeContext';
import {
  PressableButton,
  ScreenHeader,
  StatusBadge,
  SegmentedControl,
  EmptyState,
  SkeletonList,
  FAB,
  PageLoader,
} from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import { getMyAppointments } from '../api/appointments';
import haptics from '../utils/haptics';

const BG_COLOR = '#F5F7FA';
const PRIMARY_COLOR = '#223263';
const TEXT_SECONDARY = '#8F9BB3';
const BLUE_LIGHT = '#EEF2F8';

const AppointmentsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const screenAnimation = useScreenAnimation();

  const [selectedTab, setSelectedTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });

  const { getItemStyle, triggerStagger, resetAnimations } = useStaggerAnimation(appointments.length);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await getMyAppointments();
      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (Array.isArray(response?.data)) {
        list = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        list = response.data.data;
      }
      setAppointments(list);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const now = new Date();
  const upcomingAppointments = appointments.filter((apt) => new Date(apt.dateTime) >= now);
  const pastAppointments = appointments.filter((apt) => new Date(apt.dateTime) < now);

  const filteredAppointments = selectedTab === 0 ? upcomingAppointments : pastAppointments;
  const upcomingCount = upcomingAppointments.length;
  const pastCount = pastAppointments.length;

  useEffect(() => {
    if (appointments.length > 0) {
      resetAnimations();
      triggerStagger(filteredAppointments.length);
    }
  }, [selectedTab, appointments, filteredAppointments.length, resetAnimations, triggerStagger]);

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
        return PRIMARY_COLOR;
      case 'follow-up':
        return TEXT_SECONDARY;
      case 'checkup':
        return theme.warning;
      default:
        return TEXT_SECONDARY;
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  const renderAppointmentCard = (appointment, index) => {
    const { date, time } = formatDateTime(appointment.dateTime);
    const animatedStyle = getItemStyle(index);

    return (
      <Animated.View key={appointment._id} style={animatedStyle}>
        <PressableButton onPress={() => handleCardPress(appointment)}>
          <View style={styles.appointmentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.dateTimeContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={PRIMARY_COLOR}
                />
                <Text style={styles.dateText}>
                  {date}
                </Text>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={TEXT_SECONDARY}
                  style={styles.timeIcon}
                />
                <Text style={styles.timeText}>
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
                  color={TEXT_SECONDARY}
                />
                <Text style={styles.doctorName}>
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
                      color={TEXT_SECONDARY}
                    />
                    <Text style={styles.durationText}>
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
                color={TEXT_SECONDARY}
              />
            </View>
          </View>
        </PressableButton>
      </Animated.View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <PageLoader />;
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
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: screenAnimation.fadeAnim, transform: [{ translateY: screenAnimation.slideAnim }] }]}>
        <ScreenHeader title="Appointments" />

        <SegmentedControl
          segments={['Upcoming', 'Past']}
          activeIndex={selectedTab}
          onChange={setSelectedTab}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PRIMARY_COLOR}
              colors={[PRIMARY_COLOR]}
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
        color={PRIMARY_COLOR}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
    position: 'relative',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
    marginLeft: 6,
  },
  timeIcon: {
    marginLeft: 12,
  },
  timeText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
    marginLeft: 4,
  },
  cardBody: {
    gap: 12,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: 'Urbanist_700Bold',
    textTransform: 'capitalize',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
  },
  cardArrow: {
    position: 'absolute',
    right: 22,
    top: 50,
  },
  bottomSpacer: {
    height: 120,
  },
  fab: {
    position: 'absolute',
    bottom: 130,
    right: 20,
  },
});

export default AppointmentsScreen;
