import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useTheme } from '../context/ThemeContext';
import {
  ScreenHeader,
  StatusBadge,
  SkeletonList,
  PressableButton,
  BottomSheet,
} from '../components/ui';
import { useScreenAnimation } from '../hooks/useAnimations';
import { getAppointmentById, cancelAppointment } from '../api/appointments';
import haptics from '../utils/haptics';



const AppointmentDetailScreen = ({ route, navigation }) => {
  const id = route.params?.id || route.params?.appointmentId;
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { fadeAnim, slideAnim } = useScreenAnimation();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);

  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentById(id);
      setAppointment(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinVideo = () => {
    haptics.medium();
    navigation.navigate('VideoCall', {
      appointmentId: id,
      doctorName: appointment?.doctorId?.name || 'Doctor',
    });
  };

  const handleCancelPress = () => {
    haptics.heavy();
    setShowCancelSheet(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await cancelAppointment(id, { cancellationReason: 'Patient cancelled', reason: 'Patient cancelled' });
      haptics.success();
      setShowCancelSheet(false);
      navigation.goBack();
    } catch (error) {
      const msg =
        (Array.isArray(error) && error.join('\n')) ||
        (typeof error === 'string' && error) ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to cancel appointment. Please try again.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Appointment" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <SkeletonList count={3} />
        </View>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Appointment" onBack={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
          <Text style={styles.emptyText}>
            Appointment not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Appointment" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <StatusBadge status={getEffectiveAppointmentStatus(appointment)} size="md" />
          </View>

          {/* Appointment Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>
              Appointment Details
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  Date & Time
                </Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(appointment.dateTime)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  Doctor
                </Text>
                <Text style={styles.infoValue}>
                  {appointment.doctorId?.name || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="medical-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  Type
                </Text>
                <Text style={styles.infoValue}>
                  {appointment.type || 'General'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  Duration
                </Text>
                <Text style={styles.infoValue}>
                  {formatDuration(appointment.duration)}
                </Text>
              </View>
            </View>

            {appointment.reason ? (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>
                    Reason
                  </Text>
                  <Text style={styles.infoValue}>
                    {appointment.reason}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Notes Card */}
          {appointment.notes ? (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>
                {appointment.notes}
              </Text>
            </View>
          ) : null}

          {/* Join Video Call Button */}
          {canJoinCall(appointment) && (
            <PressableButton
              onPress={handleJoinVideo}
              style={styles.joinVideoButton}
            >
              <Ionicons name="videocam" size={22} color="#FFFFFF" />
              <Text style={styles.joinVideoButtonText}>
                Join Video Consultation
              </Text>
            </PressableButton>
          )}

          {/* Cancel Button */}
          {appointment.status === 'scheduled' && (
            <PressableButton
              onPress={handleCancelPress}
              style={[styles.cancelButton, { backgroundColor: '#FF6B6B' + '15' }]}
            >
              <Ionicons name="close-circle-outline" size={20} color={'#FF6B6B'} />
              <Text style={[styles.cancelButtonText, { color: '#FF6B6B' }]}>
                Cancel Appointment
              </Text>
            </PressableButton>
          )}
        </Animated.View>
      </ScrollView>

      {/* Cancel Confirmation Bottom Sheet */}
      <BottomSheet
        visible={showCancelSheet}
        onClose={() => setShowCancelSheet(false)}
      >
        <View style={styles.sheetContent}>
          <Ionicons name="warning-outline" size={48} color={'#FF6B6B'} />
          <Text style={styles.sheetTitle}>
            Cancel Appointment?
          </Text>
          <Text style={styles.sheetDescription}>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </Text>

          <PressableButton
            onPress={handleConfirmCancel}
            loading={cancelling}
            style={[styles.confirmCancelButton, { backgroundColor: '#FF6B6B' }]}
          >
            <Text style={styles.confirmCancelText}>Yes, Cancel Appointment</Text>
          </PressableButton>

          <PressableButton
            onPress={() => setShowCancelSheet(false)}
            style={[styles.keepButton, { borderColor: theme.primary }]}
          >
            <Text style={styles.keepButtonText}>
              Keep Appointment
            </Text>
          </PressableButton>
        </View>
      </BottomSheet>
    </View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  infoCard: {
    backgroundColor: theme.card,
    padding: 24,
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
    color: theme.text,
  },
  notesText: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    lineHeight: 24,
  },
  joinVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    marginBottom: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  joinVideoButtonText: {
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFFFFF',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
  },
  sheetContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
    marginTop: 8,
  },
  sheetDescription: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  confirmCancelButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
  },
  keepButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  keepButtonText: {
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
  },
});

export default AppointmentDetailScreen;
