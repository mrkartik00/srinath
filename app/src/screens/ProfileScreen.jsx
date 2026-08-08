import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, TouchableOpacity } from 'react-native';
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
  const allergiesCount = p.allergies?.length || 0;

  const getAge = (dob) => {
    if (!dob) return '-';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '-';
    return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toString();
  };

  const age = getAge(p.dateOfBirth);

  const getPlanDetails = (status) => {
    switch (status) {
      case 'active':
        return { text: 'Premium Member 💎', bg: '#FEF3E2', color: '#D49E35' };
      case 'past_due':
        return { text: 'Payment Due ⚠️', bg: '#FFEBEE', color: '#E53935' };
      case 'cancelled':
      case 'expired':
        return { text: 'Plan Expired', bg: '#F5F5F5', color: '#757575' };
      default:
        return { text: 'Free Member', bg: '#F5F7FA', color: '#8F9BB3' };
    }
  };

  const plan = getPlanDetails(p.subscriptionStatus);

  const StatItem = ({ icon, color, label, value }) => (
    <View style={styles.statItem}>
      <View style={[styles.statIconWrapper, { backgroundColor: theme.cardGlass }]}>
        <Ionicons name={icon} size={24} color={color || theme.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.card }]}>
      {/* Top Blue Header Background */}
      <View style={[styles.headerBg, { backgroundColor: theme.primary }]} />

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrapper, { borderColor: theme.card }]}>
            <Avatar uri={account.avatar || user?.avatar} name={account.name || user?.name} size={110} />
            <TouchableOpacity 
              style={[styles.editBadge, { backgroundColor: '#568A7D', borderColor: theme.card }]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="pencil" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Name and Status */}
        <View style={styles.nameSection}>
          <Text style={[styles.name, { color: theme.text }]}>{account.name || user?.name || 'Patient'}</Text>
          <View style={[styles.badgeContainer, { backgroundColor: plan.bg }]}>
            <Text style={[styles.badgeText, { color: plan.color }]}>{plan.text}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatItem icon="male-female" color="#8F9BB3" label="Gender" value={p.gender || '-'} />
          <StatItem icon="calendar" color="#4A90E2" label="Age" value={age} />
          <StatItem icon="water" color="#E74C3C" label="Blood" value={p.bloodGroup || '-'} />
          <StatItem icon="medical" color="#2ECC71" label="Allergies" value={allergiesCount.toString()} />
        </View>

        {/* Address / Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Address</Text>
          <Text style={styles.sectionBody}>
            {addressLine || "No address information provided yet."}
          </Text>
        </View>

        {/* Emergency Contact Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency Contact</Text>
          {emergency.name ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                {emergency.name}
              </Text>
              {emergency.relation ? (
                <Text style={{ fontSize: 14, color: theme.textMuted, marginBottom: 2 }}>
                  Relation: {emergency.relation}
                </Text>
              ) : null}
              {emergency.phone ? (
                <Text style={{ fontSize: 14, color: theme.textMuted }}>
                  Phone: {emergency.phone}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.sectionBody}>
              No emergency contact provided yet.
            </Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    zIndex: 0,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    zIndex: 1,
  },
  avatarWrapper: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  badgeContainer: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: {
    color: '#D49E35',
    fontWeight: '600',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F5F7FA',
  },
  statLabel: {
    fontSize: 12,
    color: '#8F9BB3',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginTop: 36,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 14,
    color: '#8F9BB3',
    lineHeight: 22,
  },
  familyScroll: {
    marginTop: 8,
    paddingRight: 24,
  },
  familyItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 72,
  },
  familyAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addFamilyAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  familyName: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
