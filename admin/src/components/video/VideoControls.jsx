import { useState } from 'react';
import { useMeeting } from '@videosdk.live/react-sdk';

export default function VideoControls({ onEndCall }) {
  const { toggleMic, toggleWebcam, toggleScreenShare, localMicOn, localWebcamOn } = useMeeting();
  const [screenSharing, setScreenSharing] = useState(false);

  const handleToggleScreenShare = () => {
    toggleScreenShare();
    setScreenSharing((prev) => !prev);
  };

  const handleEndCall = () => {
    if (onEndCall) onEndCall();
  };

  return (
    <div style={styles.bar}>
      {/* Mic Toggle */}
      <button
        onClick={() => toggleMic()}
        style={{
          ...styles.button,
          background: localMicOn ? 'rgba(255,255,255,0.15)' : '#ef4444',
        }}
        title={localMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        aria-label={localMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
      >
        {localMicOn ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .73-.11 1.43-.32 2.09" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={() => toggleWebcam()}
        style={{
          ...styles.button,
          background: localWebcamOn ? 'rgba(255,255,255,0.15)' : '#ef4444',
        }}
        title={localWebcamOn ? 'Turn Off Camera' : 'Turn On Camera'}
        aria-label={localWebcamOn ? 'Turn Off Camera' : 'Turn On Camera'}
      >
        {localWebcamOn ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
          </svg>
        )}
      </button>

      {/* Screen Share */}
      <button
        onClick={handleToggleScreenShare}
        style={{
          ...styles.button,
          background: screenSharing ? '#3b82f6' : 'rgba(255,255,255,0.15)',
        }}
        title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
        aria-label={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </button>

      {/* End Call */}
      <button
        onClick={handleEndCall}
        style={styles.endButton}
        title="End Call"
        aria-label="End Call"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      </button>
    </div>
  );
}

const styles = {
  bar: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(12px)',
    padding: '12px 24px',
    borderRadius: 50,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
  },
  endButton: {
    width: 56,
    height: 48,
    borderRadius: 24,
    border: 'none',
    background: '#ef4444',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginLeft: 8,
    transition: 'background 0.2s, transform 0.1s',
  },
};
