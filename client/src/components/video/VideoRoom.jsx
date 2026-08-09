import { useState, useEffect, useRef } from 'react';
import { MeetingProvider, useMeeting } from '@videosdk.live/react-sdk';
import VideoTile from './VideoTile';
import VideoControls from './VideoControls';

/**
 * VideoRoom — patient-side video consultation room.
 * Props: { token, roomId, onCallEnd, participantName, onTokenExpired }
 * Uses MeetingProvider from @videosdk.live/react-sdk.
 * Layout: large remote video + small local PIP, controls at bottom.
 * Responsive — works on mobile browsers.
 *
 * `onTokenExpired` (optional async) is invoked when the SDK reports an
 * expired/invalid token (error 4002). The parent should re-fetch a fresh
 * token; changing the `token` prop remounts the meeting via `key`.
 */
export default function VideoRoom({ token, roomId, onCallEnd, participantName, onTokenExpired }) {
  // `attempt` forces a MeetingProvider remount on every recovery, even when the
  // refetched token is byte-identical (same-second JWT issuance produces the
  // exact same string, so keying on `token` alone would NOT remount).
  const [attempt, setAttempt] = useState(0);
  const refreshCount = useRef(0);
  const recovering = useRef(false);

  // Guard: never hand an empty meetingId/token to the SDK (would 4002/crash).
  if (!token || !roomId) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#f87171' }}>
        <p style={{ fontSize: 16 }}>Missing video session credentials.</p>
        <button onClick={onCallEnd} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}>Close</button>
      </div>
    );
  }

  const handleExpired = async () => {
    // Ignore overlapping error callbacks while a recovery is already in flight.
    if (recovering.current || refreshCount.current >= 3) return;
    recovering.current = true;
    refreshCount.current += 1;

    try {
      // Small backoff lets the wall clock advance (so a freshly minted JWT is
      // no longer identical) and lets the SDK tear down before we rejoin.
      await new Promise((r) => setTimeout(r, 1200));
      if (onTokenExpired) await onTokenExpired();
    } finally {
      // Bumping `attempt` remounts MeetingProvider unconditionally.
      setAttempt((n) => n + 1);
      recovering.current = false;
    }
  };

  return (
    <MeetingProvider
      key={`${token}-${attempt}`}
      config={{
        meetingId: roomId,
        micEnabled: true,
        webcamEnabled: true,
        name: participantName || 'Patient',
        // Stable per-session id so a rejoin EVICTS the previous session
        // instead of leaving a ghost participant (frozen duplicate tile).
        participantId: `patient_${roomId}`,
        debugMode: false,
      }}
      token={token}
    >
      <VideoRoomInner onCallEnd={onCallEnd} participantName={participantName} onExpired={handleExpired} />
    </MeetingProvider>
  );
}

function VideoRoomInner({ onCallEnd, participantName, onExpired }) {
  const [meetingError, setMeetingError] = useState(null);
  const { join, participants, localParticipant, meetingId } = useMeeting({
    onMeetingJoined: () => {
      // eslint-disable-next-line no-console
      console.log('[VideoSDK] meeting joined:', meetingId);
    },
    onMeetingLeft: () => {
      onCallEnd?.();
    },
    onParticipantJoined: (p) => {
      // eslint-disable-next-line no-console
      console.log('[VideoSDK] participant joined:', p?.id);
    },
    onError: (err) => {
      // eslint-disable-next-line no-console
      console.error('[VideoSDK] error:', err);
      // 4002 = token empty/invalid/expired → transparently refresh + rejoin.
      if (err?.code === 4002 || err?.code === '4002') {
        setMeetingError('Session expired — reconnecting…');
        onExpired?.();
      } else {
        setMeetingError(err?.message || err?.code || 'Video connection error');
      }
    },
  });
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    join();
    setJoined(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get remote participants (doctor)
  const remoteParticipants = [...participants.keys()].filter(
    (id) => id !== localParticipant?.id
  );
  const remoteId = remoteParticipants[0] || null;

  const containerStyle = {
    position: 'fixed',
    inset: 0,
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10000,
  };

  const videoAreaStyle = {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    minHeight: 0,
  };

  const remoteVideoStyle = {
    width: '100%',
    height: '100%',
    maxWidth: 900,
    maxHeight: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  };

  const localPipStyle = {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 140,
    height: 105,
    borderRadius: 12,
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    zIndex: 10,
  };

  // Mobile-responsive PIP
  const localPipMobileStyle = {
    ...localPipStyle,
    width: 110,
    height: 82,
    bottom: 16,
    right: 16,
  };

  const controlsWrapperStyle = {
    display: 'flex',
    justifyContent: 'center',
    padding: '12px 16px 24px',
    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
  };

  const waitingStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    color: '#94a3b8',
    height: '100%',
    textAlign: 'center',
    padding: 24,
  };

  const pulseAnimation = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(34, 197, 94, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'pulse 2s ease-in-out infinite',
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div style={containerStyle}>
      {/* Keyframe animation for pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.4; }
        }
      `}</style>

      {meetingError && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
          background: '#dc2626', color: '#fff', padding: '10px 16px',
          fontSize: 13, textAlign: 'center', fontWeight: 500,
        }}>
          ⚠️ Video error: {meetingError}
        </div>
      )}

      {/* Video Area */}
      <div style={videoAreaStyle}>
        {remoteId ? (
          <div style={remoteVideoStyle}>
            <VideoTile participantId={remoteId} large label="Doctor" />
          </div>
        ) : (
          <div style={waitingStyle}>
            <div style={pulseAnimation}>
              <span style={{ fontSize: 28 }}>👨‍⚕️</span>
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                Connecting to doctor...
              </p>
              <p style={{ fontSize: 14, marginTop: 8, color: '#64748b' }}>
                Please wait, the doctor will join shortly
              </p>
            </div>
          </div>
        )}

        {/* Local PIP (self view) */}
        {localParticipant && (
          <div style={isMobile ? localPipMobileStyle : localPipStyle}>
            <VideoTile
              participantId={localParticipant.id}
              isLocal
              label={participantName || 'You'}
            />
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div style={controlsWrapperStyle}>
        <VideoControls onLeave={onCallEnd} />
      </div>
    </div>
  );
}
