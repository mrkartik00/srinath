import { Navigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

/**
 * ProtectedRoute
 * Instead of hard-redirecting to /login, renders a login wall
 * inside the portal layout so the user stays in context.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner size="lg" />
    </div>
  );

  if (!user) return <LoginWall />;

  return children;
}

/**
 * GuestRoute – soft gate. Guests can browse freely.
 * Auth is only enforced at the action level (useRequireAuth hook).
 */
export function GuestRoute({ children }) {
  const { loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner size="lg" />
    </div>
  );
  return children;
}

/**
 * LoginWall – rendered inside the portal layout when a guest
 * tries to access a protected page. No redirect, stays in context.
 */
function LoginWall() {
  const location = useLocation();

  // Human-readable page names
  const pageLabels = {
    '/appointments': 'Appointments',
    '/book-appointment': 'Book Appointment',
    '/profile': 'My Profile',
    '/prescriptions': 'Prescriptions',
    '/reminders': 'Reminders',
    '/medical-records': 'Medical Records',
    '/chat': 'Chat',
    '/payments': 'Payments',
  };

  const pageName = pageLabels[location.pathname] ||
    location.pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') ||
    'this page';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: '70vh',
      background: '#f0f4f8',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #eaedf1',
        boxShadow: '0 8px 40px rgba(37,58,90,0.08)',
        padding: '48px 40px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>

        {/* Lock icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px',
          background: 'linear-gradient(135deg, #e2f0f0, #b8d8df)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '4px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#36565F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div>
          <h2 style={{
            fontFamily: "'Figtree', sans-serif", fontSize: '22px', fontWeight: 800,
            color: '#253a5a', margin: '0 0 8px', letterSpacing: '-0.3px',
          }}>
            Login to access {pageName}
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7C84', margin: 0, lineHeight: 1.6 }}>
            This section is available to registered patients only. Sign in to view your information.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' }}>
          <Link
            to="/login"
            state={{ from: location.pathname }}
            style={{
              display: 'block', padding: '13px',
              background: '#253a5a', color: '#ffffff',
              borderRadius: '12px', fontWeight: 700, fontSize: '14px',
              textDecoration: 'none', transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#36565F'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#253a5a'; }}
          >
            Login to Continue
          </Link>
          <Link
            to="/register"
            style={{
              display: 'block', padding: '12px',
              background: 'transparent', color: '#36565F',
              border: '1px solid #eaedf1',
              borderRadius: '12px', fontWeight: 600, fontSize: '14px',
              textDecoration: 'none', transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f4f8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Create an Account
          </Link>
        </div>

        <p style={{ fontSize: '12px', color: '#6B7C84', margin: '4px 0 0' }}>
          You can still{' '}
          <Link to="/dashboard" style={{ color: '#36565F', fontWeight: 600, textDecoration: 'none' }}>
            browse the portal
          </Link>
          {' '}without logging in.
        </p>
      </div>
    </div>
  );
}
