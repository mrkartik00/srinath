import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  Animated,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  ScreenHeader,
  GlassCard,
  EmptyState,
  SkeletonList,
} from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import { registerDevice } from '../api/devices';
import haptics from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY = 'notification_history';

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const { fadeAnim, slideAnim } = useScreenAnimation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { getItemStyle, triggerStagger } = useStaggerAnimation(notifications.length);

  useEffect(() => {
    requestPermissionsAndRegister();
    loadNotifications();
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      setTimeout(() => {
        triggerStagger(notifications.length);
      }, 50);
    }
  }, [notifications]);

  const requestPermissionsAndRegister = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      if (token) {
        await registerDevice(token, Platform.OS);
      }
    } catch (err) {
      console.warn('Failed to register device for notifications:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const markedRead = parsed.map((n) => ({ ...n, read: true }));
        setNotifications(markedRead);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(markedRead));
        DeviceEventEmitter.emit('notifications_updated');
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (index) => {
    haptics.light();
    const updated = [...notifications];
    updated[index] = { ...updated[index], read: true };
    setNotifications(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      DeviceEventEmitter.emit('notifications_updated');
    } catch (err) {
      console.warn('Failed to persist read state:', err);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <LinearGradient colors={[theme.gradient[0], theme.gradient[2]]} style={styles.container}>
        <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
        <View style={styles.skeletonContainer}>
          <SkeletonList count={5} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.gradient[0], theme.gradient[2]]} style={styles.container}>
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />

      {notifications.length === 0 ? (
        <EmptyState
          icon="checkmark-circle"
          title="All caught up!"
          subtitle="You have no new notifications"
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {notifications.map((item, index) => (
            <Animated.View
              key={item.id || index}
              style={[
                getItemStyle(index),
              ]}
            >
              <GlassCard
                style={[styles.notifCard, item.read && styles.notifRead]}
                onPress={() => handleMarkAsRead(index)}
              >
                <View style={styles.notifRow}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="notifications" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={[styles.notifTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title || 'Notification'}
                    </Text>
                    <Text style={[styles.notifBody, { color: theme.textSecondary }]} numberOfLines={2}>
                      {item.body || ''}
                    </Text>
                    <Text style={[styles.notifTime, { color: theme.textMuted }]}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>
                  {!item.read && (
                    <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  skeletonContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  notifCard: { marginBottom: 12, padding: 14 },
  notifRead: { opacity: 0.7 },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  notifBody: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11 },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
  bottomSpacer: { height: 40 },
});
