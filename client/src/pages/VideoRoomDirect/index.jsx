import { useSearchParams, useNavigate } from 'react-router-dom';
import VideoRoom from '../../components/video/VideoRoom';

/**
 * VideoRoomDirect — Direct video room entry for mobile app.
 * Route: /video-room?token=...&roomId=...&name=...
 * Skips the guest join form and goes straight into the call.
 * Used when the mobile app already has a valid token from the API.
 */
export default function VideoRoomDirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const roomId = searchParams.get('roomId');
  const name = searchParams.get('name') || 'Patient';

  const handleCallEnd = () => {
    // Close the window/tab if opened from mobile, else navigate home
    if (window.opener || window.history.length <= 1) {
      window.close();
    } else {
      navigate('/');
    }
  };

  if (!token || !roomId) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f87171',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        textAlign: 'center',
        padding: 24,
      }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Invalid video session</p>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>
            Missing token or room ID. Please try joining again from the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <VideoRoom
      token={token}
      roomId={roomId}
      participantName={name}
      onCallEnd={handleCallEnd}
    />
  );
}
