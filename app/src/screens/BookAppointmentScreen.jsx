import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, Alert, StyleSheet, Platform, Animated, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAudioPlayer } from 'expo-audio';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeader, GlassCard, PressableButton, Avatar, Chip, EmptyState, SkeletonList } from '../components/ui';
import { getDoctors, getConstants } from '../api/config';
import { createAppointment } from '../api/appointments';
import { haptics } from '../utils/haptics';
import { useScreenAnimation } from '../hooks/useAnimations';

const bookingConfirmedSound = require('../../assets/sounds/booking_confirmed.wav');

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const buildDateObj = (isoDate) => {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  return {
    day: DAYS_OF_WEEK[d.getDay()],
    date: d.getDate().toString(),
    month: MONTHS[d.getMonth()],
    year: d.getFullYear().toString(),
    fullDate: isoDate,
  };
};

const buildTimeDisplay = (hhmm) => {
  if (typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  // Number.isNaN(undefined) is false, so a malformed "HH" (no minutes) string
  // would otherwise slip through and crash on m.toString() below.
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  let hour12 = h % 12;
  hour12 = hour12 ? hour12 : 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * BookAppointmentScreen — two-phase appointment booking flow.
 *
 * Phase 1 (details): Doctor, Appointment Type, Date & Time, Reason.
 * Phase 2 (review): read-only summary + "Book Appointment" to confirm,
 *   followed by a success overlay (checkmark + sound) on completion.
 */
export default function BookAppointmentScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { fadeAnim, slideAnim } = useScreenAnimation();
  const confirmedPlayer = useAudioPlayer(bookingConfirmedSound);

  // ─── State ──────────────────────────────────────────────────────
  const [step, setStep] = useState('details'); // 'details' | 'review'
  const [doctors, setDoctors] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState(route?.params?.doctor || null);
  const [selectedType, setSelectedType] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState(() => (
    buildDateObj(route?.params?.selectedDate) || { day: 'Select', date: 'Date', month: '', year: '', fullDate: '' }
  ));
  const [selectedTime, setSelectedTime] = useState(() => buildTimeDisplay(route?.params?.selectedTime) || 'Select Time');
  const [selectedTimeVal, setSelectedTimeVal] = useState(route?.params?.selectedTime || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const checkAnim = React.useRef(new Animated.Value(0)).current;

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
  const dateTime = React.useMemo(() => {
    if (!selectedDateObj.fullDate || !selectedTimeVal) return null;
    const [year, month, day] = selectedDateObj.fullDate.split('-').map(Number);
    const [hour, minute] = selectedTimeVal.split(':').map(Number);
    // Build the picked date/time in the device's local timezone, then let
    // toISOString() convert it to true UTC — tagging the local wall-clock
    // string with a hardcoded "Z" would silently shift it by the device's
    // UTC offset and could land it in the past on the server.
    const local = new Date(year, month - 1, day, hour, minute, 0, 0);
    return local.toISOString();
  }, [selectedDateObj.fullDate, selectedTimeVal]);

  // ─── Handlers ───────────────────────────────────────────────────
  const handleSelectDoctor = (doc) => {
    haptics.selection();
    setSelectedDoctor(doc);
  };

  const handleSelectType = (type) => {
    haptics.selection();
    setSelectedType(type);
  };

  const validateDetails = () => {
    if (!selectedDoctor) {
      haptics.error();
      Alert.alert('Missing Info', 'Please select a doctor.');
      return false;
    }
    if (!selectedType) {
      haptics.error();
      Alert.alert('Missing Info', 'Please select an appointment type.');
      return false;
    }
    if (!dateTime) {
      haptics.error();
      Alert.alert('Missing Info', 'Please enter a date and time.');
      return false;
    }
    return true;
  };

  const handleContinueToReview = () => {
    if (!validateDetails()) return;
    haptics.medium();
    setStep('review');
  };

  const handleBook = async () => {
    if (!validateDetails()) return;

    haptics.medium();
    setSubmitting(true);

    try {
      await createAppointment({
        doctorId: selectedDoctor._id || selectedDoctor.id,
        type: selectedType.value,
        dateTime,
        duration: 30,
        reason: reason.trim() || undefined,
      });
      haptics.success();
      confirmedPlayer.seekTo(0);
      confirmedPlayer.play();
      checkAnim.setValue(0);
      setShowSuccess(true);
      Animated.spring(checkAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 12,
      }).start();
    } catch (err) {
      haptics.error();
      const msg =
        (Array.isArray(err) && err.join('\n')) ||
        (typeof err === 'string' && err) ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong. Please try again.';
      if (Platform.OS === 'web') {
        alert(`Booking Failed: ${msg}`);
      } else {
        Alert.alert('Booking Failed', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <LinearGradient colors={theme.gradient} style={styles.flex}>
      <ScreenHeader
        title={step === 'review' ? 'Review Booking' : 'Book Appointment'}
        onBack={() => (step === 'review' ? setStep('details') : navigation.goBack())}
      />
      <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'details' && (
          <>
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

            <Text style={[styles.slotsLabel, { color: theme.textMuted, marginBottom: 8, fontSize: 13 }]}>Select Date</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDateObj.fullDate || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDateObj(buildDateObj(e.target.value));
                  }
                }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.textMuted}30`,
                  backgroundColor: `${theme.textMuted}08`,
                  color: theme.text,
                  fontSize: '15px',
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.pickerBar, { backgroundColor: `${theme.textMuted}08`, borderColor: `${theme.textMuted}20` }]}
                  onPress={() => { haptics.selection(); setShowDatePicker(!showDatePicker); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.primary} style={styles.pickerIcon} />
                  <Text style={[styles.pickerBarText, { color: theme.text }]}>
                    {selectedDateObj.fullDate ? `${selectedDateObj.day}, ${selectedDateObj.month} ${selectedDateObj.date}, ${selectedDateObj.year}` : 'Select Date'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={(() => {
                      const d = new Date(selectedDateObj.fullDate);
                      return isNaN(d.getTime()) ? new Date() : d;
                    })()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    themeVariant="light"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setSelectedDateObj(buildDateObj(selectedDate.toISOString().split('T')[0]));
                      }
                    }}
                  />
                )}
              </>
            )}

            <Text style={[styles.slotsLabel, { color: theme.textMuted, marginBottom: 8, marginTop: 12, fontSize: 13 }]}>Select Time</Text>
            {Platform.OS === 'web' ? (
              <input
                type="time"
                value={selectedTimeVal || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const time24 = e.target.value;
                    const [hStr, mStr] = time24.split(':');
                    const h = parseInt(hStr, 10);
                    const mm = mStr;
                    let hour12 = h % 12;
                    hour12 = hour12 ? hour12 : 12;
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const displayTime = `${hour12}:${mm} ${ampm}`;
                    setSelectedTime(displayTime);
                    setSelectedTimeVal(time24);
                  }
                }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.textMuted}30`,
                  backgroundColor: `${theme.textMuted}08`,
                  color: theme.text,
                  fontSize: '15px',
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.pickerBar, { backgroundColor: `${theme.textMuted}08`, borderColor: `${theme.textMuted}20` }]}
                  onPress={() => { haptics.selection(); setShowTimePicker(!showTimePicker); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="time-outline" size={20} color={theme.primary} style={styles.pickerIcon} />
                  <Text style={[styles.pickerBarText, { color: theme.text }]}>
                    {selectedTime}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                {showTimePicker && (
                  <View style={[styles.spinnerContainer, { backgroundColor: `${theme.textMuted}08`, borderColor: `${theme.textMuted}20` }]}>
                    <DateTimePicker
                      value={(() => {
                        const d = new Date(selectedDateObj.fullDate || new Date());
                        const [h, m] = selectedTimeVal.split(':').map(Number);
                        d.setHours(h || 9);
                        d.setMinutes(m || 0);
                        return isNaN(d.getTime()) ? new Date() : d;
                      })()}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      themeVariant="light"
                      is24Hour={false}
                      minuteInterval={30}
                      onChange={(event, selectedTimeValDate) => {
                        if (Platform.OS === 'android') {
                          setShowTimePicker(false);
                        }
                        if (selectedTimeValDate) {
                          const hh = selectedTimeValDate.getHours().toString().padStart(2, '0');
                          const mm = selectedTimeValDate.getMinutes().toString().padStart(2, '0');
                          const time24 = `${hh}:${mm}`;

                          let hour12 = selectedTimeValDate.getHours() % 12;
                          hour12 = hour12 ? hour12 : 12;
                          const ampm = selectedTimeValDate.getHours() >= 12 ? 'PM' : 'AM';
                          const displayTime = `${hour12}:${mm} ${ampm}`;

                          setSelectedTime(displayTime);
                          setSelectedTimeVal(time24);
                        }
                      }}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={[styles.doneBtn, { backgroundColor: theme.primary }]}
                        onPress={() => { haptics.selection(); setShowTimePicker(false); }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.doneBtnText}>Confirm Time</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
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

          {/* ─── Continue Button ──────────────────────────────────── */}
          <PressableButton
            onPress={handleContinueToReview}
            hapticType="medium"
            scaleTo={0.97}
            style={styles.bookBtnWrapper}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryDark || theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookBtn}
            >
              <Text style={styles.bookBtnText}>Continue to Review</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </PressableButton>
          </>
          )}

          {step === 'review' && (
          <>
          {/* ─── Review ─────────────────────────────────────────────── */}
          <GlassCard style={[styles.stepCard, styles.reviewCard]}>
            <View style={styles.stepHeader}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} />
              <Text style={[styles.stepTitle, { color: theme.text }]}>Review Your Booking</Text>
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
              <Text style={[styles.reviewValue, { color: theme.text }]}>
                {selectedDateObj.day}, {selectedDateObj.month} {selectedDateObj.date}, {selectedDateObj.year} • {selectedTime}
              </Text>
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

          {/* ─── Edit Details ───────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.editDetailsBtn}
            onPress={() => { haptics.light(); setStep('details'); }}
            disabled={submitting}
          >
            <Ionicons name="arrow-back" size={16} color={theme.primary} />
            <Text style={[styles.editDetailsText, { color: theme.primary }]}>Edit Details</Text>
          </TouchableOpacity>

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
          </>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </Animated.View>

      {/* ─── Success Overlay ────────────────────────────────────────── */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: theme.card }]}>
            <Animated.View
              style={[
                styles.successCheckCircle,
                {
                  transform: [{ scale: checkAnim }],
                  opacity: checkAnim,
                },
              ]}
            >
              <Ionicons name="checkmark" size={48} color="#fff" />
            </Animated.View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Booking Confirmed!</Text>
            <Text style={[styles.successSubtitle, { color: theme.textMuted }]}>
              Your appointment with {selectedDoctor?.name} has been scheduled.
            </Text>
            <PressableButton
              onPress={() => { setShowSuccess(false); navigation.goBack(); }}
              hapticType="light"
              scaleTo={0.97}
              style={styles.successDoneBtnWrapper}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryDark || theme.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successDoneBtn}
              >
                <Text style={styles.bookBtnText}>Done</Text>
              </LinearGradient>
            </PressableButton>
          </View>
        </View>
      </Modal>
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
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
    },
    pickerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1.5,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
    },
    pickerBarText: {
      fontSize: 15,
      fontWeight: '700',
    },
    pickerIcon: {
      marginRight: 10,
      opacity: 0.9,
    },
    spinnerContainer: {
      borderRadius: 16,
      padding: 10,
      borderWidth: 1.5,
      marginBottom: 16,
      alignItems: 'center',
    },
    doneBtn: {
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 8,
      marginTop: 10,
      alignSelf: 'center',
    },
    doneBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    noSlotsText: {
      fontSize: 14,
      marginTop: 8,
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
    // Edit details (review phase)
    editDetailsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      marginTop: 12,
    },
    editDetailsText: {
      fontSize: 14,
      fontWeight: '600',
    },
    // Success overlay
    successOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    successCard: {
      width: '100%',
      borderRadius: 24,
      paddingVertical: 32,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    successCheckCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    successTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    successSubtitle: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
    },
    successDoneBtnWrapper: {
      width: '100%',
      borderRadius: 14,
      overflow: 'hidden',
    },
    successDoneBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 14,
    },
  });
