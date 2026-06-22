import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hover states for the two distinct dropdown categories
  const [healthHovered, setHealthHovered] = useState(false);
  const [accountHovered, setAccountHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isTransparent = location.pathname === '/' || location.pathname === '/services';

  const navbarStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '90px',
    background: isTransparent ? 'transparent' : '#8db5c4',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 40px',
    zIndex: 100,
    boxSizing: 'border-box',
  };

  const linkStyle = {
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'opacity 0.2s',
    cursor: 'pointer',
    opacity: 0.95
  };

  const dropdownButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    padding: '10px 0',
    opacity: 0.95
  };

  const dropdownMenuStyle = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    top: '100%',
    width: '200px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    border: '1px solid rgba(0,0,0,0.05)',
    overflow: 'hidden',
    zIndex: 1000,
    padding: '8px 0',
  };

  return (
    <>
      <nav style={navbarStyle} className="hp-animate-fade-up">
        {/* Brand Logo & Name */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
            <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z"/>
            <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z"/>
            <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z"/>
            <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z"/>
            <path d="M12 9v6M9 12h6"/>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontFamily: "'Figtree', sans-serif", 
              fontWeight: 700, 
              fontSize: '20px', 
              color: '#ffffff', 
              lineHeight: 1.1,
              letterSpacing: '-0.5px' 
            }}>
              Dr. Srinath
            </span>
            <span style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontWeight: 500, 
              fontSize: '9px', 
              color: '#ffffff', 
              opacity: 0.85,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Medical Center
            </span>
          </div>
        </Link>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            style={linkStyle}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Home
          </Link>
          <Link 
            to="/services" 
            style={linkStyle}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Services
          </Link>
          
          {user ? (
            <>
              {/* Dropdown 1: My Health */}
              <div 
                className="relative"
                onMouseEnter={() => setHealthHovered(true)}
                onMouseLeave={() => setHealthHovered(false)}
                style={{ display: 'inline-block' }}
              >
                <button style={dropdownButtonStyle}>
                  My Health <span style={{ fontSize: '10px', marginLeft: '2px' }}>▼</span>
                </button>
                
                {healthHovered && (
                  <div style={dropdownMenuStyle}>
                    {[
                      { label: 'Appointments', path: '/appointments' },
                      { label: 'Prescriptions', path: '/prescriptions' },
                      { label: 'Medical Records', path: '/medical-records' },
                      { label: 'Health Feed', path: '/health-feed' },
                    ].map((item) => (
                      <Link 
                        key={item.label}
                        to={item.path}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '14px',
                          color: '#36565f',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eef5f7'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown 2: My Account */}
              <div 
                className="relative"
                onMouseEnter={() => setAccountHovered(true)}
                onMouseLeave={() => setAccountHovered(false)}
                style={{ display: 'inline-block' }}
              >
                <button style={dropdownButtonStyle}>
                  My Account <span style={{ fontSize: '10px', marginLeft: '2px' }}>▼</span>
                </button>
                
                {accountHovered && (
                  <div style={dropdownMenuStyle}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fcfcfc' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1a2b30', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6B7C84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                    </div>
                    {[
                      { label: 'Profile', path: '/profile' },
                      { label: 'Chat', path: '/chat' },
                      { label: 'Reminders', path: '/reminders' },
                      { label: 'VIP Membership', path: '/vip' },
                      { label: 'Payments', path: '/payments' },
                    ].map((item) => (
                      <Link 
                        key={item.label}
                        to={item.path}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '14px',
                          color: '#36565f',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eef5f7'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                    <button 
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        padding: '10px 16px',
                        fontSize: '14px',
                        color: '#C62828',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link 
              to="/login" 
              style={linkStyle}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Patient Portal
            </Link>
          )}
          
          <Link 
            to="/about" 
            style={linkStyle}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            About
          </Link>
          <Link 
            to="/contact" 
            style={linkStyle}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Contact
          </Link>
        </div>

        {/* Right Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <button style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px', opacity: 0.9 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.9'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          
          <button style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px', opacity: 0.9 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.9'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </button>

          <Link 
            to={user ? "/book-appointment" : "/login"}
            style={{
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '50px',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#253a5a';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.color = '#ffffff';
            }}
          >
            Book Online
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '90px',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#ffffff',
          zIndex: 99,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '18px', fontWeight: 600, color: '#36565F', textDecoration: 'none' }}>Home</Link>
          <Link to="/services" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '18px', fontWeight: 600, color: '#36565F', textDecoration: 'none' }}>Services</Link>
          
          {user ? (
            <>
              {/* Profile Header */}
              <div style={{ padding: '10px 0', borderBottom: '1px solid #eef5f7' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1a2b30' }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#6B7C84' }}>{user.email}</p>
              </div>
              
              {/* My Health Group */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '12px' }}>My Health</div>
              <Link to="/appointments" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', color: '#36565F', textDecoration: 'none', paddingLeft: '8px' }}>Appointments</Link>
              <Link to="/prescriptions" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', color: '#36565F', textDecoration: 'none', paddingLeft: '8px' }}>Prescriptions</Link>
              <Link to="/medical-records" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', color: '#36565F', textDecoration: 'none', paddingLeft: '8px' }}>Medical Records</Link>
              <Link to="/health-feed" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', color: '#36565F', textDecoration: 'none', paddingLeft: '8px' }}>Health Feed</Link>
              
              {/* My Account Group */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '12px' }}>My Account</div>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', color: '#36565F', textDecoration: 'none', paddingLeft: '8px' }}>Profile</Link>
              <Link to="/chat" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', color: '#36565F', textDecoration: 'none', paddingLeft: '8px' }}>Chat</Link>
              <Link to="/reminders" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', color: '#36565F', textDecoration: 'none', paddingLeft: '8px' }}>Reminders</Link>
              <Link to="/vip" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', color: '#36565F', textDecoration: 'none', paddingLeft: '8px' }}>VIP Membership</Link>
              <Link to="/payments" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '16px', color: '#36565F', textDecoration: 'none', paddingLeft: '8px' }}>Payments</Link>
              
              <button 
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                style={{
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  color: '#C62828',
                  cursor: 'pointer',
                  padding: '12px 0',
                  marginTop: '12px',
                  borderTop: '1px solid #eef5f7'
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '18px', fontWeight: 600, color: '#36565F', textDecoration: 'none' }}>About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '18px', fontWeight: 600, color: '#36565F', textDecoration: 'none' }}>Contact</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{
                textAlign: 'center',
                background: '#36565F',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                marginTop: '20px'
              }}>
                Patient Login ↗
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
