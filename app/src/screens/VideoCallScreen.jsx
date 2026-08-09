import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeModules } from 'react-native';
import haptics from '../utils/haptics';

import { joinVideoCall } from '../api/video';

// Check if native WebRTC C++ binary is compiled into the app (Dev Build / Standalone)
const hasNativeWebRTC = Boolean(NativeModules.WebRTCModule);

let MeetingProvider = null;
let useMeeting = null;
let useParticipant = null;
let RTCView = null;
let MediaStream = null;

if (hasNativeWebRTC) {
  try {
    const videoSDK = require('@videosdk.live/react-native-sdk');
    MeetingProvider = videoSDK.MeetingProvider;
    useMeeting = videoSDK.useMeeting;
    useParticipant = videoSDK.useParticipant;
    RTCView = videoSDK.RTCView;
    MediaStream = videoSDK.MediaStream;
  } catch (err) {
    console.warn('Failed to load VideoSDK components:', err.message);
  }
}

/**
 * VideoCallScreen — native in-app video consultation (patient side).
 * Route params: { appointmentId, token, roomId, participantName, doctorName }
 */
export default function VideoCallScreen({ route, navigation }) {
  const { 
    token: initialToken, 
    roomId: initialRoomId, 
    appointmentId, 
    participantName, 
    doctorName 
  } = route.params || {};

  const [session, setSession] = useState({
    token: initialToken || null,
    roomId: initialRoomId || null,
  });
  const [loading, setLoading] = useState(!initialToken || !initialRoomId);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (session.token && session.roomId) {
      setLoading(false);
      return;
    }

    if (!appointmentId) {
      setErrorMsg('Missing appointment ID or session credentials.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchSession() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const response = await joinVideoCall(appointmentId);
        
        // Handle all response formats (axios interceptor unwrapped vs raw)
        const token = response?.data?.token || response?.token || response?.data?.data?.token;
        const roomId = response?.data?.roomId || response?.roomId || response?.data?.data?.roomId;

        if (isMounted) {
          if (token && roomId) {
            setSession({ token, roomId });
          } else {
            setErrorMsg(response?.message || 'Failed to get video session credentials.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch video call credentials:', err);
          const serverMsg = typeof err === 'string' ? err : (err?.response?.data?.message || err?.message);
          setErrorMsg(serverMsg || 'Could not join video session.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [appointmentId, initialToken, initialRoomId, session.token, session.roomId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Initializing video room...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg || !session.token || !session.roomId) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
        <Text style={styles.errorText}>{errorMsg || 'Missing video session credentials'}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!hasNativeWebRTC || !MeetingProvider) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="videocam-off-outline" size={48} color="#94a3b8" />
        <Text style={styles.errorText}>Video Consultation Requires Development Build</Text>
        <Text style={[styles.errorText, { fontSize: 13, color: '#64748b', marginTop: 4 }]}>
          Native WebRTC video calls are not supported inside the standard Expo Go app.
          Please use a native development build or run via Web.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: session.roomId,
        micEnabled: true,
        webcamEnabled: true,
        name: participantName || 'Patient',
        // Stable per-session id so a rejoin EVICTS the previous session
        // instead of leaving a ghost participant (frozen duplicate tile).
        participantId: `patient_${session.roomId}`,
      }}
      token={session.token}
    >
      <MeetingView onLeave={() => navigation.goBack()} participantName={participantName || doctorName} />
    </MeetingProvider>
  );
}

function MeetingView({ onLeave, participantName }) {
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const joinTimerRef = useRef(null);
  const joinedRef = useRef(false);
  const facingRef = useRef('front'); // current camera: 'front' | 'back'

  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    changeWebcam,
    getWebcams,
    participants,
    localParticipant,
    localMicOn,
    localWebcamOn,
  } = useMeeting({
    onMeetingJoined: () => {
      joinedRef.current = true;
      if (joinTimerRef.current) clearTimeout(joinTimerRef.current);
      setError(null);
      setJoined(true);
    },
    onMeetingLeft: () => onLeave?.(),
    onError: (err) => {
      // Surface the real reason so a failed connect is not an invisible hang.
      // eslint-disable-next-line no-console
      console.error('[VideoSDK][patient] error:', JSON.stringify(err));
      setError(mapMeetingError(err));
    },
  });

  const startJoin = () => {
    setError(null);
    joinedRef.current = false;
    if (joinTimerRef.current) clearTimeout(joinTimerRef.current);
    // If join hasn't completed within 25s, stop the silent spinner and show a
    // retry so the user (and logs) know the connection stalled.
    joinTimerRef.current = setTimeout(() => {
      if (!joinedRef.current) {
        setError('Connection timed out. Check your network and camera/microphone permissions, then retry.');
      }
    }, 25000);
    try {
      join();
    } catch (err) {
      setError(mapMeetingError(err));
    }
  };

  useEffect(() => {
    startJoin();
    return () => {
      if (joinTimerRef.current) clearTimeout(joinTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remote participants (the doctor)
  const participantIds = [...participants.keys()];
  const remoteId = participantIds.find((id) => id !== localParticipant?.id) || null;

  const handleLeave = () => {
    haptics.medium();
    try { leave(); } catch (_) { /* ignore */ }
    onLeave?.();
  };

  const handleRetry = () => {
    haptics.light();
    startJoin();
  };

  const handleToggleMic = () => {
    haptics.light();
    toggleMic();
  };

  const handleToggleCam = () => {
    haptics.light();
    toggleWebcam();
  };

  const handleFlipCamera = async () => {
    haptics.light();
    const next = facingRef.current === 'front' ? 'back' : 'front';
    try {
      // Prefer selecting the specific device so we control front/back explicitly.
      if (typeof getWebcams === 'function' && typeof changeWebcam === 'function') {
        const cams = await getWebcams();
        const wantBack = next === 'back';
        const target = (cams || []).find((c) => {
          const f = String(c?.facingMode || '').toLowerCase();
          const l = String(c?.label || '').toLowerCase();
          return wantBack
            ? f.includes('environment') || f.includes('back') || l.includes('back')
            : f.includes('user') || f.includes('front') || l.includes('front');
        });
        if (target?.deviceId) {
          await changeWebcam(target.deviceId);
          facingRef.current = next;
          return;
        }
      }
      // Fallback: some SDK versions flip with a no-arg call.
      if (typeof changeWebcam === 'function') {
        await changeWebcam();
        facingRef.current = next;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[VideoSDK][patient] camera flip failed:', err?.message || err);
    }
  };

  // Not yet joined: show either a diagnosable error (with retry) or the spinner.
  if (!joined) {
    if (error) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <StatusBar barStyle="light-content" />
          <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
          <Text style={styles.errorText}>Couldn’t connect to the call</Text>
          <Text style={[styles.errorText, { fontSize: 13, color: '#94a3b8', marginTop: 4 }]}>{error}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity style={styles.errorButton} onPress={handleRetry}>
              <Text style={styles.errorButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.errorButton, { backgroundColor: '#1e293b' }]} onPress={handleLeave}>
              <Text style={styles.errorButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Connecting to your doctor…</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Remote (doctor) video — full screen */}
      <View style={styles.remoteContainer}>
        {remoteId ? (
          <ParticipantTile participantId={remoteId} large label="Doctor" />
        ) : (
          <View style={styles.waitingContainer}>
            <View style={styles.pulseCircle}>
              <Ionicons name="medical" size={32} color="#22c55e" />
            </View>
            <Text style={styles.waitingTitle}>Connecting to doctor…</Text>
            <Text style={styles.waitingSubtitle}>
              Please wait, the doctor will join shortly
            </Text>
          </View>
        )}
      </View>

      {/* Local (self) video — PIP */}
      {localParticipant && (
        <View style={styles.localPip}>
          <ParticipantTile
            participantId={localParticipant.id}
            isLocal
            label={participantName || 'You'}
          />
        </View>
      )}

      {/* Controls */}
      <SafeAreaView style={styles.controlsContainer}>
        <View style={styles.controlsBar}>
          <TouchableOpacity
            style={[styles.controlButton, !localMicOn && styles.controlButtonOff]}
            onPress={handleToggleMic}
          >
            <Ionicons name={localMicOn ? 'mic' : 'mic-off'} size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !localWebcamOn && styles.controlButtonOff]}
            onPress={handleToggleCam}
          >
            <Ionicons name={localWebcamOn ? 'videocam' : 'videocam-off'} size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !localWebcamOn && styles.controlButtonDisabled]}
            onPress={handleFlipCamera}
            disabled={!localWebcamOn}
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
            <Ionicons
              name="call"
              size={24}
              color="#fff"
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ParticipantTile({ participantId, isLocal = false, label, large = false }) {
  const { webcamStream, webcamOn, micOn, displayName } = useParticipant(participantId);

  const name = label || displayName || 'Participant';

  return (
    <View style={[styles.tile, large && styles.tileLarge]}>
      {webcamOn && webcamStream ? (
        <RTCView
          streamURL={new MediaStream([webcamStream.track]).toURL()}
          objectFit="cover"
          style={styles.rtcView}
          mirror={isLocal}
        />
      ) : (
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, large && styles.avatarLarge]}>
            <Text style={[styles.avatarText, large && styles.avatarTextLarge]}>
              {getInitials(name)}
            </Text>
          </View>
        </View>
      )}

      {/* Name overlay */}
      <View style={styles.nameOverlay}>
        {!micOn && <Ionicons name="mic-off" size={12} color="#fff" />}
        <Text style={styles.nameText}>{isLocal ? 'You' : name}</Text>
      </View>
    </View>
  );
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Translate a VideoSDK error into an actionable message. Common codes:
 *  - 4001/4002/4003/4004/4005/4006: token invalid/expired/permission
 *  - 3001/3002/3016: media (camera/mic) access denied or unavailable
 * Falls back to the raw message/code so the on-screen text + logs are useful.
 */
function mapMeetingError(err) {
  const code = err?.code ?? err?.errorCode;
  const raw = err?.message || (code != null ? `Error ${code}` : 'Video connection error');
  switch (String(code)) {
    case '4001':
    case '4002':
    case '4003':
    case '4004':
    case '4005':
    case '4006':
      return `Session token was rejected (code ${code}). Please rejoin the call.`;
    case '3001':
    case '3002':
    case '3016':
      return 'Camera/microphone access is blocked. Enable it in iOS Settings → Janki Care, then retry.';
    default:
      return raw;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  remoteContainer: {
    flex: 1,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  pulseCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  waitingTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '600',
  },
  waitingSubtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  localPip: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 110,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
    backgroundColor: '#1e293b',
  },
  tile: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  tileLarge: {
    flex: 1,
  },
  rtcView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  avatarTextLarge: {
    fontSize: 36,
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  nameText: {
    color: '#fff',
    fontSize: 12,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonOff: {
    backgroundColor: '#ef4444',
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  leaveButton: {
    width: 64,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
