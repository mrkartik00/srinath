import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFonts, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import haptics from '../../utils/haptics';

const PRIMARY_COLOR = '#223263';
const TEXT_SECONDARY = '#8F9BB3';

export default function FloatingGlassNav({ state, navigation }) {
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
      <View style={styles.pill}>
        {tabs.map((tab, i) => {
          const active = state.index === i;
          return (
            <TouchableOpacity
              key={tab.name}
              style={active ? styles.tabBtnActive : styles.tabBtn}
              onPress={() => { haptics.selection(); navigation.navigate(tab.name); }}
              activeOpacity={0.8}
            >
              <Feather 
                name={tab.icon} 
                size={20} 
                color={active ? '#FFFFFF' : PRIMARY_COLOR} 
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
    alignItems: 'center' 
  },
  pill: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF',
    borderRadius: 36, 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    shadowColor: '#223263', 
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 24, 
    elevation: 10,
    borderWidth: 1,
    borderColor: '#EEF2F8',
  },
  tabBtn: { 
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnActive: { 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 48,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  }
});
