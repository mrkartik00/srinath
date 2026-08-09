import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { silentRefresh } from '../api/axios';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const SocketContext = createContext(null);

/**
 * SocketProvider — maintains a single authenticated socket connection.
 * Listens for video:incoming and video:ended globally so any screen can react.
 */
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { appointmentId, doctorName, guestLink }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
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

    // ── Video call events (global) ──────────────────────────────────────
    socket.on('video:incoming', (data) => {
      setIncomingCall(data);
    });

    socket.on('video:ended', (data) => {
      setIncomingCall((prev) =>
        prev?.appointmentId === data.appointmentId ? null : prev
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
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
