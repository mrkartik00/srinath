import { Platform } from 'react-native';

let Haptics = null;

// Dynamically import expo-haptics — falls back to Vibration on web/unsupported
try {
  Haptics = require('expo-haptics');
} catch {
  Haptics = null;
}

/**
 * Janki Care Haptics — Premium tactile feedback using real Taptic Engine.
 *
 * Uses expo-haptics for true taptic impact/notification/selection feedback
 * on iOS (Taptic Engine) and Android (vibrator patterns). Falls back to
 * Vibration API on web or if expo-haptics is unavailable.
 *
 * Interaction → Haptic mapping:
 *   selection → chips, tabs, toggles, filter taps, list-row selection
 *   light    → navigation pushes, card taps, pull-to-refresh start
 *   medium   → primary CTAs (Book, Save, Send, Subscribe, Upload)
 *   heavy    → destructive confirmations (cancel, delete, logout)
 *   success  → successful mutations (booked, saved, uploaded, taken)
 *   error    → failed mutation or validation error
 *   warning  → attention-needed (snooze, pending states)
 */

const fallbackVibrate = (ms) => {
  try {
    const { Vibration } = require('react-native');
    Vibration.vibrate(ms);
  } catch {}
};

const fallbackPattern = (pattern) => {
  try {
    const { Vibration } = require('react-native');
    Vibration.vibrate(pattern);
  } catch {}
};

export const haptics = {
  /** Subtle selection change — chips, toggles, segment taps */
  selection: () => {
    if (Haptics) {
      Haptics.selectionAsync();
    } else {
      fallbackVibrate(5);
    }
  },

  /** Light tap — navigation, card press, refresh trigger */
  light: () => {
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      fallbackVibrate(Platform.OS === 'android' ? 8 : 10);
    }
  },

  /** Medium tap — primary actions (Book, Save, Send) */
  medium: () => {
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      fallbackVibrate(Platform.OS === 'android' ? 15 : 20);
    }
  },

  /** Heavy tap — destructive confirmations (Cancel, Delete, Logout) */
  heavy: () => {
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      fallbackVibrate(Platform.OS === 'android' ? 30 : 35);
    }
  },

  /** Success notification — completed mutations */
  success: () => {
    if (Haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      fallbackPattern([0, 15, 50, 15]);
    }
  },

  /** Error notification — failed mutations */
  error: () => {
    if (Haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      fallbackPattern([0, 30, 50, 30, 50, 30]);
    }
  },

  /** Warning notification — attention needed */
  warning: () => {
    if (Haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      fallbackPattern([0, 20, 80, 20]);
    }
  },
};

export default haptics;
