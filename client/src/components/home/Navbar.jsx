import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Close on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  // Close on outside click for mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  // Close on outside click for desktop profile dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const glass = isHome && !scrolled && !mobileOpen;

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div ref={menuRef}>
      <nav style={{
        position: 'fixed',
        top: scrolled ? '16px' : '0',
        left: scrolled ? '24px' : '0',
        right: scrolled ? '24px' : '0',
        maxWidth: scrolled ? '1100px' : 'none',
        margin: scrolled ? '0 auto' : 'none',
        height: scrolled ? '56px' : '80px',
        background: glass ? 'transparent' : (scrolled ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255,255,255,0.97)'),
        backdropFilter: glass ? 'none' : 'blur(16px)',
        borderBottom: (glass || scrolled) ? 'none' : '1px solid #eaedf1',
        border: scrolled ? '1px solid rgba(234, 237, 241, 0.8)' : undefined,
        borderRadius: scrolled ? '20px' : '0',
        boxShadow: glass ? 'none' : (scrolled ? '0 8px 32px rgba(37, 58, 90, 0.08)' : '0 2px 20px rgba(37,58,90,0.06)'),
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        alignItems: 'center',
        padding: scrolled ? '0 24px' : '0 32px',
        boxSizing: 'border-box',
        justifyContent: 'space-between',
        zIndex: 200,
      }}>

        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#253a5a" strokeWidth="2.5" style={{ transition: 'stroke 0.3s' }}>
            <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
            <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
            <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
            <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
            <path d="M12 9v6M9 12h6" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 700, fontSize: '16px', color: '#253a5a', lineHeight: 1.1, letterSpacing: '-0.5px', transition: 'color 0.3s' }}>
              Janki Care
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '8.5px', color: glass ? 'rgba(255,255,255,0.85)' : '#8db5c4', letterSpacing: '1px', textTransform: 'uppercase', transition: 'color 0.3s' }}>
              by Dr. Srinath Rathod
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav (hidden on mobile) ── */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

            <NavLink to="/" active={location.pathname === '/'} glass={glass}>Home</NavLink>
            <NavLink to="/dashboard" active={location.pathname === '/dashboard'} glass={glass}>Patient Portal</NavLink>

            <div style={{ width: '1px', height: '18px', background: glass ? 'rgba(255,255,255,0.2)' : '#eaedf1', margin: '0 8px' }} />

            {user ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: glass ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: glass ? '1px solid rgba(255,255,255,0.2)' : '1px solid #eaedf1',
                    padding: '4px 12px 4px 4px', borderRadius: '999px',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = glass ? 'rgba(255,255,255,0.2)' : '#f0f4f8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = glass ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: glass ? 'rgba(255,255,255,0.2)' : '#eef5f7',
                    color: glass ? '#ffffff' : '#253a5a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '13px',
                  }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span style={{
                    fontFamily: "'Figtree', sans-serif", fontWeight: 600, fontSize: '13.5px',
                    color: glass ? '#ffffff' : '#253a5a',
                  }}>
                    {user?.name?.split(' ')[0] || 'Patient'}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: glass ? 'rgba(255,255,255,0.6)' : '#6B7C84' }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: '220px', background: '#ffffff',
                    borderRadius: '16px', border: '1px solid #eaedf1',
                    boxShadow: '0 8px 32px rgba(37,58,90,0.14)',
                    padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px',
                    zIndex: 201,
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#253a5a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                      <div style={{ fontWeight: 500, fontSize: '11px', color: '#8db5c4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                        color: '#253a5a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0f4f8'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                      </svg>
                      My Profile
                    </Link>

                    <button
                      onClick={() => { setDropdownOpen(false); handleSignOut(); }}
                      style={{
                        padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                        color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                background: glass ? 'rgba(255,255,255,0.16)' : '#253a5a',
                border: glass ? '1px solid rgba(255,255,255,0.3)' : 'none',
                color: '#ffffff', textDecoration: 'none', transition: 'all 0.18s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = glass ? 'rgba(255,255,255,0.28)' : '#36565F'; }}
                onMouseLeave={e => { e.currentTarget.style.background = glass ? 'rgba(255,255,255,0.16)' : '#253a5a'; }}
              >
                Login
              </Link>
            )}
          </div>
        )}

        {/* ── Mobile Hamburger (only on mobile) ── */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 8px', color: glass ? '#fff' : '#253a5a',
              display: 'flex', alignItems: 'center', borderRadius: '8px',
            }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        )}
      </nav>

      {/* ── Mobile Dropdown — compact card, NOT full screen ── */}
      {isMobile && mobileOpen && (
        <div style={{
          position: 'fixed',
          top: scrolled ? '82px' : '92px',         /* just below navbar */
          left: '12px',
          right: '12px',
          width: 'auto',       /* explicit: not 100% */
          zIndex: 199,
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #eaedf1',
          boxShadow: '0 8px 32px rgba(37,58,90,0.14)',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflow: 'hidden',
        }}>
          <MobileLink to="/" active={location.pathname === '/'} onClick={() => setMobileOpen(false)}>Home</MobileLink>
          <MobileLink to="/dashboard" active={location.pathname === '/dashboard'} onClick={() => setMobileOpen(false)}>Patient Portal</MobileLink>

          <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 8px' }} />

          {user ? (
            <button
              onClick={() => { setMobileOpen(false); handleSignOut(); }}
              style={{
                padding: '12px 14px', borderRadius: '10px', fontSize: '15px', fontWeight: 600,
                color: '#dc2626', background: '#fef2f2', border: 'none', cursor: 'pointer',
                textAlign: 'left', width: '100%',
              }}
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                padding: '12px 14px', borderRadius: '10px', fontSize: '15px', fontWeight: 700,
                color: '#ffffff', background: '#253a5a', textDecoration: 'none', textAlign: 'center',
                display: 'block',
              }}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function NavLink({ to, active, glass, children }) {
  return (
    <Link
      to={to}
      style={{
        padding: '7px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
        textDecoration: 'none', transition: 'all 0.18s',
        color: glass ? 'rgba(255,255,255,0.92)' : (active ? '#253a5a' : '#6B7C84'),
        background: !glass && active ? '#f0f4f8' : 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = glass ? 'rgba(255,255,255,0.12)' : '#f8fafc'; e.currentTarget.style.color = glass ? '#fff' : '#253a5a'; }}
      onMouseLeave={e => { e.currentTarget.style.background = !glass && active ? '#f0f4f8' : 'transparent'; e.currentTarget.style.color = glass ? 'rgba(255,255,255,0.92)' : (active ? '#253a5a' : '#6B7C84'); }}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, active, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        padding: '12px 14px', borderRadius: '10px', fontSize: '15px', fontWeight: 600,
        color: '#253a5a', textDecoration: 'none',
        background: active ? '#f0f4f8' : 'transparent',
        display: 'block',
      }}
    >
      {children}
    </Link>
  );
}
