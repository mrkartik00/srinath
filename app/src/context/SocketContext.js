import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { addNotification } from '../utils/notificationsHelper';
import { API_BASE_URL, silentRefresh } from '../api/axios';

const SocketContext = createContext(null);

/**
 * SocketProvider — maintains a single authenticated socket connection for the RN app.
 * Listens for video:incoming and video:ended globally.
 */
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    let socket = null;

    const connect = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user) {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setConnected(false);
        }
        return;
      }

      if (socketRef.current?.connected) return;

      socket = io(API_BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 3000,
      });

      socketRef.current = socket;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      // On auth error, refresh token and reconnect
      socket.on('connect_error', async (err) => {
        if (err.message === 'Invalid token' || err.message === 'No token') {
          try {
            const newToken = await silentRefresh();
            socket.auth = { token: newToken };
            socket.connect();
          } catch {
            // Refresh failed — stop retrying with a bad token; axios will handle
            // the full logout on the next API call.
            socket.disconnect();
          }
        }
      });

      // ── Video & Notification events ──────────────────────────────────
      socket.on('video:incoming', (data) => {
        setIncomingCall(data);
        addNotification({
          title: 'Video Call Started',
          message: `Dr. ${data.doctorName || 'Doctor'} has started your video consultation.`,
          type: 'video',
        });
      });

      socket.on('video:ended', (data) => {
        setIncomingCall((prev) => (prev?.appointmentId === data.appointmentId ? null : prev));
        addNotification({
          title: 'Video Call Ended',
          message: 'Your video consultation has ended.',
          type: 'video',
        });
      });

      socket.on('message:new', (data) => {
        const msg = data?.message || data;
        if (msg && msg.senderId?._id !== user?.id && msg.senderId !== user?.id) {
          addNotification({
            title: 'New Chat Message',
            message: `${msg.senderId?.name || 'Doctor'}: ${msg.content || 'Sent an attachment'}`,
            type: 'chat',
          });
        }
      });
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [user]);

  const dismissIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        getSocket,
        connected,
        incomingCall,
        dismissIncomingCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
