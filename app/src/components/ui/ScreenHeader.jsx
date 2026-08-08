import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import haptics from '../../utils/haptics';

/**
 * ScreenHeader — large title header with optional back button & right action.
 */
export default function ScreenHeader({ title, subtitle, onBack, rightIcon, onRightPress, rightComponent }) {
  const { theme } = useTheme();
  const isAndroid = Platform.OS === 'android';
  const backIcon = isAndroid ? 'arrow-back' : 'chevron-back';

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {onBack && (
          <TouchableOpacity
            onPress={() => { haptics.light(); onBack(); }}
            style={[styles.backBtn, { backgroundColor: theme.chipBg }]}
            activeOpacity={0.7}
          >
            <Ionicons name={backIcon} size={isAndroid ? 20 : 22} color={theme.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (rightIcon && onRightPress && (
        <TouchableOpacity
          onPress={() => { haptics.light(); onRightPress(); }}
          style={[styles.rightBtn, { backgroundColor: theme.chipBg }]}
          activeOpacity={0.7}
        >
          <Ionicons name={rightIcon} size={20} color={theme.primary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const androidTopPadding = (StatusBar.currentHeight || 28) + 10;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Platform.OS === 'android' ? 14 : 20,
    paddingTop: Platform.OS === 'ios' ? 60 : androidTopPadding,
  },
  leftRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  titleBlock: { flex: 1 },
  title: {
    fontSize: Platform.OS === 'android' ? 26 : 32,
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, marginTop: 2, fontFamily: 'Urbanist_600SemiBold' },
  rightBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
