import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import haptics from '../../utils/haptics';

export default function FloatingGlassNav({ state, navigation }) {
  const { theme } = useTheme();

  const tabs = [
    { name: 'Home', icon: 'heart-outline', activeIcon: 'heart', color: theme.heart },
    { name: 'Appointments', icon: 'calendar-outline', activeIcon: 'calendar', color: theme.primary },
    { name: 'Chat', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', color: theme.teal },
    { name: 'Health', icon: 'leaf-outline', activeIcon: 'leaf', color: theme.success },
    { name: 'Profile', icon: 'person-outline', activeIcon: 'person', color: theme.purple },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {tabs.map((tab, i) => {
          const active = state.index === i;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabBtn}
              onPress={() => { haptics.selection(); navigation.navigate(tab.name); }}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIcon, active && { backgroundColor: `${tab.color}1A` }]}>
                <Ionicons name={active ? tab.activeIcon : tab.icon} size={22} color={active ? tab.color : theme.textMuted} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: Platform.OS === 'ios' ? 34 : 16, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  pill: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  tabBtn: { alignItems: 'center', paddingHorizontal: 10 },
  tabIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
});
