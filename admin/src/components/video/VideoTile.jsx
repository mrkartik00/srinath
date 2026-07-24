import { useEffect, useMemo, useRef } from 'react';
import { useParticipant } from '@videosdk.live/react-sdk';

export default function VideoTile({ participantId, isLocal }) {
  const {
    webcamStream,
    webcamOn,
    micStream,
    micOn,
    screenShareStream,
    screenShareOn,
    displayName,
    isLocal: isLocalParticipant,
  } = useParticipant(participantId);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const screenShareRef = useRef(null);

  const local = isLocal || isLocalParticipant;

  // Attach webcam stream
  useEffect(() => {
    if (webcamOn && webcamStream && videoRef.current) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [webcamStream, webcamOn]);

  // Attach audio stream (remote participants only — never play own mic back)
  useEffect(() => {
    if (audioRef.current && !local) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        audioRef.current.srcObject = mediaStream;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn, local]);

  // Attach screen share stream
  useEffect(() => {
    if (screenShareOn && screenShareStream && screenShareRef.current) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(screenShareStream.track);
      screenShareRef.current.srcObject = mediaStream;
      screenShareRef.current.play().catch(() => {});
    } else if (screenShareRef.current) {
      screenShareRef.current.srcObject = null;
    }
  }, [screenShareStream, screenShareOn]);

  const initials = useMemo(() => {
    if (!displayName) return '?';
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [displayName]);

  return (
    <div style={styles.container}>
      {/* Screen share (shown above webcam when active) */}
      {screenShareOn && (
        <div style={styles.screenShareWrapper}>
          <video
            ref={screenShareRef}
            autoPlay
            playsInline
            style={styles.screenShareVideo}
          />
          <div style={styles.screenShareLabel}>Screen Share</div>
        </div>
      )}

      {/* Webcam or avatar */}
      <div style={styles.videoWrapper}>
        {webcamOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal || isLocalParticipant}
            style={{
              ...styles.video,
              transform: isLocal || isLocalParticipant ? 'scaleX(-1)' : 'none',
            }}
          />
        ) : (
          <div style={styles.avatar}>
            <span style={styles.initials}>{initials}</span>
          </div>
        )}

        {/* Name overlay */}
        <div style={styles.nameOverlay}>
          <span style={styles.nameText}>
            {displayName || 'Participant'}
            {(isLocal || isLocalParticipant) && ' (You)'}
          </span>
          {!micOn && <span style={styles.micOff}>🔇</span>}
        </div>
      </div>

      {/* Audio element for remote participants (never for local — avoids echo) */}
      {!local && <audio ref={audioRef} autoPlay playsInline />}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 16,
    overflow: 'hidden',
    background: '#1a1a2e',
  },
  screenShareWrapper: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    background: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  screenShareVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  screenShareLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 6,
  },
  videoWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderRadius: 16,
  },
  initials: {
    fontSize: 48,
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: 2,
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    padding: '6px 12px',
    borderRadius: 8,
  },
  nameText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
  },
  micOff: {
    fontSize: 12,
  },
};
