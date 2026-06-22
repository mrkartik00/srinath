import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DEPARTMENTS = [
  {
    name: 'Cardiology',
    doctors: '5 Doctors',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5F8190" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        <polyline points="4 12 8 12 10 8 14 16 16 12 20 12" />
      </svg>
    ),
  },
  {
    name: 'Pulmonology',
    doctors: '5 Doctors',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5F8190" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v6" />
        <path d="M12 8c-2.5-2.5-6-2-8 1s-1 5 1 7l4 4a2.82 2.82 0 0 0 4 0l4-4c2-2 3-4 1-7s-5.5-3.5-8-1" />
      </svg>
    ),
  },
  {
    name: 'Neurology',
    doctors: '5 Doctors',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5F8190" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a8 8 0 0 0-8 8c0 1.5.5 2.8 1.2 3.9C6.8 16 8 18 8 20v2h8v-2c0-2 1.2-4 2.8-6.1C19.5 12.8 20 11.5 20 10a8 8 0 0 0-8-8z" />
        <path d="M9.5 9h5" />
        <path d="M9.5 13h5" />
        <path d="M12 2v20" />
      </svg>
    ),
  },
  {
    name: 'Orthopedic',
    doctors: '5 Doctors',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5F8190" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 10l-7 7" />
        <path d="M10 17l-3 3a2.83 2.83 0 0 1-4-4l3-3" />
        <path d="M14 7l3-3a2.83 2.83 0 0 1 4 4l-3 3" />
      </svg>
    ),
  },
  {
    name: 'Ophthalmology',
    doctors: '5 Doctors',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5F8190" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    name: 'Otolaryngology',
    doctors: '5 Doctors',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5F8190" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.5 4a3.5 3.5 0 0 0-3.5 3.5V11" />
        <path d="M12 2v6" />
        <path d="M5.5 4a3.5 3.5 0 0 1 3.5 3.5V11" />
        <path d="M22 17v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2" />
        <path d="M8 21v-4a4 4 0 0 1 8 0v4" />
      </svg>
    ),
  },
];

const FEATURES = [
  {
    num: '01',
    title: 'Medical & Surgical',
    desc: 'We provide a wide range of healthcare services, such as general medicine, treatments, surgical procedures, and rehabilitation.',
  },
  {
    num: '02',
    title: 'Intensive Therapy',
    desc: 'We provide a wide range of healthcare services, such as general medicine, treatments, surgical procedures, and rehabilitation.',
  },
  {
    num: '03',
    title: 'Advanced Diagnostic',
    desc: 'We provide a wide range of healthcare services, such as general medicine, treatments, surgical procedures, and rehabilitation.',
  },
];

export default function DepartmentsSection() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      // Re-check on resize
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  return (
    <section className="dept-section">
      <div className="dept-section__inner">

        {/* Header Row */}
        <div className="dept-section__header">
          <div className="dept-section__header-left">
            <div className="dept-section__badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l2 2" />
              </svg>
              <span>children health, our priority</span>
            </div>
            <h2 className="dept-section__heading">
              Explore Our Pediatric<br />Healthcare Departments
            </h2>
          </div>
          <Link to="/services" className="dept-section__view-all">
            View All Departments
          </Link>
        </div>

        {/* Carousel with arrows */}
        <div className="dept-section__carousel-wrap">
          <button
            className={`dept-section__arrow dept-section__arrow--left${!canScrollLeft ? ' dept-section__arrow--hidden' : ''}`}
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="dept-section__carousel" ref={scrollRef}>
            {DEPARTMENTS.map((dept) => (
              <div className="dept-card" key={dept.name}>
                <div className="dept-card__icon">{dept.icon}</div>
                <h3 className="dept-card__name">{dept.name}</h3>
                <span className="dept-card__count">{dept.doctors}</span>
              </div>
            ))}
          </div>

          <button
            className={`dept-section__arrow dept-section__arrow--right${!canScrollRight ? ' dept-section__arrow--hidden' : ''}`}
            onClick={() => scroll(1)}
            aria-label="Scroll right"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="dept-section__divider" />

        {/* Features Row */}
        <div className="dept-section__features">
          {FEATURES.map((f) => (
            <div className="dept-feature" key={f.num}>
              <div className="dept-feature__top">
                <span className="dept-feature__num">{f.num}</span>
                <h4 className="dept-feature__title">{f.title}</h4>
              </div>
              <p className="dept-feature__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
