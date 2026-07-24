import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import * as WebBrowser from 'expo-web-browser';
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
import { joinVideoCall } from '../api/video';
import haptics from '../utils/haptics';

const BG_COLOR = '#F5F7FA';
const PRIMARY_COLOR = '#223263';
const TEXT_SECONDARY = '#8F9BB3';
const BLUE_LIGHT = '#EEF2F8';

const AppointmentDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { theme } = useTheme();
  const { fadeAnim, slideAnim } = useScreenAnimation();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [joiningCall, setJoiningCall] = useState(false);

  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  // Auto-refresh every 5s when waiting for doctor to start the video call
  useEffect(() => {
    if (!appointment) return;
    const isWaiting = appointment.type === 'virtual' && 
      (appointment.status === 'scheduled' || appointment.status === 'in_progress') &&
      appointment.video?.status !== 'live';
    
    if (!isWaiting) return;

    const interval = setInterval(fetchAppointment, 5000);
    return () => clearInterval(interval);
  }, [appointment?.status, appointment?.video?.status]);

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

  const handleCancelPress = () => {
    haptics.heavy();
    setShowCancelSheet(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await cancelAppointment(id, { reason: 'Patient cancelled' });
      haptics.success();
      setShowCancelSheet(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleJoinVideoCall = async () => {
    try {
      setJoiningCall(true);
      haptics.medium();
      const response = await joinVideoCall(id);
      const { token, roomId } = response.data;
      // Open the video call in the in-app browser using the web client
      // The web VideoRoom handles WebRTC via VideoSDK
      const clientUrl = 'https://janki.care';
      const patientName = appointment?.patientId?.userId?.name || 'Patient';
      // Use the guest join page which works great in mobile browsers
      const videoUrl = `${clientUrl}/join/mobile-auth?token=${encodeURIComponent(token)}&roomId=${encodeURIComponent(roomId)}&name=${encodeURIComponent(patientName)}`;
      await WebBrowser.openBrowserAsync(videoUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: '#0f172a',
        controlsColor: '#ffffff',
      });
      // Refresh appointment after returning from browser
      fetchAppointment();
    } catch (error) {
      const msg = typeof error === 'string' ? error : error?.message || 'Unable to join video call';
      Alert.alert('Video Call', msg);
    } finally {
      setJoiningCall(false);
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
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
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
          <Ionicons name="alert-circle-outline" size={48} color={TEXT_SECONDARY} />
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
            <StatusBadge status={appointment.status} size="md" />
          </View>

          {/* Appointment Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>
              Appointment Details
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} />
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
              <Ionicons name="person-outline" size={20} color={PRIMARY_COLOR} />
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
              <Ionicons name="medical-outline" size={20} color={PRIMARY_COLOR} />
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
              <Ionicons name="time-outline" size={20} color={PRIMARY_COLOR} />
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
                <Ionicons name="document-text-outline" size={20} color={PRIMARY_COLOR} />
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
          {appointment.type === 'virtual' && appointment.video?.status === 'live' && (
            <PressableButton
              onPress={handleJoinVideoCall}
              disabled={joiningCall}
              style={styles.joinCallButton}
            >
              <Ionicons name="videocam" size={20} color="#FFFFFF" />
              <Text style={styles.joinCallButtonText}>
                {joiningCall ? 'Connecting...' : 'Join Video Call'}
              </Text>
            </PressableButton>
          )}

          {/* Waiting for doctor indicator */}
          {appointment.type === 'virtual' && 
           (appointment.status === 'scheduled' || appointment.status === 'in_progress') && 
           appointment.video?.status !== 'live' && (
            <View style={styles.waitingCard}>
              <Ionicons name="videocam-outline" size={24} color={TEXT_SECONDARY} />
              <Text style={styles.waitingText}>
                Your doctor will start the video call when ready
              </Text>
            </View>
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
            style={[styles.keepButton, { borderColor: PRIMARY_COLOR }]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
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
    color: TEXT_SECONDARY,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
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
    color: TEXT_SECONDARY,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
  },
  notesText: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
    lineHeight: 24,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 12,
  },
  joinCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 12,
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinCallButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BLUE_LIGHT,
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  waitingText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
    lineHeight: 20,
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
    color: PRIMARY_COLOR,
    marginTop: 8,
  },
  sheetDescription: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
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
    color: PRIMARY_COLOR,
  },
});

export default AppointmentDetailScreen;
