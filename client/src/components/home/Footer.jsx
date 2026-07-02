import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: '#253a5a',
      color: '#94a3b8',
      padding: '80px 24px 40px 24px',
      position: 'relative',
      fontFamily: "'Figtree', sans-serif",
      overflow: 'hidden'
    }}>
      {/* Giant Watermark Brand Flower-Cross Logo */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: '50vw',
        minWidth: '600px',
        opacity: 0.02,
        pointerEvents: 'none',
        color: '#ffffff'
      }}>
        <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
        <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
        <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
        <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
        <path d="M12 9v6M9 12h6" />
      </svg>

      <div style={{ maxWidth: '1140px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Brand Information & CTA */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '60px'
        }}>
          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', color: '#9fb8c5', display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '100%', height: '100%' }}>
                <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
                <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
                <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
                <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
                <path d="M12 9v6M9 12h6" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                Janki Care
              </h3>
              <p style={{ color: '#ffffff', margin: 0, fontSize: '12px', opacity: 0.8 }}>
                by Dr. Srinath Rathod
              </p>
            </div>
          </div>

          {/* Description */}
          <p style={{ lineHeight: 1.7, maxWidth: '560px', margin: '0 auto', fontSize: '15px' }}>
            Our team of highly skilled medical professionals is committed to delivering compassionate and expert care across various specialties.
          </p>

          {/* Make Appointment Link */}
          <Link to="/book-appointment" style={{
            background: '#9fb8c5',
            color: '#0f172a',
            padding: '14px 32px',
            borderRadius: '50px',
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'background 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }} onMouseEnter={e => e.currentTarget.style.background = '#81a0b0'} onMouseLeave={e => e.currentTarget.style.background = '#9fb8c5'}>
            Make An Appointment
          </Link>
        </div>

        {/* Bottom Footer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '14px',
          gap: '16px'
        }}>
          <div>Copyright © {new Date().getFullYear()} Janki Care. All Rights Reserved</div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Terms of Use</a>
            <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
