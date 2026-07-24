import { useEffect, useMemo, useRef } from 'react';
import { useParticipant } from '@videosdk.live/react-sdk';

/**
 * VideoTile — renders a single participant's video/audio stream.
 * Shows avatar when camera is off, name overlay, and handles screen share.
 */
export default function VideoTile({ participantId, isLocal = false, label, large = false }) {
  const {
    webcamStream,
    micStream,
    webcamOn,
    micOn,
    isLocal: isLocalParticipant,
    displayName,
    screenShareStream,
    screenShareOn,
  } = useParticipant(participantId);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const screenShareRef = useRef(null);

  // Attach webcam stream
  useEffect(() => {
    if (videoRef.current) {
      if (webcamOn && webcamStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(webcamStream.track);
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [webcamStream, webcamOn]);

  // Attach audio stream (only for remote participants)
  useEffect(() => {
    if (audioRef.current && !isLocal) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        audioRef.current.srcObject = mediaStream;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn, isLocal]);

  // Attach screen share stream
  useEffect(() => {
    if (screenShareRef.current) {
      if (screenShareOn && screenShareStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(screenShareStream.track);
        screenShareRef.current.srcObject = mediaStream;
        screenShareRef.current.play().catch(() => {});
      } else {
        screenShareRef.current.srcObject = null;
      }
    }
  }, [screenShareStream, screenShareOn]);

  const name = label || displayName || 'Participant';
  const initials = useMemo(() => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: large ? 16 : 12,
    overflow: 'hidden',
    background: '#1e293b',
  };

  const videoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: isLocal ? 'scaleX(-1)' : 'none',
  };

  const avatarStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  };

  const initialsStyle = {
    width: large ? 80 : 48,
    height: large ? 80 : 48,
    borderRadius: '50%',
    background: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: large ? 28 : 18,
    fontWeight: 700,
    color: '#fff',
  };

  const nameOverlayStyle = {
    position: 'absolute',
    bottom: 8,
    left: 8,
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 12,
    padding: '4px 8px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  return (
    <div style={containerStyle}>
      {/* Screen share takes priority */}
      {screenShareOn && screenShareStream ? (
        <video
          ref={screenShareRef}
          autoPlay
          playsInline
          style={{ ...videoStyle, transform: 'none', objectFit: 'contain', background: '#000' }}
        />
      ) : webcamOn && webcamStream ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} style={videoStyle} />
      ) : (
        <div style={avatarStyle}>
          <div style={initialsStyle}>{initials}</div>
        </div>
      )}

      {/* Audio element for remote participants */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Name overlay */}
      <div style={nameOverlayStyle}>
        {!micOn && <span style={{ fontSize: 10 }}>🔇</span>}
        <span>{isLocal ? 'You' : name}</span>
      </div>
    </div>
  );
}
