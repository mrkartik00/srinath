import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const STORAGE_KEY = 'notification_history';

export const addNotification = async ({ title, message, type = 'info' }) => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const list = stored ? JSON.parse(stored) : [];

    // Avoid exact duplicate notifications generated within 10 seconds
    const isDuplicate = list.some(
      (n) => n.title === title && n.message === message && Date.now() - new Date(n.time).getTime() < 10000
    );
    if (isDuplicate) return;

    const newNotif = {
      id: Date.now().toString(),
      title,
      message,
      time: new Date().toISOString(),
      read: false,
      type,
    };
    const updated = [newNotif, ...list.slice(0, 49)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    DeviceEventEmitter.emit('notifications_updated');
  } catch (err) {
    console.error('Failed to add notification:', err);
  }
};

export const hasUnreadNotifications = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const list = JSON.parse(stored);
    return list.some((n) => !n.read);
  } catch (_) {
    return false;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const list = JSON.parse(stored);
    const updated = list.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    DeviceEventEmitter.emit('notifications_updated');
  } catch (err) {
    console.error('Failed to mark notifications as read:', err);
  }
};
