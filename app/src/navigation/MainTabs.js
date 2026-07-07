import React, { useState } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import HealthFeedScreen from '../screens/HealthFeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FloatingGlassNav from '../components/ui/FloatingGlassNav';
import DrawerMenu from '../components/ui/DrawerMenu';

const Tab = createBottomTabNavigator();

export default function MainTabs({ navigation }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => !drawerOpen ? <FloatingGlassNav {...props} /> : null}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home">
          {(props) => <HomeScreen {...props} onOpenDrawer={() => setDrawerOpen(true)} />}
        </Tab.Screen>
        <Tab.Screen name="Appointments" component={AppointmentsScreen} />
        <Tab.Screen name="Chat" component={ChatListScreen} />
        <Tab.Screen name="Health" component={HealthFeedScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      {drawerOpen && <DrawerMenu navigation={navigation} onClose={() => setDrawerOpen(false)} />}
    </View>
  );
}
