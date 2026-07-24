import { useMemo } from 'react';
import { useParticipant, VideoPlayer, AudioPlayer } from '@videosdk.live/react-sdk';

/**
 * VideoTile — renders a single participant's video/audio stream.
 * Uses the SDK's VideoPlayer (video/screen-share) and AudioPlayer (mic) which
 * automatically consume and render the participant's streams. Shows an avatar
 * when the camera is off and a name overlay.
 */
export default function VideoTile({ participantId, isLocal = false, label, large = false }) {
  const {
    webcamOn,
    micOn,
    isLocal: isLocalParticipant,
    displayName,
    screenShareOn,
  } = useParticipant(participantId);

  const local = isLocal || isLocalParticipant;
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
    transform: local ? 'scaleX(-1)' : 'none',
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
    zIndex: 5,
  };

  const fill = { width: '100%', height: '100%' };

  return (
    <div style={containerStyle}>
      {/* Screen share takes priority, then webcam, then avatar */}
      {screenShareOn ? (
        <VideoPlayer
          participantId={participantId}
          type="share"
          containerStyle={fill}
          videoStyle={{ ...fill, objectFit: 'contain', background: '#000' }}
        />
      ) : webcamOn ? (
        <VideoPlayer
          participantId={participantId}
          type="video"
          containerStyle={fill}
          videoStyle={videoStyle}
        />
      ) : (
        <div style={avatarStyle}>
          <div style={initialsStyle}>{initials}</div>
        </div>
      )}

      {/* Audio for remote participants only (never local — avoids echo) */}
      {!local && <AudioPlayer participantId={participantId} type="audio" />}

      {/* Name overlay */}
      <div style={nameOverlayStyle}>
        {!micOn && <span style={{ fontSize: 10 }}>🔇</span>}
        <span>{local ? 'You' : name}</span>
      </div>
    </div>
  );
}
