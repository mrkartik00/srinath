import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  ScreenHeader,
  GlassCard,
  StatusBadge,
  SkeletonList,
  PressableButton,
  BottomSheet,
} from '../components/ui';
import { useScreenAnimation } from '../hooks/useAnimations';
import { getAppointmentById, cancelAppointment } from '../api/appointments';
import haptics from '../utils/haptics';

const AppointmentDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { theme } = useTheme();
  const { fadeAnim, slideAnim } = useScreenAnimation();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);

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

  if (loading) {
    return (
      <LinearGradient
        colors={theme.gradient}
        style={styles.container}
      >
        <ScreenHeader title="Appointment" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <SkeletonList count={3} />
        </View>
      </LinearGradient>
    );
  }

  if (!appointment) {
    return (
      <LinearGradient
        colors={theme.gradient}
        style={styles.container}
      >
        <ScreenHeader title="Appointment" onBack={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Appointment not found
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.container}
    >
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
          <GlassCard style={styles.infoCard}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Appointment Details
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                  Date & Time
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {formatDateTime(appointment.dateTime)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                  Doctor
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {appointment.doctorId?.name || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="medical-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                  Type
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {appointment.type || 'General'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                  Duration
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {formatDuration(appointment.duration)}
                </Text>
              </View>
            </View>

            {appointment.reason ? (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                    Reason
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {appointment.reason}
                  </Text>
                </View>
              </View>
            ) : null}
          </GlassCard>

          {/* Notes Card */}
          {appointment.notes ? (
            <GlassCard style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
              <Text style={[styles.notesText, { color: theme.textMuted }]}>
                {appointment.notes}
              </Text>
            </GlassCard>
          ) : null}

          {/* Cancel Button */}
          {appointment.status === 'scheduled' && (
            <PressableButton
              onPress={handleCancelPress}
              style={[styles.cancelButton, { backgroundColor: theme.error + '15' }]}
            >
              <Ionicons name="close-circle-outline" size={20} color={theme.error} />
              <Text style={[styles.cancelButtonText, { color: theme.error }]}>
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
          <Ionicons name="warning-outline" size={48} color={theme.error} />
          <Text style={[styles.sheetTitle, { color: theme.text }]}>
            Cancel Appointment?
          </Text>
          <Text style={[styles.sheetDescription, { color: theme.textMuted }]}>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </Text>

          <PressableButton
            onPress={handleConfirmCancel}
            loading={cancelling}
            style={[styles.confirmCancelButton, { backgroundColor: theme.error }]}
          >
            <Text style={styles.confirmCancelText}>Yes, Cancel Appointment</Text>
          </PressableButton>

          <PressableButton
            onPress={() => setShowCancelSheet(false)}
            style={[styles.keepButton, { borderColor: theme.border }]}
          >
            <Text style={[styles.keepButtonText, { color: theme.text }]}>
              Keep Appointment
            </Text>
          </PressableButton>
        </View>
      </BottomSheet>
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
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  infoCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  sheetDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  confirmCancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  keepButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  keepButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentDetailScreen;
