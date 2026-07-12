import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader, GlassCard, PressableButton, Avatar, PageLoader } from '../components/ui';
import { getMyProfile } from '../api/patient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import haptics from '../utils/haptics';

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const handleLogout = () => {
    haptics.light();
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => { haptics.heavy(); logout(); },
      },
    ]);
  };

  // Refetch every time this screen regains focus — a plain mount-only effect
  // would leave stale data on screen after returning from EditProfile, since
  // navigation.goBack() reveals this already-mounted screen rather than
  // remounting it.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getMyProfile()
        .then((res) => { if (!cancelled) setProfile(res.data); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  if (loading) return <PageLoader />;

  const p = profile || {};
  const account = p.userId || {};
  const address = p.address || {};
  const emergency = p.emergencyContact || {};
  const addressLine = [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ');
  const allergies = p.allergies?.length ? p.allergies.join(', ') : null;

  const Row = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: value ? theme.text : theme.textMuted }]}>{value || 'Not set'}</Text>
    </View>
  );

  return (
    <LinearGradient colors={theme.gradient} style={[styles.flex, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title="My Profile"
        subtitle="Your medical and personal information"
        onBack={() => navigation.goBack()}
        rightIcon="create-outline"
        onRightPress={() => navigation.navigate('EditProfile')}
      />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <Avatar uri={account.avatar || user?.avatar} name={account.name || user?.name} size={84} />
          <Text style={[styles.name, { color: theme.text }]}>{account.name || user?.name || 'Patient'}</Text>
          {(account.email || user?.email) ? (
            <Text style={[styles.email, { color: theme.textMuted }]}>{account.email || user?.email}</Text>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PERSONAL INFORMATION</Text>
        <GlassCard style={styles.cardSpacing}>
          <Row label="Date of Birth" value={formatDate(p.dateOfBirth)} />
          <Row label="Gender" value={p.gender} />
          <Row label="Blood Group" value={p.bloodGroup} />
        </GlassCard>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ADDRESS</Text>
        <GlassCard style={styles.cardSpacing}>
          <Row label="Address" value={addressLine} />
        </GlassCard>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>EMERGENCY CONTACT</Text>
        <GlassCard style={styles.cardSpacing}>
          <Row label="Name" value={emergency.name} />
          <Row label="Phone" value={emergency.phone} />
          <Row label="Relation" value={emergency.relation} />
        </GlassCard>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>MEDICAL INFO</Text>
        <GlassCard style={styles.cardSpacing}>
          <Row label="Allergies" value={allergies} />
        </GlassCard>

        <PressableButton
          onPress={handleLogout}
          hapticType="heavy"
          style={[styles.logoutBtn, { backgroundColor: `${theme.danger}14` }]}
          scaleTo={0.97}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.danger} />
          <Text style={[styles.logoutBtnText, { color: theme.danger }]}>Log Out</Text>
        </PressableButton>

        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  name: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  email: { fontSize: 14, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 10 },
  cardSpacing: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10 },
  rowLabel: { fontSize: 14, fontWeight: '500', flex: 0.4 },
  rowValue: { fontSize: 14, fontWeight: '600', flex: 0.6, textAlign: 'right' },
  logoutBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700' },
});
