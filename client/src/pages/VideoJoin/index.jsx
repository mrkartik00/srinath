import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { guestJoin } from '../../api/endpoints/video';
import VideoRoom from '../../components/video/VideoRoom';

/**
 * VideoJoinPage — Public guest page for joining a video consultation.
 * Route: /join/:roomCode (no auth required).
 * Step 1: Name input + Join button (branded landing).
 * Step 2: Call guestJoin API.
 * Step 3: Render VideoRoom on success.
 * Mobile-first responsive design.
 */
export default function VideoJoinPage() {
  const { roomCode } = useParams();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null); // { token, roomId, participantName }
  const [callEnded, setCallEnded] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await guestJoin(roomCode, trimmedName);
      const data = response.data || response;
      setSession({
        token: data.token,
        roomId: data.roomId,
        participantName: data.participantName || trimmedName,
      });
    } catch (err) {
      const msg = err.message || 'Unable to join consultation';
      // Map backend errors to friendly messages
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('invalid')) {
        setError('Consultation not found. Please check your link and try again.');
      } else if (msg.toLowerCase().includes('ended') || msg.toLowerCase().includes('expired')) {
        setError('This consultation has ended.');
      } else if (msg.toLowerCase().includes('not started') || msg.toLowerCase().includes('not yet')) {
        setError('This consultation has not started yet. Please wait for the doctor to begin.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCallEnd = () => {
    setSession(null);
    setCallEnded(true);
  };

  // Active video call
  if (session) {
    const refreshSession = async () => {
      try {
        const response = await guestJoin(roomCode, session.participantName || name.trim() || 'Patient');
        const data = response.data || response;
        setSession({
          token: data.token,
          roomId: data.roomId,
          participantName: data.participantName || session.participantName,
        });
      } catch {
        // If refresh fails, drop back to the join form.
        setSession(null);
      }
    };
    return (
      <VideoRoom
        token={session.token}
        roomId={session.roomId}
        participantName={session.participantName}
        onCallEnd={handleCallEnd}
        onTokenExpired={refreshSession}
      />
    );
  }

  // Call ended screen
  if (callEnded) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={iconContainerStyle}>
            <span style={{ fontSize: 48 }}>✓</span>
          </div>
          <h1 style={headingStyle}>Consultation Ended</h1>
          <p style={subTextStyle}>
            Thank you for your consultation. You may close this window.
          </p>
          <button
            onClick={() => { setCallEnded(false); setName(''); }}
            style={secondaryButtonStyle}
          >
            Rejoin
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Landing / Join form
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Logo / Brand */}
        <div style={logoStyle}>
          <span style={{ fontSize: 32 }}>🏥</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: '#1e293b' }}>
            Janki Care
          </span>
        </div>

        <h1 style={headingStyle}>Join Video Consultation</h1>
        <p style={subTextStyle}>
          Enter your name to join the video call with your doctor
        </p>

        <form onSubmit={handleJoin} style={formStyle}>
          <div style={inputWrapperStyle}>
            <label htmlFor="patient-name" style={labelStyle}>
              Your Name
            </label>
            <input
              id="patient-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              style={inputStyle}
              autoFocus
              autoComplete="name"
              disabled={loading}
            />
          </div>

          {error && (
            <div style={errorStyle}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              ...joinButtonStyle,
              opacity: loading || !name.trim() ? 0.6 : 1,
              cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spinner />
                Connecting...
              </span>
            ) : (
              '🎥 Join Consultation'
            )}
          </button>
        </form>

        <div style={infoStyle}>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
            💡 Ensure camera and microphone permissions are enabled
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <div style={{ marginTop: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
      Powered by <strong style={{ color: '#64748b' }}>Janki Care</strong>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

// Styles
const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #ecfdf5 100%)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const cardStyle = {
  width: '100%',
  maxWidth: 420,
  background: '#fff',
  borderRadius: 20,
  padding: '40px 32px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
  textAlign: 'center',
};

const logoStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 24,
};

const headingStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: '#1e293b',
  margin: '0 0 8px',
};

const subTextStyle = {
  fontSize: 14,
  color: '#64748b',
  margin: '0 0 28px',
  lineHeight: 1.5,
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const inputWrapperStyle = {
  textAlign: 'left',
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  fontSize: 16,
  border: '2px solid #e2e8f0',
  borderRadius: 12,
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
};

const joinButtonStyle = {
  width: '100%',
  padding: '16px 24px',
  fontSize: 16,
  fontWeight: 600,
  color: '#fff',
  background: '#22c55e',
  border: 'none',
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  WebkitTapHighlightColor: 'transparent',
  marginTop: 8,
};

const secondaryButtonStyle = {
  padding: '12px 24px',
  fontSize: 14,
  fontWeight: 600,
  color: '#22c55e',
  background: '#f0fdf4',
  border: '2px solid #22c55e',
  borderRadius: 12,
  cursor: 'pointer',
  marginTop: 16,
};

const errorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 16px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 10,
  color: '#dc2626',
  fontSize: 14,
  textAlign: 'left',
};

const infoStyle = {
  marginTop: 20,
  padding: '12px 16px',
  background: '#f8fafc',
  borderRadius: 10,
};

const iconContainerStyle = {
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: '#dcfce7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
  color: '#22c55e',
};
