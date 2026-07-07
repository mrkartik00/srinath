import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, Alert, StyleSheet, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeader, GlassCard, PressableButton, Avatar, Chip, EmptyState, SkeletonList } from '../components/ui';
import { getDoctors, getConstants } from '../api/config';
import { createAppointment } from '../api/appointments';
import { haptics } from '../utils/haptics';
import { useScreenAnimation } from '../hooks/useAnimations';

/**
 * BookAppointmentScreen — multi-step appointment booking flow.
 *
 * Steps:
 *   1. Select Doctor (scrollable list or pre-selected via route params)
 *   2. Appointment Type (from constants API)
 *   3. Date + Time Slot selection
 *   4. Reason / Notes
 *   5. Review + Confirm
 */
export default function BookAppointmentScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { fadeAnim, slideAnim } = useScreenAnimation();

  // ─── State ──────────────────────────────────────────────────────
  const [doctors, setDoctors] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState(route?.params?.doctor || null);
  const [selectedType, setSelectedType] = useState(null);
  const [dateText, setDateText] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────
  useEffect(() => {
    getDoctors()
      .then((res) => {
        const list = res?.data || res || [];
        setDoctors(list);
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));

    getConstants()
      .then((res) => {
        const data = res?.data || res || {};
        setAppointmentTypes(data.appointmentTypes || []);
      })
      .catch(() => setAppointmentTypes([]))
      .finally(() => setLoadingTypes(false));
  }, []);

  // ─── Derived ────────────────────────────────────────────────────
  const availableSlots = React.useMemo(() => {
    if (!selectedDoctor?.availableSlots || !dateText) return [];
    // availableSlots may be keyed by date or be a flat array
    if (Array.isArray(selectedDoctor.availableSlots)) {
      return selectedDoctor.availableSlots;
    }
    return selectedDoctor.availableSlots[dateText] || [];
  }, [selectedDoctor, dateText]);

  const dateTime = React.useMemo(() => {
    if (!dateText) return null;
    if (selectedSlot) return `${dateText}T${selectedSlot}`;
    return `${dateText}T09:00`;
  }, [dateText, selectedSlot]);

  // ─── Handlers ───────────────────────────────────────────────────
  const handleSelectDoctor = (doc) => {
    haptics.selection();
    setSelectedDoctor(doc);
    // Reset slot when doctor changes
    setSelectedSlot(null);
  };

  const handleSelectType = (type) => {
    haptics.selection();
    setSelectedType(type);
  };

  const handleDateChange = (text) => {
    haptics.light();
    setDateText(text);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (slot) => {
    haptics.light();
    setSelectedSlot(slot);
  };

  const handleBook = async () => {
    // Validation
    if (!selectedDoctor) {
      haptics.error();
      return Alert.alert('Missing Info', 'Please select a doctor.');
    }
    if (!selectedType) {
      haptics.error();
      return Alert.alert('Missing Info', 'Please select an appointment type.');
    }
    if (!dateTime) {
      haptics.error();
      return Alert.alert('Missing Info', 'Please enter a date and time.');
    }

    haptics.medium();
    setSubmitting(true);

    try {
      await createAppointment({
        doctorId: selectedDoctor._id || selectedDoctor.id,
        type: selectedType.key || selectedType.value,
        dateTime,
        duration: 30,
        reason: reason.trim() || undefined,
      });
      haptics.success();
      Alert.alert('Booked!', 'Your appointment has been scheduled.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      haptics.error();
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (Array.isArray(err) ? err.join('\n') : 'Something went wrong. Please try again.');
      Alert.alert('Booking Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <LinearGradient colors={theme.gradient} style={styles.flex}>
      <ScreenHeader
        title="Book Appointment"
        onBack={() => navigation.goBack()}
      />
      <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Step 1: Doctor Selection ────────────────────────── */}
          <GlassCard style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: `${theme.primary}18` }]}>
                <Text style={[styles.stepNumber, { color: theme.primary }]}>1</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Select Doctor</Text>
            </View>

            {loadingDoctors ? (
              <SkeletonList count={3} height={60} />
            ) : doctors.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No Doctors Available"
                subtitle="Please try again later"
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.doctorList}
              >
                {doctors.map((doc) => {
                  const isSelected =
                    (selectedDoctor?._id || selectedDoctor?.id) === (doc._id || doc.id);
                  return (
                    <PressableButton
                      key={doc._id || doc.id}
                      onPress={() => handleSelectDoctor(doc)}
                      hapticType="selection"
                      scaleTo={0.95}
                      style={[
                        styles.doctorCard,
                        {
                          backgroundColor: theme.card,
                          borderColor: isSelected ? theme.primary : 'transparent',
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <Avatar
                        uri={doc.avatar || doc.profileImage}
                        name={doc.name}
                        size={48}
                        color={theme.primary}
                      />
                      <Text
                        style={[styles.doctorName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {doc.name}
                      </Text>
                      <Text
                        style={[styles.doctorSpecialty, { color: theme.textMuted }]}
                        numberOfLines={1}
                      >
                        {doc.specialty || doc.specialization || 'Doctor'}
                      </Text>
                      {isSelected && (
                        <View style={[styles.selectedCheck, { backgroundColor: theme.primary }]}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </PressableButton>
                  );
                })}
              </ScrollView>
            )}
          </GlassCard>

          {/* ─── Step 2: Appointment Type ────────────────────────── */}
          <GlassCard style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: `${theme.primary}18` }]}>
                <Text style={[styles.stepNumber, { color: theme.primary }]}>2</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Appointment Type</Text>
            </View>

            {loadingTypes ? (
              <SkeletonList count={2} height={40} />
            ) : appointmentTypes.length === 0 ? (
              <Text style={[styles.noDataText, { color: theme.textMuted }]}>
                No appointment types available
              </Text>
            ) : (
              <View style={styles.chipRow}>
                {appointmentTypes.map((type) => {
                  const isActive =
                    (selectedType?.key || selectedType?.value) === (type.key || type.value);
                  return (
                    <Chip
                      key={type.key || type.value}
                      label={type.label || type.value}
                      active={isActive}
                      onPress={() => handleSelectType(type)}
                    />
                  );
                })}
              </View>
            )}
          </GlassCard>

          {/* ─── Step 3: Date & Time ─────────────────────────────── */}
          <GlassCard style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: `${theme.primary}18` }]}>
                <Text style={[styles.stepNumber, { color: theme.primary }]}>3</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Date & Time</Text>
            </View>

            <View style={styles.dateInputRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <TextInput
                style={[styles.dateInput, { color: theme.text, borderColor: `${theme.textMuted}30` }]}
                value={dateText}
                onChangeText={handleDateChange}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
                keyboardType={Platform.OS === 'ios' ? 'default' : 'default'}
                maxLength={10}
              />
            </View>

            {availableSlots.length > 0 && (
              <View style={styles.slotsSection}>
                <Text style={[styles.slotsLabel, { color: theme.textMuted }]}>
                  Available Slots
                </Text>
                <View style={styles.chipRow}>
                  {availableSlots.map((slot) => (
                    <Chip
                      key={slot}
                      label={slot}
                      active={selectedSlot === slot}
                      onPress={() => handleSelectSlot(slot)}
                      size="sm"
                    />
                  ))}
                </View>
              </View>
            )}

            {dateText.length === 10 && availableSlots.length === 0 && selectedDoctor?.availableSlots && (
              <Text style={[styles.noSlotsText, { color: theme.textMuted }]}>
                No available slots for this date
              </Text>
            )}
          </GlassCard>

          {/* ─── Step 4: Reason ───────────────────────────────────── */}
          <GlassCard style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: `${theme.primary}18` }]}>
                <Text style={[styles.stepNumber, { color: theme.primary }]}>4</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Reason for Visit</Text>
            </View>

            <TextInput
              style={[
                styles.reasonInput,
                {
                  color: theme.text,
                  backgroundColor: `${theme.textMuted}08`,
                  borderColor: `${theme.textMuted}20`,
                },
              ]}
              value={reason}
              onChangeText={setReason}
              placeholder="Describe your symptoms or reason for the appointment..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </GlassCard>

          {/* ─── Review Card ──────────────────────────────────────── */}
          {selectedDoctor && selectedType && dateTime && (
            <GlassCard style={[styles.stepCard, styles.reviewCard]}>
              <View style={styles.stepHeader}>
                <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                <Text style={[styles.stepTitle, { color: theme.text }]}>Review</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: theme.textMuted }]}>Doctor</Text>
                <Text style={[styles.reviewValue, { color: theme.text }]}>
                  {selectedDoctor.name}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: theme.textMuted }]}>Type</Text>
                <Text style={[styles.reviewValue, { color: theme.text }]}>
                  {selectedType.label || selectedType.value}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: theme.textMuted }]}>Date & Time</Text>
                <Text style={[styles.reviewValue, { color: theme.text }]}>{dateTime}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: theme.textMuted }]}>Duration</Text>
                <Text style={[styles.reviewValue, { color: theme.text }]}>30 minutes</Text>
              </View>

              {reason.trim() ? (
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: theme.textMuted }]}>Reason</Text>
                  <Text
                    style={[styles.reviewValue, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {reason.trim()}
                  </Text>
                </View>
              ) : null}
            </GlassCard>
          )}

          {/* ─── Book Button ──────────────────────────────────────── */}
          <PressableButton
            onPress={handleBook}
            hapticType="medium"
            disabled={submitting}
            scaleTo={0.97}
            style={styles.bookBtnWrapper}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryDark || theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookBtn}
            >
              <Ionicons
                name={submitting ? 'hourglass' : 'checkmark-circle'}
                size={20}
                color="#fff"
              />
              <Text style={styles.bookBtnText}>
                {submitting ? 'Booking...' : 'Book Appointment'}
              </Text>
            </LinearGradient>
          </PressableButton>

          {/* Bottom spacing */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  stepCard: {
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Doctor list
  doctorList: {
    gap: 12,
    paddingVertical: 4,
  },
  doctorCard: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    width: 120,
    position: 'relative',
  },
  doctorName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  doctorSpecialty: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  // Date
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  slotsSection: {
    marginTop: 14,
  },
  slotsLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  noSlotsText: {
    fontSize: 13,
    marginTop: 10,
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Reason
  reasonInput: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 100,
  },
  // Review
  reviewCard: {
    borderLeftWidth: 3,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  reviewLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 0.4,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 0.6,
    textAlign: 'right',
  },
  // Book button
  bookBtnWrapper: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
    borderRadius: 14,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
