import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import BookAppointmentScreen from '../screens/BookAppointmentScreen';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import PrescriptionsScreen from '../screens/PrescriptionsScreen';
import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen';
import RemindersScreen from '../screens/RemindersScreen';
import ChatScreen from '../screens/ChatScreen';
import MedicalVaultScreen from '../screens/MedicalVaultScreen';
import DoctorsScreen from '../screens/DoctorsScreen';
import DoctorDetailScreen from '../screens/DoctorDetailScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import VideoCallScreen from '../screens/VideoCallScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  dark: false,
  colors: { background: '#F2F2F7', border: '#E5E5EA', card: '#fff', primary: '#007AFF', text: '#000', notification: '#FF9500' },
  fonts: {
    regular: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontWeight: '400' },
    medium: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontWeight: '500' },
    bold: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontWeight: '700' },
    heavy: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontWeight: '800' },
  },
};

const MIN_SPLASH_MS = 1600;

export default function RootNavigator() {
  const { user, loading, justLoggedIn } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !minTimeElapsed) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navTheme} independent={true}>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={justLoggedIn ? 'Welcome' : 'Main'}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
          <Stack.Screen name="Prescriptions" component={PrescriptionsScreen} />
          <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="ChatConversation" component={ChatScreen} />
          <Stack.Screen name="MedicalVault" component={MedicalVaultScreen} />
          <Stack.Screen name="Doctors" component={DoctorsScreen} />
          <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
