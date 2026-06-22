import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: '#253a5a',
      color: '#94a3b8',
      padding: '120px 24px 40px 24px',
      position: 'relative',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden'
    }}>
      {/* Giant Watermark Background */}
      <svg viewBox="0 0 120 120" style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: '50vw',
        minWidth: '600px',
        opacity: 0.03,
        pointerEvents: 'none'
      }}>
        {/* Four circles for clover */}
        <circle cx="40" cy="40" r="30" fill="#ffffff"/>
        <circle cx="80" cy="40" r="30" fill="#ffffff"/>
        <circle cx="40" cy="80" r="30" fill="#ffffff"/>
        <circle cx="80" cy="80" r="30" fill="#ffffff"/>
        {/* Negative space cross */}
        <path d="M50 30 h20 v20 h20 v20 h-20 v20 h-20 v-20 h-20 v-20 h20 z" fill="#253a5a"/>
      </svg>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '60px',
          marginBottom: '80px'
        }}>
          
          {/* Column 1: Brand & CTA */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', color: '#9fb8c5' }}>
                <svg viewBox="0 0 120 120">
                  <circle cx="40" cy="40" r="30" fill="currentColor"/>
                  <circle cx="80" cy="40" r="30" fill="currentColor"/>
                  <circle cx="40" cy="80" r="30" fill="currentColor"/>
                  <circle cx="80" cy="80" r="30" fill="currentColor"/>
                  <path d="M50 30 h20 v20 h20 v20 h-20 v20 h-20 v-20 h-20 v-20 h20 z" fill="#253a5a"/>
                </svg>
              </div>
              <div>
                <h3 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>Dr. Srinath</h3>
                <p style={{ color: '#ffffff', margin: 0, fontSize: '12px', opacity: 0.8 }}>Healthcare Center</p>
              </div>
            </div>
            <p style={{ lineHeight: 1.6, marginBottom: '32px', maxWidth: '300px' }}>
              Our team of highly skilled medical professionals is committed to delivering compassionate and expert care across various specialties.
            </p>
            <Link to="/book-appointment" style={{
              background: '#9fb8c5',
              color: '#0f172a',
              padding: '14px 28px',
              borderRadius: '50px',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'background 0.2s'
            }}>
              Make An Appointment
            </Link>
          </div>

          {/* Column 2: Contact Info */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 600, marginBottom: '32px' }}>Contact Us</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#ffffff', minWidth: '80px' }}>We are Here:</span>
                <span>123 Wellness Ave, Mumbai, MH 400001, India</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#ffffff', minWidth: '80px' }}>Send Mail:</span>
                <span style={{ color: '#ffffff' }}>contact@drsrinath.com</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#ffffff', minWidth: '80px' }}>Call Us:</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>+91 98765 43210</span>
              </div>
            </div>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {['f', 'in', 'ig'].map(icon => (
                <a key={icon} href="#" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#1e293b',
                  color: '#9fb8c5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'background 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.background = '#334155'} onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: Departments */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              background: '#20314d',
              borderRadius: '24px',
              padding: '32px'
            }}>
              <h4 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 600, margin: '0 0 24px 0' }}>Our Departments</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Cardiology', 'Neurology', 'Gastroenterology', 'Endocrinology', 'Gynecology', 'Otolaryngology'].map(dept => (
                  <li key={dept}>
                    <a href="#" style={{
                      color: '#94a3b8',
                      textDecoration: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                      <span>{dept}</span>
                      <span>→</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
        </div>

        {/* Bottom Footer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          md: { flexDirection: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '14px'
        }}>
          <div>Copyright © {new Date().getFullYear()} Dr. Srinath Healthcare. All Rights Reserved</div>
          <div style={{ display: 'flex', gap: '32px', marginTop: '16px', md: { marginTop: 0 } }}>
            <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms of Use</a>
            <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
