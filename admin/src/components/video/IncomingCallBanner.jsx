import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

/**
 * IncomingCallBanner — shown globally when a video:incoming event arrives.
 * For the admin (doctor) side, this is informational (doctor initiates calls).
 * For the patient side, this shows "Accept" to navigate to the call.
 */
export default function IncomingCallBanner() {
  const { incomingCall, dismissIncomingCall } = useSocket();
  const navigate = useNavigate();

  if (!incomingCall) return null;

  const handleAccept = () => {
    navigate(`/appointments/${incomingCall.appointmentId}`);
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
        maxWidth: 380,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <div style={{ fontSize: 28 }}>📹</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          Incoming Video Call
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
          Dr. {incomingCall.doctorName} is ready
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
