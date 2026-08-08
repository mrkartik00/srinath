import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  PressableButton,
  ScreenHeader,
  StatusBadge,
  SegmentedControl,
  EmptyState,
  SkeletonList,
  FAB,
  PageLoader,
  Avatar,
} from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import { getMyAppointments } from '../api/appointments';
import haptics from '../utils/haptics';



const AppointmentsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const screenAnimation = useScreenAnimation();

  const [selectedTab, setSelectedTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });

  const { getItemStyle, triggerStagger, resetAnimations } = useStaggerAnimation(appointments.length);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await getMyAppointments({ limit: 100 });
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

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const getEffectiveAppointmentStatus = (apt) => {
    if (!apt) return 'scheduled';
    if (apt.status === 'cancelled') return 'cancelled';
    if (apt.status === 'completed') return 'completed';
    if (apt.video?.status === 'ended' || apt.video?.endedAt) return 'completed';

    const nowTime = Date.now();
    const startTime = new Date(apt.dateTime).getTime();
    const duration = (apt.duration || 30) * 60000;
    const endTime = startTime + duration;

    if (nowTime > endTime) {
      return 'completed';
    }

    return apt.status;
  };

  const upcomingAppointments = useMemo(() => appointments
    .filter((apt) => {
      const st = getEffectiveAppointmentStatus(apt);
      return st === 'scheduled' || st === 'in_progress';
    })
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)), [appointments]);

  const pastAppointments = useMemo(() => appointments
    .filter((apt) => {
      const st = getEffectiveAppointmentStatus(apt);
      return st === 'completed' || st === 'cancelled';
    })
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)), [appointments]);

  const filteredAppointments = useMemo(() => {
    let list = selectedTab === 0 ? upcomingAppointments : pastAppointments;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(apt => {
        const docName = (apt.doctorId?.name || '').toLowerCase();
        const type = (apt.type || '').toLowerCase();
        const status = (getEffectiveAppointmentStatus(apt) || '').toLowerCase();
        const reason = (apt.reason || apt.notes || '').toLowerCase();
        
        return docName.includes(q) || type.includes(q) || status.includes(q) || reason.includes(q);
      });
    }
    return list;
  }, [selectedTab, upcomingAppointments, pastAppointments, searchQuery]);

  useEffect(() => {
    if (appointments.length > 0) {
      resetAnimations();
      triggerStagger(filteredAppointments.length);
    }
  }, [selectedTab, appointments, filteredAppointments.length, resetAnimations, triggerStagger, searchQuery]);

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
        return theme.primary;
      case 'follow-up':
        return theme.textSecondary;
      case 'checkup':
        return theme.warning;
      default:
        return theme.textSecondary;
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const canJoinCall = (apt) => {
    if (!apt) return false;
    const st = getEffectiveAppointmentStatus(apt);
    if (st === 'completed' || st === 'cancelled' || apt.video?.status === 'ended') return false;
    if (apt.video?.status === 'live' || apt.status === 'in_progress') return true;

    const nowTime = Date.now();
    const startTime = new Date(apt.dateTime).getTime();
    const duration = (apt.duration || 30) * 60000;
    const endTime = startTime + duration;

    return nowTime >= startTime - 5 * 60000 && nowTime <= endTime;
  };

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
                  color={theme.primary}
                />
                <Text style={styles.dateText}>
                  {date}
                </Text>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={theme.primary}
                  style={styles.timeIcon}
                />
                <Text style={styles.timeText}>
                  {time}
                </Text>
              </View>
              <StatusBadge status={getEffectiveAppointmentStatus(appointment)} size="sm" />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.doctorInfo}>
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
                      color={theme.textSecondary}
                    />
                    <Text style={styles.durationText}>
                      {appointment.duration} min
                    </Text>
                  </View>
                )}
                {canJoinCall(appointment) && (
                  <PressableButton
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      haptics.medium();
                      navigation.navigate('VideoCall', {
                        appointmentId: appointment._id,
                        doctorName: appointment.doctorId?.name || 'Doctor',
                      });
                    }}
                    style={styles.cardJoinVideoButton}
                  >
                    <Ionicons name="videocam" size={14} color="#FFFFFF" />
                    <Text style={styles.cardJoinVideoText}>Join Call</Text>
                  </PressableButton>
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
          </View>
        </PressableButton>
      </Animated.View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <SkeletonList count={4} />;
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
        
        {/* Custom Header matching Inbox */}
        <View style={styles.customHeader}>
          <View style={styles.headerLeft}>
            <Avatar uri={user?.avatar} name={user?.name || 'User'} size={48} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.inboxText}>Appointments</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.circleIconBtn} onPress={() => setSearchVisible(!searchVisible)}>
              <Ionicons name="search-outline" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {searchVisible && (
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
              placeholder="Search appointments..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

        <View style={styles.segmentedWrapper}>
          <SegmentedControl
            segments={['Upcoming', 'Past']}
            activeIndex={selectedTab}
            onChange={setSelectedTab}
          />
        </View>

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
        color={theme.primary}
      />
    </View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontFamily: 'Urbanist_600SemiBold',
  },
  inboxText: {
    fontSize: 24,
    color: theme.text,
    fontFamily: 'Urbanist_700Bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInput: {
    height: 46,
    borderRadius: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
  },
  segmentedWrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 8,
  },
  appointmentCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
    position: 'relative',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: Platform.OS === 'android' ? 2 : 8,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: theme.border,
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
    color: theme.primary,
    marginLeft: 6,
  },
  timeIcon: {
    marginLeft: 12,
  },
  timeText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginLeft: 4,
  },
  cardBody: {
    gap: 12,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
    color: theme.text,
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
    color: theme.textSecondary,
  },
  cardJoinVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  cardJoinVideoText: {
    fontSize: 13,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFFFFF',
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
