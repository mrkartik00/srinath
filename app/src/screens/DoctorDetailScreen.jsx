import React from 'react';
import { View, StyleSheet, ScrollView, Text, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeader, GlassCard, Avatar, PressableButton, Chip } from '../components/ui';
import { useScreenAnimation } from '../hooks/useAnimations';
import haptics from '../utils/haptics';

export default function DoctorDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const doctor = route.params?.doctor || {};
  const { fadeAnim, slideAnim } = useScreenAnimation();

  const handleBook = () => {
    haptics.medium();
    navigation.navigate('BookAppointment', { doctor });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <LinearGradient colors={theme.gradient} style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <ScreenHeader title="Doctor" onBack={() => navigation.goBack()} />

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Doctor Header Card */}
          <GlassCard style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Avatar name={doctor.name} size={72} color={theme.primary} />
              <View style={styles.headerInfo}>
                <Text style={[styles.name, { color: theme.text }]}>{doctor.name}</Text>
                <Text style={[styles.specialty, { color: theme.primary }]}>{doctor.specialty || 'General Physician'}</Text>
                {doctor.qualification && (
                  <Text style={[styles.qualification, { color: theme.textMuted }]}>{doctor.qualification}</Text>
                )}
              </View>
            </View>
          </GlassCard>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{doctor.experience || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Years Exp</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.success }]}>₹{doctor.fee || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Consult Fee</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <View style={[styles.onlineDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Available</Text>
            </GlassCard>
          </View>

          {/* About */}
          {doctor.aboutMe && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
              <GlassCard>
                <Text style={[styles.aboutText, { color: theme.textSecondary }]}>{doctor.aboutMe}</Text>
              </GlassCard>
            </>
          )}

          {/* Clinic Info */}
          {(doctor.clinicName || doctor.clinicAddress) && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Clinic</Text>
              <GlassCard>
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={18} color={theme.primary} />
                  <Text style={[styles.infoText, { color: theme.text }]}>{doctor.clinicName || 'Not specified'}</Text>
                </View>
                {doctor.clinicAddress && (
                  <View style={[styles.infoRow, { marginTop: 8 }]}>
                    <Ionicons name="location-outline" size={18} color={theme.warning} />
                    <Text style={[styles.infoText, { color: theme.textMuted }]}>{doctor.clinicAddress}</Text>
                  </View>
                )}
              </GlassCard>
            </>
          )}

          {/* Available Slots */}
          {doctor.availableSlots?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Availability</Text>
              <GlassCard>
                <View style={styles.slotsGrid}>
                  {doctor.availableSlots.map((slot, i) => (
                    <View key={i} style={[styles.slotChip, { backgroundColor: `${theme.primary}10` }]}>
                      <Text style={[styles.slotDay, { color: theme.primary }]}>{dayNames[slot.day]}</Text>
                      <Text style={[styles.slotTime, { color: theme.textMuted }]}>{slot.startTime} - {slot.endTime}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </>
          )}

          {/* Book CTA */}
          <PressableButton onPress={handleBook} hapticType="medium" style={{ marginTop: 28, borderRadius: 16 }} scaleTo={0.97}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.bookBtn}>
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.bookBtnText}>Book Appointment</Text>
            </LinearGradient>
          </PressableButton>
        </Animated.View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20 },
  headerCard: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerInfo: { flex: 1, marginLeft: 16 },
  name: { fontSize: 22, fontWeight: '700' },
  specialty: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  qualification: { fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  aboutText: { fontSize: 14, lineHeight: 21 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, flex: 1 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  slotDay: { fontSize: 13, fontWeight: '700' },
  slotTime: { fontSize: 11, marginTop: 2 },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16 },
  bookBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
