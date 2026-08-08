import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
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
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import haptics from '../utils/haptics';
import { getDoctorProfile, submitReview } from '../api/doctors';

const { width } = Dimensions.get('window');




export default function DoctorDetailScreen({ navigation, route }) {
  const doctor = route.params?.doctor || {};
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(theme, isDark), [theme, isDark]);

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

  // Profile data from API
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch doctor profile (testimonials, reviews, rating)
  useEffect(() => {
    const doctorId = doctor?._id || doctor?.id;
    if (!doctorId) return;
    (async () => {
      try {
        setProfileLoading(true);
        const res = await getDoctorProfile(doctorId);
        setProfileData(res.data || res);
      } catch (err) {
        console.error('Failed to fetch doctor profile:', err);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [doctor]);

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    const doctorId = doctor?._id || doctor?.id;
    if (!doctorId) return;
    try {
      setSubmittingReview(true);
      await submitReview(doctorId, { rating: reviewRating, text: reviewText.trim() });
      Alert.alert('Thank You!', 'Your review has been submitted successfully.');
      setReviewRating(0);
      setReviewText('');
      // Refresh profile to show new review
      const res = await getDoctorProfile(doctorId);
      setProfileData(res.data || res);
    } catch (err) {
      const msg = Array.isArray(err) ? err.join('\n') : (typeof err === 'string' ? err : 'Failed to submit review.');
      Alert.alert('Error', msg);
    } finally {
      setSubmittingReview(false);
    }
  };

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
    <LinearGradient colors={theme.gradient || ['#E8EEFA', '#F3F7FD', '#FFFFFF']} style={styles.container}>
      {/* Absolute Header (Back) */}
      <View style={styles.absoluteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Doctor Image - Positioned behind middle section */}
        {doctor.avatar ? (
          <Image source={{ uri: doctor.avatar }} style={styles.doctorImg} />
        ) : (
          <View style={[styles.doctorImg, styles.doctorImgFallback]}>
            <Ionicons name="person" size={72} color={theme.textSecondary} />
          </View>
        )}

        {/* Doctor Main Info Section */}
        <View style={styles.topSection}>
          <View style={styles.topInfoLeft}>
            <Text style={styles.doctorName}>{doctor.name || 'Doctor'}</Text>

            {profileData?.avgRating ? (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(profileData.avgRating) ? 'star' : 'star-outline'}
                    size={16}
                    color="#F5A623"
                  />
                ))}
                <Text style={styles.ratingText}>
                  {profileData.avgRating.toFixed(1)} ({profileData.reviewCount || 0})
                </Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="stethoscope" size={16} color={theme.primary} style={styles.metaIcon} />
              <Text style={styles.metaText}>{doctor.specialty || 'General Physician'}</Text>
            </View>

            {doctor.clinicAddress ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={theme.primary} style={styles.metaIcon} />
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
            <TouchableOpacity style={styles.circleActionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('ChatConversation', { doctor })}>
              <Ionicons name="chatbubble-ellipses" size={20} color={theme.primary} />
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

          {Platform.OS === 'web' ? (
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDateObj.fullDate || ''}
              onChange={(e) => {
                if (e.target.value) {
                  const selectedDate = new Date(e.target.value);
                  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                  setSelectedDateObj({
                    day: daysOfWeek[selectedDate.getDay()],
                    date: selectedDate.getDate().toString(),
                    month: months[selectedDate.getMonth()],
                    year: selectedDate.getFullYear().toString(),
                    fullDate: e.target.value,
                  });
                }
              }}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.card,
                color: theme.text,
                fontSize: '15px',
                width: '100%',
                boxSizing: 'border-box',
                outline: 'none',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.pickerBar}
                onPress={() => { haptics.selection(); setShowDatePicker(!showDatePicker); }}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.primary} style={styles.pickerIcon} />
                <Text style={styles.pickerBarText}>
                  {selectedDateObj.day}, {selectedDateObj.month} {selectedDateObj.date}, {selectedDateObj.year}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
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
            </>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Select Time</Text>

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
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.card,
                color: theme.text,
                fontSize: '15px',
                width: '100%',
                boxSizing: 'border-box',
                outline: 'none',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.pickerBar}
                onPress={() => { haptics.selection(); setShowTimePicker(!showTimePicker); }}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={20} color={theme.primary} style={styles.pickerIcon} />
                <Text style={styles.pickerBarText}>
                  {selectedTime}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
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
            </>
          )}

          {/* Full Clinic Address under Time Slot */}
          {doctor.clinicAddress ? (
            <View style={styles.addressSection}>
              <Text style={styles.addressTitle}>Clinic Address</Text>
              <View style={styles.addressCard}>
                <Ionicons name="location-outline" size={18} color={theme.primary} style={styles.addressLocationIcon} />
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

        {/* Testimonials Section */}
        {profileData?.testimonials?.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Testimonials</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.testimonialScroll}>
              {profileData.testimonials.map((t, idx) => (
                <View key={idx} style={styles.testimonialCard}>
                  {t.rating ? (
                    <View style={styles.testimonialRatingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons key={star} name={star <= t.rating ? 'star' : 'star-outline'} size={12} color="#F5A623" />
                      ))}
                    </View>
                  ) : null}
                  <Text style={styles.testimonialText} numberOfLines={4}>"{t.text}"</Text>
                  <Text style={styles.testimonialAuthor}>— {t.authorName}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews Section */}
        {profileData?.reviews?.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Patient Reviews</Text>
            {profileData.reviews.map((r, idx) => (
              <View key={idx} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewPatientName}>{r.patientName || 'Patient'}</Text>
                  <View style={styles.reviewStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons key={star} name={star <= r.rating ? 'star' : 'star-outline'} size={14} color="#F5A623" />
                    ))}
                  </View>
                </View>
                {r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Write a Review Section */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>Write a Review</Text>
          <View style={styles.writeReviewCard}>
            <Text style={styles.writeReviewLabel}>Your Rating</Text>
            <View style={styles.starSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => { haptics.selection(); setReviewRating(star); }} activeOpacity={0.7}>
                  <Ionicons
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= reviewRating ? '#F5A623' : theme.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              placeholderTextColor={theme.textSecondary}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              maxLength={500}
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitReviewBtn, submittingReview && { opacity: 0.6 }]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
              activeOpacity={0.8}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitReviewBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
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

const makeStyles = (theme, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
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
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
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
    color: theme.primary,
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
    color: theme.primary,
    opacity: 0.8,
  },
  doctorImg: {
    position: 'absolute',
    right: -10,
    top: Platform.OS === 'ios' ? 40 : 20,
    width: width * 0.62,
    height: 330,
    zIndex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  doctorImgFallback: {
    backgroundColor: theme.chipBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  midSection: {
    backgroundColor: theme.cardGlass,
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
    backgroundColor: theme.primary,
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
    color: theme.primary,
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
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
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
    backgroundColor: theme.card,
    borderRadius: 24,
    marginHorizontal: 24,
    padding: 16,
    marginBottom: 24,
    justifyContent: 'space-between',
    shadowColor: theme.shadow,
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
    color: theme.primary,
  },
  statText: {
    color: theme.text,
  },
  statLbl: {
    fontSize: 11,
    fontFamily: 'Urbanist_500Medium',
    color: theme.textSecondary,
    marginTop: 2,
  },
  bookingCard: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    flex: 1,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
    marginBottom: 16,
  },
  pickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.chipBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  pickerBarText: {
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
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
    color: theme.textSecondary,
    lineHeight: 20,
  },
  addressSection: {
    marginTop: 8,
  },
  addressTitle: {
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
    marginBottom: 10,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: theme.chipBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
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
    color: theme.primary,
    marginBottom: 4,
  },
  clinicAddressText: {
    fontSize: 13,
    fontFamily: 'Urbanist_500Medium',
    color: theme.textSecondary,
    lineHeight: 18,
  },
  bookBtn: {
    backgroundColor: theme.primary,
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
    backgroundColor: theme.card,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 10,
  },
  spinnerContainer: {
    backgroundColor: theme.chipBg,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: theme.border,
    marginBottom: 20,
    alignItems: 'center',
  },
  doneBtn: {
    backgroundColor: theme.primary,
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
  // Rating row near doctor name
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginLeft: 6,
  },
  // Testimonials & Reviews
  reviewSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  testimonialScroll: {
    paddingRight: 24,
    gap: 12,
  },
  testimonialCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    width: 240,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  testimonialRatingRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 2,
  },
  testimonialText: {
    fontSize: 13,
    fontFamily: 'Urbanist_500Medium',
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  testimonialAuthor: {
    fontSize: 12,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
  },
  reviewCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewPatientName: {
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 13,
    fontFamily: 'Urbanist_500Medium',
    color: theme.textSecondary,
    lineHeight: 18,
  },
  // Write a Review
  writeReviewCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  writeReviewLabel: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.text,
    marginBottom: 8,
  },
  starSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  reviewInput: {
    backgroundColor: theme.chipBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Urbanist_500Medium',
    color: theme.text,
    minHeight: 80,
    marginBottom: 16,
  },
  submitReviewBtn: {
    backgroundColor: theme.primary,
    borderRadius: 20,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
  },
});
