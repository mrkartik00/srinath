import React from 'react';
import { NativeModules } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

// Safely register VideoSDK media globals (react-native-webrtc) only if native module exists in binary
if (NativeModules.WebRTCModule) {
  try {
    const { register } = require('@videosdk.live/react-native-sdk');
    register();
  } catch (err) {
    console.warn('VideoSDK native module registration skipped:', err.message);
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
