import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/home-sections.css';

const SERVICES = [
  {
    title: 'General Medicine Consultation',
    image: 'https://images.unsplash.com/photo-1551076805-e18690c5e53b?w=600&h=800&fit=crop',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6M12 9v6"/>
        <rect x="2" y="4" width="20" height="18" rx="3"/>
        <path d="M8 4V2M16 4V2"/>
      </svg>
    ),
  },
  {
    title: 'Laparoscopic Surgery',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=800&fit=crop',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9"/>
        <path d="M18 3l3 3-9 9-3-1-1-3 9-9"/>
      </svg>
    ),
  },
  {
    title: 'Chronic Disease Management',
    image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&h=800&fit=crop',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    title: 'Preventive Healthcare',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=800&fit=crop',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
];

export default function FeaturedServices() {
  const { user } = useAuth();

  return (
    <section className="hp-section">
      <div className="hp-section__inner">

        {/* Header */}
        <div className="hp-section-header">
          <div className="hp-section-header__left">
            <div className="hp-section-label">
              <span className="hp-section-label__dot" />
              What We Offer
            </div>
            <h2 className="hp-section-heading" style={{ margin: 0 }}>
              Featured Services
            </h2>
          </div>
        </div>

        {/* 4-column card grid */}
        <div className="fs-grid">
          {SERVICES.map((service) => (
            <Link
              key={service.title}
              to="/services"
              className="fs-card"
              aria-label={service.title}
            >
              {/* Background image */}
              <img
                src={service.image}
                alt={service.title}
                className="fs-card__img"
                loading="lazy"
              />
              {/* Overlay */}
              <div className="fs-card__overlay" />
              {/* Body */}
              <div className="fs-card__body">
                <div className="fs-card__icon">{service.icon}</div>
                <h3 className="fs-card__title">{service.title}</h3>
                <span className="fs-card__arrow">
                  View Service
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7v10"/>
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* View All button */}
        <div className="fs-footer">
          <Link to="/services" className="fs-btn-view-all">
            View All Services
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
