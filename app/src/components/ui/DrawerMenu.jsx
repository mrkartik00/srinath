import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Platform, Animated, Dimensions, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import haptics from '../../utils/haptics';
import PressableButton from './PressableButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(300, SCREEN_WIDTH * 0.82);

const NAV_GROUPS = [
  { label: 'Core', color: '#007AFF', items: [
    { screen: 'Home', label: 'Dashboard', icon: 'grid' },
    { screen: 'Appointments', label: 'Appointments', icon: 'calendar' },
    { screen: 'BookAppointment', label: 'Book Appointment', icon: 'add-circle' },
    { screen: 'Doctors', label: 'Browse Doctors', icon: 'people' },
    { screen: 'Profile', label: 'Profile', icon: 'person' },
  ]},
  { label: 'Health', color: '#34C759', items: [
    { screen: 'Prescriptions', label: 'Prescriptions', icon: 'document-text', color: '#FF9500' },
    { screen: 'Reminders', label: 'Medicine Reminders', icon: 'alarm', color: '#AF52DE' },
    { screen: 'Health', label: 'Health Feed', icon: 'leaf', color: '#34C759' },
  ]},
  { label: 'Communication', color: '#5AC8FA', items: [
    { screen: 'Chat', label: 'Chat with Doctor', icon: 'chatbubbles', color: '#007AFF' },
    { screen: 'Notifications', label: 'Notifications', icon: 'notifications', color: '#FF9500' },
  ]},
  { label: 'Records & Plans', color: '#AF52DE', items: [
    { screen: 'MedicalVault', label: 'Medical Vault', icon: 'lock-closed', color: '#34C759' },
    { screen: 'Subscription', label: 'Subscription', icon: 'diamond', color: '#AF52DE' },
  ]},
];

export default function DrawerMenu({ navigation, onClose }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const TAB_SCREENS = ['Home', 'Appointments', 'Chat', 'Health', 'Profile'];

  const handleNav = (item) => {
    haptics.selection();
    handleClose();
    setTimeout(() => {
      if (TAB_SCREENS.includes(item.screen)) {
        navigation.navigate('Main', { screen: item.screen });
      } else {
        navigation.navigate(item.screen);
      }
    }, 240);
  };

  const handleLogout = () => {
    haptics.heavy();
    handleClose();
    setTimeout(() => logout(), 240);
  };

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }], backgroundColor: theme.card }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.brand}>
            <View style={styles.logoBox}><Text style={styles.logoText}>JC</Text></View>
            <Text style={[styles.brandName, { color: theme.text }]}>Janki Care</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: theme.chipBg }]}>
            <Ionicons name="close" size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Nav */}
        <ScrollView style={styles.nav} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {NAV_GROUPS.map((group) => (
            <View key={group.label} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupLabel, { color: theme.textMuted }]}>{group.label}</Text>
              </View>
              {group.items.map((item) => {
                const c = item.color || group.color;
                return (
                  <PressableButton key={item.label} onPress={() => handleNav(item)} hapticType="selection" style={styles.navItem} scaleTo={0.97}>
                    <View style={[styles.navIconBox, { backgroundColor: `${c}15` }]}>
                      <Ionicons name={item.icon} size={18} color={c} />
                    </View>
                    <Text style={[styles.navLabel, { color: theme.text }]}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </PressableButton>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* User + Theme + Logout */}
        <View style={[styles.userSection, { borderTopColor: theme.border }]}>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}><Text style={styles.userInitial}>{(user?.name || 'U')[0].toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{user?.name || 'Patient'}</Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }} numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.themeRow}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={theme.warning} />
            <Text style={[styles.themeLabel, { color: theme.text }]}>{isDark ? 'Dark' : 'Light'} Mode</Text>
            <Switch value={isDark} onValueChange={() => { haptics.selection(); toggleTheme(); }} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#fff" />
          </View>
          <PressableButton onPress={handleLogout} hapticType="heavy" style={[styles.logoutBtn, { backgroundColor: `${theme.danger}14` }]} scaleTo={0.96}>
            <Ionicons name="log-out-outline" size={16} color={theme.danger} />
            <Text style={{ fontSize: 14, color: theme.danger, fontWeight: '600' }}>Logout</Text>
          </PressableButton>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_WIDTH, paddingTop: Platform.OS === 'ios' ? 56 : 24, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 999, flexDirection: 'column', zIndex: 999 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  brandName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  nav: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  group: { marginBottom: 22 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 8 },
  groupLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 9, borderRadius: 12 },
  navIconBox: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  navLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  userSection: { borderTopWidth: 1, padding: 16, paddingBottom: Platform.OS === 'ios' ? 50 : 32 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingVertical: 8 },
  themeLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  userInitial: { color: '#fff', fontSize: 16, fontWeight: '600' },
  userName: { fontSize: 14, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
});
