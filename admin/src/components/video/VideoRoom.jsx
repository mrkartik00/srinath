import { useState, useEffect } from 'react';
import { MeetingProvider, useMeeting } from '@videosdk.live/react-sdk';
import VideoTile from './VideoTile';
import VideoControls from './VideoControls';

function MeetingView({ onCallEnd }) {
  const { participants, localParticipant, join, leave } = useMeeting({
    onMeetingLeft: () => {
      if (onCallEnd) onCallEnd();
    },
  });
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    join();
    setJoined(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndCall = () => {
    leave();
    if (onCallEnd) onCallEnd();
  };

  if (!joined || !localParticipant) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Connecting...</p>
      </div>
    );
  }

  const participantIds = [...participants.keys()];
  const remoteParticipants = participantIds.filter(
    (id) => id !== localParticipant.id
  );

  return (
    <div style={styles.meetingContainer}>
      {/* Video Grid */}
      <div style={styles.grid}>
        {/* Local participant (doctor) */}
        <div style={styles.tile}>
          <VideoTile participantId={localParticipant.id} isLocal />
        </div>

        {/* Remote participants */}
        {remoteParticipants.length > 0 ? (
          remoteParticipants.map((id) => (
            <div key={id} style={styles.tile}>
              <VideoTile participantId={id} />
            </div>
          ))
        ) : (
          <div style={styles.waitingTile}>
            <div style={styles.waitingContent}>
              <div style={styles.pulseCircle} />
              <p style={styles.waitingText}>Waiting for patient...</p>
              <p style={styles.waitingSubtext}>
                The patient will appear here once they join the call
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <VideoControls onEndCall={handleEndCall} />
    </div>
  );
}

export default function VideoRoom({ token, roomId, onCallEnd }) {
  if (!token || !roomId) {
    return (
      <div style={styles.overlay}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Missing video session credentials.</p>
          <button onClick={onCallEnd} style={styles.errorButton}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <MeetingProvider
        config={{
          meetingId: roomId,
          micEnabled: true,
          webcamEnabled: true,
          name: 'Doctor',
          debugMode: false,
        }}
        token={token}
      >
        <MeetingView onCallEnd={onCallEnd} />
      </MeetingProvider>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9000,
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
  },
  meetingContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
  },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 16,
    alignItems: 'stretch',
    padding: '0 0 80px 0',
  },
  tile: {
    minHeight: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  waitingTile: {
    minHeight: 300,
    borderRadius: 16,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    border: '2px dashed #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  pulseCircle: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'rgba(34, 197, 94, 0.2)',
    border: '2px solid rgba(34, 197, 94, 0.5)',
    animation: 'pulse 2s ease-in-out infinite',
  },
  waitingText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  waitingSubtext: {
    color: '#64748b',
    fontSize: 13,
    margin: 0,
    textAlign: 'center',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 16,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '3px solid #334155',
    borderTopColor: '#22c55e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    margin: 0,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    margin: 0,
  },
  errorButton: {
    background: '#334155',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
};
