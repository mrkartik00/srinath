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
  const { user } = useAuth();
  const [headRef, headVis] = useReveal(0.2);
  const [cardRef, cardVis] = useReveal(0.1);
  const [ctaRef, ctaVis] = useReveal(0.2);

  return (
    <>
      <Hero />

      {/* ══════════════════════════════════════════════════════════
          PORTAL INTRO — full-width, premium, animated
          ══════════════════════════════════════════════════════════ */}
      <section style={{
        background: '#f0f4f8',
        position: 'relative',
        overflow: 'hidden',
        paddingBottom: '100px',
      }}>

        {/* Subtle decorative shapes */}
        <div style={{ position: 'absolute', top: '80px', left: '-120px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(54,86,95,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,58,90,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* ── Section Header ── */}
        <div
          ref={headRef}
          style={{
            textAlign: 'center',
            padding: '80px 24px 56px',
            maxWidth: '680px',
            margin: '0 auto',
            opacity: headVis ? 1 : 0,
            transform: headVis ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1)',
          }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#ffffff', border: '1px solid #eaedf1',
            borderRadius: '999px', padding: '6px 16px 6px 10px',
            marginBottom: '24px', boxShadow: '0 2px 8px rgba(37,58,90,0.04)',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#253a5a', letterSpacing: '0.02em' }}>Patient Portal</span>
          </div>

          <h2 style={{
            fontFamily: "'Figtree', sans-serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 900,
            color: '#253a5a',
            margin: '0 0 16px',
            letterSpacing: '-0.6px',
            lineHeight: 1.15,
          }}>
            Everything you need,<br />in one secure place
          </h2>
          <p style={{
            fontSize: '16px', color: '#6B7C84', margin: 0,
            lineHeight: 1.7, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
          }}>
            Your appointments, prescriptions, medical records, and doctor communication — accessible 24/7 from any device.
          </p>
        </div>

        {/* ── Feature Cards Grid ── */}
        <div
          ref={cardRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          {[
            {
              title: 'Smart Scheduling',
              desc: 'Book appointments with your preferred doctor, choose between in-clinic or video consultations, and manage your schedule effortlessly.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#36565F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                </svg>
              ),
              delay: 0,
            },
            {
              title: 'Digital Prescriptions',
              desc: 'Every prescription your doctor issues is digitally stored and accessible instantly — no paper, no confusion, always up to date.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#36565F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
                </svg>
              ),
              delay: 100,
            },
            {
              title: 'Health Records Vault',
              desc: 'Upload, organize, and access your complete medical history. Lab reports, imaging, surgical records — encrypted and always available.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#36565F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
              ),
              delay: 200,
            },
            {
              title: 'Secure Messaging',
              desc: 'Communicate directly with your care team through encrypted, HIPAA-compliant messaging built right into your portal.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#36565F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              ),
              delay: 300,
            },
          ].map(({ title, desc, icon, delay }, idx) => (
            <div
              key={title}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #eaedf1',
                padding: '32px 28px',
                boxShadow: '0 2px 16px rgba(37,58,90,0.03)',
                opacity: cardVis ? 1 : 0,
                transform: cardVis ? 'translateY(0)' : 'translateY(28px)',
                transition: `opacity 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms`,
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,58,90,0.08)';
                e.currentTarget.style.borderColor = '#d0d9e0';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 2px 16px rgba(37,58,90,0.03)';
                e.currentTarget.style.borderColor = '#eaedf1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Subtle top accent line */}
              <div style={{
                position: 'absolute', top: 0, left: '28px', right: '28px', height: '2px',
                background: 'linear-gradient(90deg, transparent, #36565F, transparent)',
                opacity: 0.12,
              }} />

              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: '#f0f4f8', border: '1px solid #eaedf1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
                transition: 'background 0.3s',
              }}>
                {icon}
              </div>
              <h3 style={{
                fontFamily: "'Figtree', sans-serif", fontSize: '17px', fontWeight: 800,
                color: '#253a5a', margin: '0 0 8px', letterSpacing: '-0.2px',
              }}>
                {title}
              </h3>
              <p style={{
                fontSize: '13px', color: '#6B7C84', margin: 0, lineHeight: 1.6,
              }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div
          ref={ctaRef}
          style={{
            maxWidth: '1100px',
            margin: '40px auto 0',
            padding: '0 24px',
            opacity: ctaVis ? 1 : 0,
            transform: ctaVis ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s cubic-bezier(.22,1,.36,1) 0.15s, transform 0.6s cubic-bezier(.22,1,.36,1) 0.15s',
          }}
        >
          <div style={{
            background: '#253a5a',
            borderRadius: '20px',
            padding: '40px 44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle decoration */}
            <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '-30px', right: '-10px', width: '140px', height: '140px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{
                fontFamily: "'Figtree', sans-serif", fontSize: '22px', fontWeight: 800,
                color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.3px',
              }}>
                Ready to take control of your health?
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {user ? 'Your dashboard is waiting.' : 'Sign in or create an account to get started.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
              <Link
                to="/dashboard"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: '#ffffff', color: '#253a5a',
                  padding: '14px 28px', borderRadius: '12px',
                  fontWeight: 800, fontSize: '14px', textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
              >
                Open Portal
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              {!user && (
                <Link
                  to="/register"
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: 'rgba(255,255,255,0.1)', color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '14px 24px', borderRadius: '12px',
                    fontWeight: 700, fontSize: '14px', textDecoration: 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>

      </section>
    </>
  );
}
