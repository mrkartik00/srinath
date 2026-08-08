import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFonts, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import haptics from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';

export default function FloatingGlassNav({ state, navigation }) {
  const { theme } = useTheme();
  const [fontsLoaded] = useFonts({ Urbanist_700Bold });

  const tabs = [
    { name: 'Home', icon: 'home', label: 'Home' },
    { name: 'Appointments', icon: 'calendar', label: 'Schedule' },
    { name: 'Chat', icon: 'message-square', label: 'Chat' },
    { name: 'Health', icon: 'activity', label: 'Health' },
  ];

  const fontStyle = fontsLoaded ? { fontFamily: 'Urbanist_700Bold' } : { fontWeight: '700' };

  return (
    <View style={styles.container}>
      <View style={[styles.pill, {
        backgroundColor: theme.card,
        borderColor: theme.glassBorder,
        shadowColor: theme.shadow,
      }]}>
        {tabs.map((tab, i) => {
          const active = state.index === i;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[
                active
                  ? [styles.tabBtnActive, { backgroundColor: theme.primary }]
                  : [styles.tabBtn, { backgroundColor: theme.chipBg }],
              ]}
              onPress={() => { haptics.selection(); navigation.navigate(tab.name); }}
              activeOpacity={0.8}
            >
              <Feather
                name={tab.icon}
                size={20}
                color={active ? '#FFFFFF' : theme.primary}
              />
              {active && (
                <Text style={[styles.tabLabel, fontStyle]}>
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 36,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
  },
  tabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 48,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
});
