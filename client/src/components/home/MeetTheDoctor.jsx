import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/home-sections.css';

const QUALIFICATIONS = [
  'MS (General Surgery)',
  'MBBS',
  'MRCS (London)',
  'FIAGES',
];

export default function MeetTheDoctor() {
  const { user } = useAuth();

  return (
    <section className="hp-section mtd-section">
      <div className="mtd-inner">

        {/* ── Image column ── */}
        <div className="mtd-image-col">
          <div className="mtd-image-frame">
            <img
              src="/doctor.png"
              alt="Dr. Srinath — General & Laparoscopic Surgeon"
              className="mtd-image"
              loading="lazy"
            />
          </div>
        </div>

        {/* ── Content column ── */}
        <div className="mtd-content">

          {/* Qualification badges */}
          <div className="mtd-qualifications">
            {QUALIFICATIONS.map((q) => (
              <span key={q} className="mtd-qual-badge">{q}</span>
            ))}
          </div>

          {/* Section label */}
          <div className="hp-section-label" style={{ marginBottom: '12px' }}>
            <span className="hp-section-label__dot" />
            Meet the Doctor
          </div>

          {/* Name */}
          <h2 className="mtd-name">Dr. Srinath</h2>

          {/* Specialty */}
          <p className="mtd-specialty">General & Laparoscopic Surgeon</p>

          {/* Short bio — client requested minimal; one concise paragraph */}
          <p className="mtd-bio">
            With over a decade of surgical experience, Dr. Srinath specialises in
            general and laparoscopic procedures. His practice is founded on precision,
            compassionate care, and a genuine commitment to every patient's recovery.
          </p>

          {/* Single CTA */}
          <Link
            to={user ? '/book-appointment' : '/login'}
            className="mtd-cta"
            id="meet-doctor-book-btn"
          >
            Book an Appointment
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </Link>

        </div>
      </div>
    </section>
  );
}
