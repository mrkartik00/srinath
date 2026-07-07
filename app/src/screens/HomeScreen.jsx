import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, TouchableOpacity, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/ui/GlassCard';
import PressableButton from '../components/ui/PressableButton';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { haptics } from '../utils/haptics';

const QUICK_ACCESS = [
  { label: 'Prescriptions', icon: 'document-text', color: '#FF9500', screen: 'Prescriptions' },
  { label: 'Medical Vault', icon: 'lock-closed', color: '#34C759', screen: 'MedicalVault' },
  { label: 'Chat', icon: 'chatbubbles', color: '#007AFF', screen: 'Chat', isTab: true },
  { label: 'Reminders', icon: 'alarm', color: '#AF52DE', screen: 'Reminders' },
  { label: 'Subscription', icon: 'diamond', color: '#FF2D55', screen: 'Subscription' },
  { label: 'Doctors', icon: 'people', color: '#5AC8FA', screen: 'Doctors' },
];

export default function HomeScreen({ navigation, onOpenDrawer }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchData = async () => {
    try { const res = await api.get('/api/v1/patients/me/stats'); setStats(res.data); } catch {}
  };

  useEffect(() => {
    fetchData();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 6 }),
    ]).start();
  }, []);

  const onRefresh = async () => { haptics.light(); setRefreshing(true); await fetchData(); setRefreshing(false); };
  const openDrawer = () => { haptics.light(); onOpenDrawer(); };
  const handleBook = () => { haptics.medium(); navigation.navigate('BookAppointment'); };
  const handleViewAll = () => { haptics.light(); navigation.navigate('Appointments'); };
  const handleFeature = (f) => { haptics.light(); if (f.isTab) { navigation.navigate(f.screen); } else { navigation.navigate(f.screen); } };

  const s = stats || {};
  const upcoming = s.upcomingAppointments || [];
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <LinearGradient colors={theme.gradient} style={[styles.flex, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <PressableButton onPress={openDrawer} hapticType="light" style={styles.menuBtnW}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.menuBtn}>
              <Ionicons name="menu" size={20} color="#fff" />
            </LinearGradient>
          </PressableButton>
          <View style={[styles.avatar, { backgroundColor: theme.avatarBg }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Welcome */}
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: theme.textMuted }]}>{greeting}</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'Patient'}</Text>
            <Text style={[styles.welcomeText, { color: theme.textMuted }]}>Welcome to your health dashboard. Track appointments, manage your profile, and stay on top of your care.</Text>
            <PressableButton onPress={handleBook} hapticType="medium" style={styles.ctaBtnW}>
              <LinearGradient colors={[theme.primary, theme.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaBtn}>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.ctaBtnText}>Book Appointment</Text>
              </LinearGradient>
            </PressableButton>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Upcoming', value: s.upcomingCount ?? 0, color: theme.primary, icon: 'time' },
              { label: 'Completed', value: s.completedCount ?? 0, color: theme.success, icon: 'checkmark-circle' },
              { label: 'Cancelled', value: s.cancelledCount ?? 0, color: theme.warning, icon: 'close-circle' },
            ].map((stat) => (
              <GlassCard key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Ionicons name={stat.icon} size={16} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
              </GlassCard>
            ))}
          </View>

          {/* Upcoming */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={handleBook}><Text style={{ fontSize: 15, color: theme.primary, fontWeight: '600' }}>Book New</Text></TouchableOpacity>
          </View>

          {upcoming.length === 0 ? (
            <GlassCard style={styles.cardSpacing}>
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <View style={[styles.emptyIconBg, { backgroundColor: `${theme.primary}14` }]}>
                  <Ionicons name="calendar-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>No upcoming appointments</Text>
                <PressableButton onPress={handleBook} hapticType="medium" style={styles.bookBtnW}>
                  <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>Book Your First Appointment</Text>
                  </LinearGradient>
                </PressableButton>
              </View>
            </GlassCard>
          ) : (
            <>
              {upcoming.map((apt) => (
                <PressableButton key={apt._id} onPress={() => haptics.light()} hapticType="light" style={styles.cardSpacing} scaleTo={0.98}>
                  <GlassCard>
                    <View style={styles.aptRow}>
                      <View style={[styles.aptIcon, { backgroundColor: `${theme.primary}14` }]}>
                        <Ionicons name="calendar" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.aptDate, { color: theme.text }]}>{new Date(apt.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                        <Text style={[styles.aptMeta, { color: theme.textMuted }]}>{apt.doctorId?.name || 'Doctor'} • {apt.type?.replace('_', ' ')} • {apt.duration} min</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: `${theme.primary}14` }]}>
                        <View style={[styles.badgeDot, { backgroundColor: theme.primary }]} />
                        <Text style={[styles.badgeText, { color: theme.primary }]}>Scheduled</Text>
                      </View>
                    </View>
                  </GlassCard>
                </PressableButton>
              ))}
              <TouchableOpacity onPress={handleViewAll} style={{ marginTop: 8 }}><Text style={{ fontSize: 15, color: theme.primary, fontWeight: '600', textAlign: 'center' }}>View all appointments →</Text></TouchableOpacity>
            </>
          )}

          {/* Explore Features */}
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Explore Features</Text>
            <TouchableOpacity onPress={openDrawer}><Text style={{ fontSize: 15, color: theme.primary, fontWeight: '600' }}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
            {QUICK_ACCESS.map((f) => (
              <PressableButton key={f.label} onPress={() => handleFeature(f)} hapticType="light" style={styles.featureCardW} scaleTo={0.96}>
                <GlassCard style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: `${f.color}15` }]}>
                    <Ionicons name={f.icon} size={22} color={f.color} />
                  </View>
                  <Text style={[styles.featureLabel, { color: theme.text }]}>{f.label}</Text>
                </GlassCard>
              </PressableButton>
            ))}
          </ScrollView>

          {/* About */}
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About Janki Care</Text>
          </View>
          <GlassCard>
            <View style={styles.aboutRow}>
              <View style={[styles.aboutIcon, { backgroundColor: `${theme.primary}14` }]}>
                <Ionicons name="shield-checkmark" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.aboutTitle, { color: theme.text }]}>Your care, simplified</Text>
                <Text style={[styles.aboutText, { color: theme.textMuted }]}>Janki Care connects you with top doctors, manages your appointments, and keeps your medical records secure — all in one place.</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  menuBtnW: { borderRadius: 14 },
  menuBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  avatarText: { fontSize: 17, fontWeight: '700' },
  header: { marginBottom: 24 },
  greeting: { fontSize: 15, fontWeight: '500' },
  userName: { fontSize: 32, fontWeight: '700', marginTop: 2, letterSpacing: -0.5 },
  welcomeText: { fontSize: 15, marginTop: 8, lineHeight: 22 },
  ctaBtnW: { marginTop: 18, alignSelf: 'flex-start', borderRadius: 14 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13 },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  cardSpacing: { marginBottom: 10 },
  emptyIconBg: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 15, marginBottom: 16 },
  bookBtnW: { borderRadius: 12 },
  bookBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  aptRow: { flexDirection: 'row', alignItems: 'center' },
  aptIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  aptDate: { fontSize: 15, fontWeight: '600' },
  aptMeta: { fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  featureCardW: { width: 130 },
  featureCard: { alignItems: 'flex-start', padding: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureLabel: { fontSize: 14, fontWeight: '600' },
  featurePhase: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  featurePhaseText: { fontSize: 10, fontWeight: '600' },
  aboutRow: { flexDirection: 'row', alignItems: 'flex-start' },
  aboutIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  aboutTitle: { fontSize: 15, fontWeight: '600' },
  aboutText: { fontSize: 13, marginTop: 4, lineHeight: 19 },
});
