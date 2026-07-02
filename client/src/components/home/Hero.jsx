import { Link } from 'react-router-dom';
import CountUp from './CountUp';
import { useAuth } from '../../context/AuthContext';

export default function Hero() {
  const { user } = useAuth();

  return (
    <div className="hp-hero-container">
      {/* Background Typography */}
      <div className="hp-bg-typography">Meet Dr. Srinath</div>

      {/* Doctor Image */}
      <div className="hp-doctor-image-container">
        <img
          src="/dr.srinath final.png"
          alt="Dr. Srinath"
          className="hp-doctor-image"
        />
      </div>

      {/* Elements Layer */}
      <div className="hp-elements-layer">

        <div className="hp-left-cta hp-animate-fade-up hp-delay-200">
          <Link to={user ? '/book-appointment' : '/login'} className="hp-btn-book">
            Book Appointment ↗
          </Link>
        </div>

        {/* Qualifications */}
        <div className="hp-qualifications hp-animate-fade-up hp-delay-300">
          General and Laparoscopic Surgery
        </div>

        {/* Statistics */}
        <div className="hp-statistics hp-animate-fade-up hp-delay-300">
          <div className="hp-stat-item">
            <div className="hp-stat-number">
              <CountUp end={10} duration={2500} suffix="k+" />
            </div>
            <div className="hp-stat-label">Satisfied Patients</div>
          </div>
          <div className="hp-stat-item">
            <div className="hp-stat-number">
              <CountUp end={10} duration={2500} suffix="+" />
            </div>
            <div className="hp-stat-label">Years of Experience</div>
          </div>
        </div>
      </div>
    </div>
  );
}
