import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/home-sections.css';

const PATIENT_TOOLS = [
  {
    id: 'appointments',
    title: 'Appointments',
    desc: 'View and manage your appointments.',
    path: '/appointments',
    colorVar: '#253a5a',
    bgVar: '#eef3fa',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: 'records',
    title: 'Medical Records',
    desc: 'Access your complete medical history.',
    path: '/medical-records',
    colorVar: '#253a5a',
    bgVar: '#eef3fa',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    id: 'prescriptions',
    title: 'Prescriptions',
    desc: 'View your current prescriptions.',
    path: '/prescriptions',
    colorVar: '#253a5a',
    bgVar: '#eef3fa',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 20.5 4 14l7.5-7.5a4.95 4.95 0 1 1 7 7Z" />
        <path d="m14 7 3 3" />
      </svg>
    ),
  },
  {
    id: 'health-feed',
    title: 'Health Feed',
    desc: 'Read health updates from your care team.',
    path: '/health-feed',
    colorVar: '#253a5a',
    bgVar: '#eef3fa',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export default function PatientTools() {
  const { user } = useAuth();

  return (
    <section className="hp-section qa-section">
      <div className="hp-section__inner qa-inner">

        {/* Header */}
        <div className="hp-section-header">
          <div className="hp-section-header__left">
            <div className="hp-section-label">
              <span className="hp-section-label__dot" />
              Interactive Dashboard
            </div>
            <h2 className="hp-section-heading" style={{ margin: 0 }}>
              Patient Tools
            </h2>
          </div>
        </div>

        {/* 2x2 Action Cards */}
        <div className="qa-grid-2x2">
          {PATIENT_TOOLS.map((tool) => {
            const to = user ? tool.path : '/login';
            return (
              <Link
                key={tool.id}
                to={to}
                className="qa-card-wide"
                aria-label={tool.title}
                style={{ '--card-color': tool.colorVar, '--card-bg': tool.bgVar }}
              >
                {/* Icon */}
                <div className="qa-card__icon-wrap">
                  {tool.icon}
                </div>

                {/* Text */}
                <div className="qa-card__content">
                  <h3 className="qa-card__title">{tool.title}</h3>
                  <p className="qa-card__desc">{tool.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
