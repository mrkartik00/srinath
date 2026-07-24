import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { register } from '@videosdk.live/react-native-sdk';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

// Register VideoSDK native services (WebRTC, InCallManager) before the app
// mounts. Required for video consultations. No-op in Expo Go (needs a
// development build).
register();

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
