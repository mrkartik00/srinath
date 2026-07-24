import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

/**
 * IncomingCallBanner — shown when a video:incoming event arrives for logged-in patient.
 * Shows doctor name + Join button which navigates to appointment detail (where Join Call exists).
 */
export default function IncomingCallBanner() {
  const { incomingCall, dismissIncomingCall } = useSocket();
  const navigate = useNavigate();

  if (!incomingCall) return null;

  const handleAccept = () => {
    navigate(`/appointments/${incomingCall.appointmentId}`);
    dismissIncomingCall();
  };

  const handleJoinGuest = () => {
    // Open the guest link directly (works even if not logged in on another tab)
    if (incomingCall.guestLink) {
      window.open(incomingCall.guestLink, '_blank');
    }
    dismissIncomingCall();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        background: '#1e293b',
        color: '#fff',
        padding: '16px 20px',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 400,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <div style={{ fontSize: 28 }}>📹</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          Video Consultation Ready
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
          Dr. {incomingCall.doctorName} is waiting for you
        </div>
      </div>
      <button
        onClick={handleAccept}
        style={{
          background: '#22c55e',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Join
      </button>
      <button
        onClick={dismissIncomingCall}
        style={{
          background: 'transparent',
          color: '#94a3b8',
          border: 'none',
          fontSize: 18,
          cursor: 'pointer',
          padding: '4px 8px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
