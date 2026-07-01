import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/home-sections.css';

const PATIENT_ACTIONS = [
  {
    id: 'book',
    title: 'Book Appointment',
    desc: 'Schedule a new appointment.',
    authPath: '/book-appointment',
    guestPath: '/login',
    colorVar: '#253a5a',
    bgVar: '#eef3fa',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'find-doctors',
    title: 'Find Doctors',
    desc: 'Browse available doctors.',
    authPath: '/services', // Assuming a route for finding doctors or services
    guestPath: '/services',
    colorVar: '#253a5a',
    bgVar: '#eef3fa',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'portal',
    title: 'Patient Portal',
    desc: 'Login and manage your account.',
    authPath: '/appointments',
    guestPath: '/login',
    colorVar: '#253a5a',
    bgVar: '#eef3fa',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'chat',
    title: 'Chat',
    desc: 'Securely message your doctor.',
    authPath: '/chat',
    guestPath: '/login',
    colorVar: '#253a5a',
    bgVar: '#eef3fa',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function PatientServices() {
  const { user } = useAuth();

  return (
    <section className="hp-section qa-section">
      <div className="hp-section__inner qa-inner">

        {/* Header */}
        <div className="hp-section-header">
          <div className="hp-section-header__left">
            <div className="hp-section-label">
              <span className="hp-section-label__dot" />
              Patient Services
            </div>
            <h2 className="hp-section-heading" style={{ margin: 0 }}>
              Everything You Need
            </h2>
          </div>
        </div>

        {/* 4-column Action Cards */}
        <div className="qa-grid">
          {PATIENT_ACTIONS.map((action) => {
            const to = user ? action.authPath : action.guestPath;
            return (
              <Link
                key={action.id}
                to={to}
                className="qa-card"
                aria-label={action.title}
                style={{ '--card-color': action.colorVar, '--card-bg': action.bgVar }}
              >
                {/* Icon */}
                <div className="qa-card__icon-wrap">
                  {action.icon}
                </div>

                {/* Text */}
                <div className="qa-card__content">
                  <h3 className="qa-card__title">{action.title}</h3>
                  <p className="qa-card__desc">{action.desc}</p>
                </div>

                {/* Footer Link */}
                <div className="qa-card__footer">
                  <span className="qa-card__footer-text">Open</span>
                  <div className="qa-card__arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}

