import { useMemo } from 'react';
import { useParticipant, VideoPlayer, AudioPlayer } from '@videosdk.live/react-sdk';

/**
 * VideoTile (admin/doctor) — renders a participant's video/audio.
 * Uses the SDK's VideoPlayer (video/screen-share) and AudioPlayer (mic) which
 * automatically consume and render the participant's streams.
 */
export default function VideoTile({ participantId, isLocal }) {
  const {
    webcamOn,
    micOn,
    screenShareOn,
    displayName,
    isLocal: isLocalParticipant,
  } = useParticipant(participantId);

  const local = isLocal || isLocalParticipant;

  const initials = useMemo(() => {
    if (!displayName) return '?';
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [displayName]);

  const fill = { width: '100%', height: '100%' };

  return (
    <div style={styles.container}>
      {/* Screen share (shown above webcam when active) */}
      {screenShareOn && (
        <div style={styles.screenShareWrapper}>
          <VideoPlayer
            participantId={participantId}
            type="share"
            containerStyle={fill}
            videoStyle={{ ...fill, objectFit: 'contain' }}
          />
          <div style={styles.screenShareLabel}>Screen Share</div>
        </div>
      )}

      {/* Webcam or avatar */}
      <div style={styles.videoWrapper}>
        {webcamOn ? (
          <VideoPlayer
            participantId={participantId}
            type="video"
            containerStyle={fill}
            videoStyle={{
              ...styles.video,
              transform: local ? 'scaleX(-1)' : 'none',
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
            {local && ' (You)'}
          </span>
          {!micOn && <span style={styles.micOff}>🔇</span>}
        </div>
      </div>

      {/* Audio for remote participants only (never local — avoids echo) */}
      {!local && <AudioPlayer participantId={participantId} type="audio" />}
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
    zIndex: 3,
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
    zIndex: 5,
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
