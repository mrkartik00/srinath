import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import HealthFeedScreen from '../screens/HealthFeedScreen';
import FloatingGlassNav from '../components/ui/FloatingGlassNav';

const Tab = createBottomTabNavigator();

export default function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingGlassNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Health" component={HealthFeedScreen} />
    </Tab.Navigator>
  );
}
