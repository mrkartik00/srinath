import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Platform,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import haptics from '../utils/haptics';

const { width } = Dimensions.get('window');

const BG_COLOR = '#F5F7FA';
const PRIMARY_COLOR = '#223263';
const TEXT_SECONDARY = '#8F9BB3';

export default function DoctorDetailScreen({ navigation, route }) {
  const doctor = route.params?.doctor || {};
  const [isFavorite, setIsFavorite] = useState(false);

  // Generate dates dynamically (next 7 days starting from today)
  const dynamicDates = React.useMemo(() => {
    const list = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push({
        day: daysOfWeek[d.getDay()],
        date: d.getDate().toString(),
        month: months[d.getMonth()],
        year: d.getFullYear().toString(),
        fullDate: d.toISOString().split('T')[0], // 'YYYY-MM-DD'
      });
    }
    return list;
  }, []);

  const [selectedDateObj, setSelectedDateObj] = useState(dynamicDates[0]);
  const [selectedTime, setSelectedTime] = useState('Select Time');
  const [selectedTimeVal, setSelectedTimeVal] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Generate time slots from the doctor's real availableSlots schedule for the
  // selected day. No real per-slot booking-conflict data exists, so every
  // generated slot is simply marked available — no fabricated "busy" slots.
  const dynamicTimes = React.useMemo(() => {
    if (!doctor?.availableSlots?.length) return [];

    const dateObj = new Date(selectedDateObj.fullDate);
    const dayOfWeek = dateObj.getDay();
    const daySlot = doctor.availableSlots.find((slot) => slot.day === dayOfWeek);
    if (!daySlot || !daySlot.startTime || !daySlot.endTime) return [];

    const slots = [];
    let [currentHour, currentMin] = daySlot.startTime.split(':').map(Number);
    const [endHour, endMin] = daySlot.endTime.split(':').map(Number);

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const hh = currentHour.toString().padStart(2, '0');
      const mm = currentMin.toString().padStart(2, '0');

      let hour12 = currentHour % 12;
      hour12 = hour12 ? hour12 : 12;
      const ampm = currentHour >= 12 ? 'PM' : 'AM';

      slots.push({ time: `${hour12}:${mm} ${ampm}`, value: `${hh}:${mm}`, available: true });

      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin -= 60;
      }
    }
    return slots;
  }, [doctor, selectedDateObj]);

  // Select the first available slot when the date/time list updates
  useEffect(() => {
    if (dynamicTimes.length > 0) {
      setSelectedTime(dynamicTimes[0].time);
      setSelectedTimeVal(dynamicTimes[0].value);
    } else {
      setSelectedTime('No slots available');
      setSelectedTimeVal('');
    }
  }, [dynamicTimes]);

  const handleBook = () => {
    haptics.medium();
    navigation.navigate('BookAppointment', {
      doctor,
      selectedDate: selectedDateObj.fullDate, // YYYY-MM-DD
      selectedTime: selectedTimeVal // HH:MM
    });
  };

  const handleCall = () => {
    if (!doctor.phone) return;
    haptics.light();
    Linking.openURL(`tel:${doctor.phone}`);
  };

  const feeSymbol = '₹';

  return (
    <LinearGradient colors={['#E8EEFA', '#F3F7FD', '#FFFFFF']} style={styles.container}>
      {/* Absolute Header (Back & Favorite) */}
      <View style={styles.absoluteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY_COLOR} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { haptics.light(); setIsFavorite(!isFavorite); }} style={styles.headerBtn} activeOpacity={0.8}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#FF3B30" : PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Doctor Image - Positioned behind middle section */}
        {doctor.avatar ? (
          <Image source={{ uri: doctor.avatar }} style={styles.doctorImg} />
        ) : (
          <View style={[styles.doctorImg, styles.doctorImgFallback]}>
            <Ionicons name="person" size={72} color={TEXT_SECONDARY} />
          </View>
        )}

        {/* Doctor Main Info Section */}
        <View style={styles.topSection}>
          <View style={styles.topInfoLeft}>
            <Text style={styles.doctorName}>{doctor.name || 'Doctor'}</Text>

            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="stethoscope" size={16} color={PRIMARY_COLOR} style={styles.metaIcon} />
              <Text style={styles.metaText}>{doctor.specialty || 'General Physician'}</Text>
            </View>

            {doctor.clinicAddress ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={PRIMARY_COLOR} style={styles.metaIcon} />
                <Text style={styles.metaText}>{doctor.clinicAddress.split(',')[0]}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Middle Semi-Translucent Container wrapper (simulates frosted glass layout) */}
        <View style={styles.midSection}>
          {/* Consultation Fee & Quick Call/Chat Actions */}
          <View style={styles.feeRow}>
            <View style={styles.feeContainer}>
              <View style={styles.feeIconCircle}>
                <Text style={styles.feeIconText}>{feeSymbol}</Text>
              </View>
              <Text style={styles.feeText}>Consultation Fee: {feeSymbol}{doctor.fee ?? 0}</Text>
            </View>
            <TouchableOpacity
              style={[styles.circleActionBtn, !doctor.phone && styles.circleActionBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleCall}
              disabled={!doctor.phone}
            >
              <Ionicons name="call" size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleActionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('ChatConversation', { doctor })}>
              <Ionicons name="chatbubble-ellipses" size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            {/* Exp */}
            <View style={styles.statCol}>
              <View style={[styles.statIconCircle, { backgroundColor: '#E2F0D9' }]}>
                <Ionicons name="time" size={18} color="#385723" />
              </View>
              <View style={styles.statTextCol}>
                <Text style={styles.statVal}>{doctor.experience ?? 0} Years</Text>
                <Text style={styles.statLbl}>Experience</Text>
              </View>
            </View>

            {/* Qualification */}
            <View style={styles.statCol}>
              <View style={[styles.statIconCircle, { backgroundColor: '#EAF2F8' }]}>
                <Ionicons name="school" size={18} color="#2F5597" />
              </View>
              <View style={styles.statTextCol}>
                <Text style={styles.statVal} numberOfLines={1}>{doctor.qualification || 'N/A'}</Text>
                <Text style={styles.statLbl}>Qualification</Text>
              </View>
            </View>
          </View>

          {doctor.aboutMe ? (
            <View style={styles.aboutSection}>
              <Text style={styles.addressTitle}>About</Text>
              <Text style={styles.aboutText}>{doctor.aboutMe}</Text>
            </View>
          ) : null}
        </View>

        {/* Booking Card (Select Date & Select Time) */}
        <View style={styles.bookingCard}>
          <Text style={styles.sectionTitle}>Select Date</Text>

          <TouchableOpacity
            style={styles.pickerBar}
            onPress={() => { haptics.selection(); setShowDatePicker(!showDatePicker); }}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} style={styles.pickerIcon} />
            <Text style={styles.pickerBarText}>
              {selectedDateObj.day}, {selectedDateObj.month} {selectedDateObj.date}, {selectedDateObj.year}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={TEXT_SECONDARY} style={{ marginLeft: 'auto' }} />
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
                  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                  setSelectedDateObj({
                    day: daysOfWeek[selectedDate.getDay()],
                    date: selectedDate.getDate().toString(),
                    month: months[selectedDate.getMonth()],
                    year: selectedDate.getFullYear().toString(),
                    fullDate: selectedDate.toISOString().split('T')[0],
                  });
                }
              }}
            />
          )}

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Select Time</Text>

          <TouchableOpacity
            style={styles.pickerBar}
            onPress={() => { haptics.selection(); setShowTimePicker(!showTimePicker); }}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={20} color={PRIMARY_COLOR} style={styles.pickerIcon} />
            <Text style={styles.pickerBarText}>
              {selectedTime}
            </Text>
            <Ionicons name="chevron-down" size={16} color={TEXT_SECONDARY} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {showTimePicker && (
            <View style={styles.spinnerContainer}>
              <DateTimePicker
                value={(() => {
                  const d = new Date(selectedDateObj.fullDate);
                  const [h, m] = selectedTimeVal.split(':').map(Number);
                  d.setHours(h || 9);
                  d.setMinutes(m || 0);
                  return isNaN(d.getTime()) ? new Date() : d;
                })()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant="light"
                is24Hour={false}
                onChange={(event, selectedTimeValDate) => {
                  if (Platform.OS === 'android') {
                    setShowTimePicker(false);
                  }
                  if (selectedTimeValDate) {
                    const hh = selectedTimeValDate.getHours().toString().padStart(2, '0');
                    const mm = selectedTimeValDate.getMinutes().toString().padStart(2, '0');
                    const time24 = `${hh}:${mm}`;

                    // Format to 12-hour AM/PM string
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
                  style={styles.doneBtn}
                  onPress={() => { haptics.selection(); setShowTimePicker(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneBtnText}>Confirm Time</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Full Clinic Address under Time Slot */}
          {doctor.clinicAddress ? (
            <View style={styles.addressSection}>
              <Text style={styles.addressTitle}>Clinic Address</Text>
              <View style={styles.addressCard}>
                <Ionicons name="location-outline" size={18} color={PRIMARY_COLOR} style={styles.addressLocationIcon} />
                <View style={styles.addressTextCol}>
                  {doctor.clinicName ? (
                    <Text style={styles.clinicNameText}>{doctor.clinicName}</Text>
                  ) : null}
                  <Text style={styles.clinicAddressText}>{doctor.clinicAddress}</Text>
                </View>
              </View>
            </View>
          ) : null}

        </View>
      </ScrollView>

      {/* Fixed Footer with Book CTA */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleBook} style={styles.bookBtn} activeOpacity={0.9}>
          <Text style={styles.bookBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAEFF8', // Matches screenshot base gradient
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  absoluteHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    paddingBottom: 24,
    minHeight: 280,
    zIndex: 10,
    elevation: 5,
  },
  topInfoLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: width * 0.18,
    zIndex: 11,
  },
  doctorName: {
    fontSize: 28,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
    lineHeight: 34,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaIcon: {
    marginRight: 8,
    opacity: 0.8,
  },
  metaText: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: PRIMARY_COLOR,
    opacity: 0.8,
  },
  doctorImg: {
    position: 'absolute',
    right: -10,
    top: Platform.OS === 'ios' ? 40 : 20,
    width: width * 0.62,
    height: 330,
    zIndex: 1,
  },
  doctorImgFallback: {
    backgroundColor: '#E8EEFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  midSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Frosted/translucent middle wrapper
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 24,
    paddingBottom: 4,
    marginTop: 10,
    zIndex: 2,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  feeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  feeIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  feeIconText: {
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontFamily: 'Urbanist_700Bold',
  },
  feeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
  },
  circleActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  circleActionBtnDisabled: {
    opacity: 0.4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 24,
    padding: 16,
    marginBottom: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  statCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTextCol: {
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 13,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
  },
  statLbl: {
    fontSize: 11,
    fontFamily: 'Urbanist_500Medium',
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
    marginBottom: 16,
  },
  pickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EEF2F8',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  pickerBarText: {
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
  },
  pickerIcon: {
    marginRight: 10,
    opacity: 0.9,
  },
  aboutSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  aboutText: {
    fontSize: 14,
    fontFamily: 'Urbanist_500Medium',
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },
  addressSection: {
    marginTop: 8,
  },
  addressTitle: {
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
    marginBottom: 10,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EEF2F8',
  },
  addressLocationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressTextCol: {
    flex: 1,
  },
  clinicNameText: {
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  clinicAddressText: {
    fontSize: 13,
    fontFamily: 'Urbanist_500Medium',
    color: TEXT_SECONDARY,
    lineHeight: 18,
  },
  bookBtn: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 24,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 10,
  },
  spinnerContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#EEF2F8',
    marginBottom: 20,
    alignItems: 'center',
  },
  doneBtn: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 10,
    alignSelf: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
  },
});
