import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeader, GlassCard, Avatar, SkeletonList, EmptyState, PressableButton } from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import { getDoctors } from '../api/config';
import haptics from '../utils/haptics';

export default function DoctorsScreen({ navigation }) {
  const { theme } = useTheme();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { fadeAnim, slideAnim } = useScreenAnimation();
  const { getItemStyle, triggerStagger } = useStaggerAnimation(10);

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      setDoctors(res.data || []);
      triggerStagger(res.data?.length || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, []);

  const onRefresh = async () => {
    haptics.light();
    setRefreshing(true);
    await fetchDoctors();
    setRefreshing(false);
  };

  const openDoctor = (doctor) => {
    haptics.light();
    navigation.navigate('DoctorDetail', { doctor });
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <ScreenHeader title="Doctors" subtitle="Browse available doctors" onBack={() => navigation.goBack()} />

        {loading ? (
          <SkeletonList count={5} />
        ) : doctors.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Doctors Found"
            message="No doctors are currently available. Please check back later."
          />
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {doctors.map((doc, index) => (
              <Animated.View key={doc.id || index} style={getItemStyle(index)}>
                <PressableButton onPress={() => openDoctor(doc)} hapticType="light" scaleTo={0.98} style={{ marginBottom: 12 }}>
                  <GlassCard>
                    <View style={styles.docRow}>
                      <Avatar name={doc.name} size={52} color={theme.primary} />
                      <View style={styles.docInfo}>
                        <Text style={[styles.docName, { color: theme.text }]}>{doc.name}</Text>
                        <Text style={[styles.docSpecialty, { color: theme.textMuted }]}>{doc.specialty || 'General Physician'}</Text>
                        <View style={styles.metaRow}>
                          {doc.experience > 0 && (
                            <View style={styles.metaChip}>
                              <Ionicons name="time-outline" size={12} color={theme.primary} />
                              <Text style={[styles.metaText, { color: theme.textSecondary }]}>{doc.experience} yrs</Text>
                            </View>
                          )}
                          {doc.fee > 0 && (
                            <View style={styles.metaChip}>
                              <Ionicons name="cash-outline" size={12} color={theme.success} />
                              <Text style={[styles.metaText, { color: theme.textSecondary }]}>₹{doc.fee}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={[styles.bookBadge, { backgroundColor: `${theme.primary}14` }]}>
                        <Ionicons name="chevron-forward" size={18} color={theme.primary} />
                      </View>
                    </View>
                  </GlassCard>
                </PressableButton>
              </Animated.View>
            ))}
          </Animated.View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20 },
  docRow: { flexDirection: 'row', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 14 },
  docName: { fontSize: 16, fontWeight: '700' },
  docSpecialty: { fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '500' },
  bookBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
