import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Hero from '../../components/home/Hero';
import '../../styles/home.css';

/* ── Scroll-reveal hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.unobserve(el); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* ══════════════════════════════════════════════════════════
          COMPREHENSIVE CARE SPLIT SECTION
          ══════════════════════════════════════════════════════════ */}
      <ComprehensiveCareSection />

      {/* Scrolling Specialty Marquee */}
      <SpecialtyMarquee />

      {/* ══════════════════════════════════════════════════════════
          DEPARTMENTS SECTION
          ══════════════════════════════════════════════════════════ */}
      <DepartmentsSection />

      {/* ══════════════════════════════════════════════════════════
          QUICK FIND PORTAL SECTION
          ══════════════════════════════════════════════════════════ */}
      <QuickFindPortalSection />

      {/* ══════════════════════════════════════════════════════════
          FEEDBACK & PROMO SECTION
          ══════════════════════════════════════════════════════════ */}
      <FeedbackAndPromoSection />
    </>
  );
}


/* ──────────────────────────────────────────────────────────────
   COMPREHENSIVE CARE SPLIT SECTION
   ────────────────────────────────────────────────────────────── */
function ComprehensiveCareSection() {
  const [ref, vis] = useReveal(0.15);

  return (
    <section style={{
      background: '#ffffff',
      padding: '96px 24px',
      overflow: 'hidden',
    }}>
      <div
        ref={ref}
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '64px',
          alignItems: 'center',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1)',
        }}
      >
        {/* ── Left: Image + Stat Card ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {/* Main photo */}
          <div style={{
            borderRadius: '24px',
            overflow: 'hidden',
            height: '420px',
            position: 'relative',
          }}>
            <img
              src="/doctor_consultation.png"
              alt="Male doctor sitting at consultation desk with a patient"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Floating stat card — matches screenshot bottom-left */}
          <div style={{
            position: 'absolute',
            bottom: '28px',
            left: '-28px',
            background: '#EDF5F8',
            borderRadius: '20px',
            padding: '22px 28px',
            boxShadow: '0 12px 40px rgba(37,58,90,0.14)',
            border: '1px solid rgba(54,86,95,0.08)',
            minWidth: '190px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8db5c4', textTransform: 'none', letterSpacing: '0.01em', margin: '0 0 8px', lineHeight: 1.4 }}>
              Years of Experience in<br />Advanced Surgical Care
            </p>
            <p style={{ fontSize: '44px', fontWeight: 900, color: '#253a5a', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
              10+
            </p>
          </div>
        </div>

        {/* ── Right: Content ── */}
        <div>
          {/* Label pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            marginBottom: '20px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#253a5a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
              <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
              <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
              <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
              <path d="M12 9v6M9 12h6" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#253a5a', letterSpacing: '0.04em' }}>
              connecting patients & doctors
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Figtree', sans-serif",
            fontSize: 'clamp(28px, 3.5vw, 44px)',
            fontWeight: 600,
            color: '#253a5a',
            margin: '0 0 20px',
            letterSpacing: '-0.5px',
            lineHeight: 1.15,
          }}>
            Comprehensive Care<br />for Every Patient
          </h2>

          <p style={{
            fontSize: '15px',
            color: '#6B7C84',
            lineHeight: 1.75,
            margin: '0 0 32px',
            maxWidth: '440px',
          }}>
            Janki Care is a dedicated patient portal where patients can book appointments online and doctors can list their practice, manage schedules, and issue digital prescriptions — all in one secure platform.
          </p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
            {[
              { label: 'Patients', text: 'Book appointments, view prescriptions & medical records' },
              { label: 'Doctors', text: 'List your practice, manage slots & communicate securely' },
              { label: 'Records', text: 'All health data encrypted and accessible 24/7' },
            ].map(({ label, text }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  marginTop: '2px', flexShrink: 0,
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#e8f0f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#253a5a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#36565F', lineHeight: 1.5 }}>
                  <strong style={{ color: '#253a5a' }}>{label}:</strong> {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   SCROLLING SPECIALTY MARQUEE
   ────────────────────────────────────────────────────────────── */
const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopaedics',
  'Dermatology', 'Gynaecology', 'Paediatrics', 'ENT',
  'Ophthalmology', 'Psychiatry', 'Oncology', 'Urology',
];

function SpecialtyMarquee() {
  return (
    <div style={{
      background: '#ffffff',
      borderTop: '1px solid #eaedf1',
      borderBottom: '1px solid #eaedf1',
      overflow: 'hidden',
      padding: '12px 0',
    }}>
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-scroll 22s linear infinite;
        }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="marquee-track">
        {[...SPECIALTIES, ...SPECIALTIES].map((s, i) => (
          <span key={i} style={{
            fontFamily: "'Figtree', sans-serif",
            fontWeight: 700,
            fontSize: '72px',
            color: '#8db5c4',
            whiteSpace: 'nowrap',
            padding: '0 12px',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}>
            {s}
            <span style={{
              color: '#8db5c4',
              margin: '0 20px',
              fontSize: '72px',
              fontWeight: 300,
              verticalAlign: 'middle',
              opacity: 0.6,
            }}>+</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   DEPARTMENTS SECTION
   ────────────────────────────────────────────────────────────── */

const DEPT_ICONS = {
  Orthopedics: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 6a3 3 0 0 0-6 0c0 .6.2 1.1.5 1.5L7 12.2A3 3 0 0 0 4 12c-1.7 0-3 1.3-3 3s1.3 3 3 3c1.1 0 2-.6 2.5-1.5l3.5-3.5c.4.3.9.5 1.5.5a3 3 0 0 0 3-3c0-.6-.2-1.1-.5-1.5l3.5-3.5C18 6.6 18.9 7 20 7c1.7 0 3-1.3 3-3s-1.3-3-3-3c-1.1 0-2 .6-2.5 1.5l-3.5 3.5z" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  ),
  Orthopedic: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 6a3 3 0 0 0-6 0c0 .6.2 1.1.5 1.5L7 12.2A3 3 0 0 0 4 12c-1.7 0-3 1.3-3 3s1.3 3 3 3c1.1 0 2-.6 2.5-1.5l3.5-3.5c.4.3.9.5 1.5.5a3 3 0 0 0 3-3c0-.6-.2-1.1-.5-1.5l3.5-3.5C18 6.6 18.9 7 20 7c1.7 0 3-1.3 3-3s-1.3-3-3-3c-1.1 0-2 .6-2.5 1.5l-3.5 3.5z" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  ),
  Dermatology: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="11" r="3" />
    </svg>
  ),
  Cardiology: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      <path d="M6 12h2l1.5-3 2 6 1.5-4 1 2h2" />
    </svg>
  ),
  Neurology: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  ),
  Pulmonology: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v7" />
      <path d="M12 10a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v4c0 3.3 2.7 6 6 6h1a1 1 0 0 0 1-1v-4a2 2 0 0 1 2-2M12 10a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v4c0 3.3-2.7 6-6 6h-1a1 1 0 0 1-1-1v-4a2 2 0 0 0-2-2" />
    </svg>
  ),
  Ophthalmology: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 3h4M21 3h-4M3 21h4M21 21h-4" />
    </svg>
  ),
  Otolaryngology: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3a5 5 0 0 0-5 5v3.5a2 2 0 0 1-2 2h-1M4 12h2a4 4 0 0 1 4 4v4a2 2 0 0 0 4 0v-4" />
      <path d="M19 8.5a3.5 3.5 0 0 1 0 7M22 6a7 7 0 0 1 0 12" />
    </svg>
  ),
  'General Physician': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3H5C3.34 4 2 5.34 2 7v4c0 1.66 1.34 3 3 3M12 14v8M8 18h8" />
    </svg>
  ),
};

const FALLBACK_DEPTS = [
  { name: 'Cardiology', count: 1 },
  { name: 'Dermatology', count: 1 },
];

function DepartmentsSection() {
  const [ref, vis] = useReveal(0.1);
  const [depts, setDepts] = useState(FALLBACK_DEPTS);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/api/v1/config/doctors')
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.data?.length) return;
        const map = {};
        data.data.forEach(doc => {
          const s = doc.specialty || 'General Physician';
          map[s] = (map[s] || 0) + 1;
        });
        setDepts(Object.entries(map).map(([name, count]) => ({ name, count })));
      })
      .catch(() => { });
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const defaultIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
      <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
      <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
      <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  );

  return (
    <section style={{
      background: '#253a5a',
      padding: '80px 0 72px',
      overflow: 'hidden',
    }}>
      <div
        ref={ref}
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 32px',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1)',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
                <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
                <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
                <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
                <path d="M12 9v6M9 12h6" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#8db5c4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                clinical excellence, our priority
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: 'clamp(24px, 3.5vw, 38px)',
              fontWeight: 600,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}>
              Explore Our Healthcare<br />Departments
            </h2>
          </div>

          <Link
            to="/services"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#8db5c4',
              color: '#1e2e4a',
              padding: '10px 24px', borderRadius: '999px',
              fontFamily: "'Figtree', sans-serif",
              fontWeight: 700, fontSize: '13px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(141,181,196,0.2)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#9dc3d2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#8db5c4'; }}
          >
            View All Departments
          </Link>
        </div>

        {/* Carousel Container */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '10px',
              position: 'absolute',
              left: '-44px',
              zIndex: 10,
              opacity: 0.6,
              transition: 'opacity 0.2s',
              display: isMobile ? 'none' : 'block'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Cards List */}
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              width: '100%',
              padding: '12px 0',
              justifyContent: depts.length <= 6 && !isMobile ? 'center' : 'flex-start',
            }}
          >
            {depts.map(({ name, count }, idx) => {
              const isActive = idx === hoveredIdx;
              const icon = DEPT_ICONS[name] || defaultIcon;
              return (
                <div
                  key={name}
                  onClick={() => setActiveIdx(idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    flexShrink: 0,
                    width: '160px',
                    height: '200px',
                    borderRadius: '24px',
                    padding: '24px 16px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transform: isActive ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isActive ? '0 16px 36px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.04)',
                    border: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: isActive ? '#8db5c4' : 'rgba(141,181,196,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive ? '#ffffff' : '#253a5a',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{
                      fontFamily: "'Figtree', sans-serif",
                      fontWeight: 600,
                      fontSize: '15px',
                      color: '#253a5a',
                      margin: '12px 0 2px 0',
                      transition: 'color 0.3s',
                    }}>
                      {name}
                    </p>
                    <p style={{
                      fontFamily: "'Figtree', sans-serif",
                      fontWeight: 600,
                      fontSize: '12px',
                      color: '#8db5c4',
                      margin: 0,
                      transition: 'color 0.3s',
                    }}>
                      {count} Doctor{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '10px',
              position: 'absolute',
              right: '-44px',
              zIndex: 10,
              opacity: 0.6,
              transition: 'opacity 0.2s',
              display: isMobile ? 'none' : 'block'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Divider line */}
        <div style={{
          width: '100%',
          height: '1px',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: '56px 0 48px 0',
        }} />

        {/* Bottom Three Columns Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: '40px',
          textAlign: 'left',
          position: 'relative',
        }}>
          {[
            { num: '01', title: 'Book Appointment', desc: 'Schedule online consultations or clinic visits with our specialized medical team easily.' },
            { num: '02', title: 'Upload Documents', desc: 'Securely upload your test results, medical history, and clinical records directly to your portal.' },
            { num: '03', title: 'Download Prescriptions', desc: 'Access, view, and download digital prescriptions from your doctors anytime, anywhere.' },
          ].map((item, idx) => (
            <div key={item.num} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: idx === 2 ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                  color: idx === 2 ? '#1e2e4a' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  fontFamily: "'Figtree', sans-serif",
                }}>
                  {item.num}
                </div>
                <h4 style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontWeight: 600,
                  fontSize: '18px',
                  color: '#ffffff',
                  margin: 0,
                }}>
                  {item.title}
                </h4>
              </div>
              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: '14px',
                lineHeight: 1.7,
                color: '#94a3b8',
                margin: 0,
                maxWidth: '320px',
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   QUICK FIND PORTAL SECTION
   ────────────────────────────────────────────────────────────── */
function QuickFindPortalSection() {
  const { user } = useAuth();
  const [ref, vis] = useReveal(0.15);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const items = [
    { label: 'Doctors', key: 'doctors', path: user ? (user.role === 'doctor' ? '/dashboard' : '/book-appointment') : '/login' },
    { label: 'Book Appointment', key: 'book-appointment', path: user ? (user.role === 'doctor' ? '/dashboard' : '/book-appointment') : '/login' },
    { label: 'My Appointment', key: 'my-appointment', path: user ? (user.role === 'doctor' ? '/dashboard' : '/appointments') : '/login' },
    { label: 'Plans', key: 'plans', path: user ? (user.role === 'doctor' ? '/dashboard' : '/vip') : '/login' },
    { label: 'Prescriptions', key: 'prescriptions', path: user ? (user.role === 'doctor' ? '/dashboard' : '/prescriptions') : '/login' }
  ];

  return (
    <section
      ref={ref}
      style={{
        background: '#ffffff',
        padding: '80px 24px 48px',
        position: 'relative',
        overflow: 'hidden',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1)',
      }}
    >
      {/* Background Watermark Cross (Matches Brand & Screenshot) */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '-10%',
        width: '450px',
        height: '450px',
        opacity: 0.04,
        pointerEvents: 'none',
        color: '#253a5a'
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ width: '100%', height: '100%' }}>
          <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
          <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
          <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
          <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
          <path d="M12 9v6M9 12h6" />
        </svg>
      </div>

      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Label Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#ffffff',
          border: '1px solid #eaedf1',
          borderRadius: '999px',
          padding: '6px 16px 6px 10px',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(37,58,90,0.04)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#253a5a' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
              <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
              <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
              <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
              <path d="M12 9v6M9 12h6" />
            </svg>
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#253a5a', letterSpacing: '0.02em' }}>
            find what your need in 5 seconds
          </span>
        </div>

        {/* Large Typographic Flow */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '16px 28px',
          fontFamily: "'Figtree', sans-serif",
          fontSize: 'clamp(32px, 5.5vw, 68px)',
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: '-1.5px',
        }}>
          {items.map((item, idx) => (
            <span key={item.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '28px' }}>
              <Link
                to={item.path}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  color: hoveredIdx === idx ? '#253a5a' : '#8db5c4',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </Link>
              {idx < items.length - 1 && (
                <span style={{ color: '#8db5c4', fontWeight: 300, userSelect: 'none' }}>+</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   FEEDBACK & PROMO SECTION (Testimonial + 20% Off Checkup)
   ────────────────────────────────────────────────────────────── */
function FeedbackAndPromoSection() {
  const { user } = useAuth();
  const [ref, vis] = useReveal(0.15);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section
      ref={ref}
      style={{
        background: '#ffffff',
        padding: '0 32px 80px',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1)',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '7fr 3fr',
        gap: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Testimonials Card */}
        <div style={{
          backgroundColor: '#8db5c4',
          borderRadius: '32px',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '460px',
          boxSizing: 'border-box'
        }}>
          {/* Huge quotation mark watermark */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '40px',
            color: 'rgba(255, 255, 255, 0.15)',
            fontSize: '320px',
            lineHeight: 1,
            fontFamily: 'Georgia, serif',
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            ”
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', marginBottom: '24px', fontWeight: 600, fontSize: '14px', textTransform: 'lowercase' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>testimonials</span>
            </div>
            <h3 style={{
              color: '#ffffff',
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              fontFamily: "'Figtree', sans-serif",
              margin: '0 0 32px',
              letterSpacing: '-0.6px'
            }}>
              Our Patients Feedbacks
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '15px',
              lineHeight: 1.8,
              fontWeight: 500,
              maxWidth: '520px',
              margin: 0
            }}>
              "Visiting Janki Care was a wonderful experience. Booking an appointment was very easy, and the doctors are extremely professional. The clinic is highly organized, clean, and the staff respects your time. I received top-quality medical attention."
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', relative: 'relative', zIndex: 2, marginTop: '40px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src="https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=200"
                alt="Priya Sharma"
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)' }}
              />
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>Patient of Clinic</div>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '17px' }}>Priya Sharma</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  backgroundColor: '#ffffff',
                  color: '#253a5a',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Portal Card */}
        <div style={{
          borderRadius: '32px',
          overflow: 'hidden',
          position: 'relative',
          minHeight: '460px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          cursor: 'default',
        }}>
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=1200"
            alt="Portal background"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.7s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(27, 43, 58, 0.95) 0%, rgba(27, 43, 58, 0.6) 60%, transparent 100%)',
            zIndex: 1,
          }} />

          <div style={{
            position: 'relative',
            zIndex: 2,
            padding: '40px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '32px', marginBottom: '32px' }}>
              <div style={{ color: '#ffffff', fontSize: '48px', fontWeight: 800, lineHeight: 1, fontFamily: "'Figtree', sans-serif", letterSpacing: '-1px' }}>
                {user ? 'Portal' : 'Login'}
              </div>
              <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, lineHeight: 1.25, paddingBottom: '4px' }}>
                {user ? 'Access your dashboard' : 'Sign in to patient portal'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', lineHeight: 1.6, margin: 0, maxWidth: '280px', fontWeight: 500 }}>
                {user
                  ? `Hello, ${user.name?.split(' ')[0] || 'Patient'}! Manage appointments, prescriptions, and access medical records.`
                  : 'Schedule consultations, view prescriptions, and manage your health records in one secure place.'
                }
              </p>
              <Link
                to={user ? '/dashboard' : '/login'}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#253a5a',
                  padding: '14px 32px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
              >
                {user ? 'View Portal' : 'Login to Portal'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
