import { useState } from 'react';
import { useMeeting } from '@videosdk.live/react-sdk';

/**
 * VideoControls — patient-side controls for video call.
 * Buttons: Toggle Mic, Toggle Camera, Leave Call.
 * No screen share (only doctor can share).
 * Mobile-friendly with larger touch targets.
 */
export default function VideoControls({ onLeave }) {
  const { toggleMic, toggleWebcam, leave, localMicOn, localWebcamOn } = useMeeting();
  const [micOn, setMicOn] = useState(localMicOn ?? true);
  const [camOn, setCamOn] = useState(localWebcamOn ?? true);

  const handleToggleMic = () => {
    toggleMic();
    setMicOn((prev) => !prev);
  };

  const handleToggleCam = () => {
    toggleWebcam();
    setCamOn((prev) => !prev);
  };

  const handleLeave = () => {
    leave();
    onLeave?.();
  };

  const controlBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '16px 24px',
    background: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
  };

  const buttonBase = {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 22,
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent',
  };

  const activeButton = {
    ...buttonBase,
    background: '#334155',
    color: '#fff',
  };

  const inactiveButton = {
    ...buttonBase,
    background: '#ef4444',
    color: '#fff',
  };

  const leaveButton = {
    ...buttonBase,
    background: '#dc2626',
    color: '#fff',
    width: 64,
    height: 56,
    borderRadius: 28,
    fontSize: 14,
    fontWeight: 600,
    padding: '0 20px',
  };

  return (
    <div style={controlBarStyle}>
      {/* Mic Toggle */}
      <button
        onClick={handleToggleMic}
        style={micOn ? activeButton : inactiveButton}
        title={micOn ? 'Mute Mic' : 'Unmute Mic'}
        aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micOn ? '🎤' : '🔇'}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={handleToggleCam}
        style={camOn ? activeButton : inactiveButton}
        title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
        aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {camOn ? '📹' : '📷'}
      </button>

      {/* Leave Call */}
      <button
        onClick={handleLeave}
        style={leaveButton}
        title="Leave Call"
        aria-label="Leave call"
      >
        ✕
      </button>
    </div>
  );
}
