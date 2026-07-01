import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  Calendar,
  MessageSquare,
  PlusSquare,
  Folder,
  Pill,
  Clock,
  CreditCard,
  Award,
  BookOpen,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  ArrowRight,
  Sidebar
} from 'lucide-react';
import '../../styles/shared.css';
import RightUtilityPanel from './RightUtilityPanel';

const IconMap = {
  LayoutGrid,
  Calendar,
  MessageSquare,
  PlusSquare,
  Folder,
  Pill,
  Clock,
  CreditCard,
  Award,
  BookOpen,
  User,
  LogOut
};

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    if (!window.confirm('Sign out?')) return;
    logout();
    navigate('/');
  };

  const navigationCategories = [
    {
      title: 'DASHBOARD',
      items: [
        { label: 'Dashboard / Overview', path: '/dashboard', icon: 'LayoutGrid' },
        { label: 'Appointments', path: '/appointments', icon: 'Calendar' },
        { label: 'Book Appointment', path: '/book-appointment', icon: 'PlusSquare' },
        { label: 'Chat', path: '/chat', icon: 'MessageSquare' },
      ]
    },
    {
      title: 'MEDICAL',
      items: [
        { label: 'Medical Records', path: '/medical-records', icon: 'Folder' },
        { label: 'Prescriptions', path: '/prescriptions', icon: 'Pill' },
        { label: 'Reminders', path: '/reminders', icon: 'Clock' },
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { label: 'Payments', path: '/payments', icon: 'CreditCard' },
        { label: 'VIP Membership', path: '/vip', icon: 'Award' },
      ]
    },
    {
      title: 'UNDERSTAND',
      items: [
        { label: 'Health Feed', path: '/health-feed', icon: 'BookOpen' },
      ]
    }
  ];

  const getIsActive = (itemPath, label) => {
    if (label === 'Dashboard / Overview') {
      return location.pathname === '/dashboard';
    }
    if (label === 'Appointments') {
      return location.pathname.startsWith('/appointments');
    }
    if (label === 'VIP Membership' && location.pathname === '/vip') {
      return true; // We can check if VIP is active
    }
    if (label === 'VIP Card' && location.pathname === '/vip') {
      return true;
    }
    if (itemPath !== '/' && location.pathname.startsWith(itemPath)) {
      return true;
    }
    return location.pathname === itemPath;
  };

  const brandColor = '#36565F';
  const sidebarWidth = isMobile ? '280px' : (isCollapsed ? '80px' : '280px');

  return (
    <>
    {/* Guest Login Banner */}
    {!user && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
        background: '#253a5a', color: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
        padding: '10px 20px', fontSize: '13px', fontWeight: 600,
      }}>
        <span>👋 You're browsing as a guest.</span>
        <Link to="/login" style={{
          background: '#ffffff', color: '#253a5a',
          padding: '4px 14px', borderRadius: '999px',
          fontWeight: 700, fontSize: '12px', textDecoration: 'none',
        }}>Login to access all features</Link>
      </div>
    )}
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafb', fontFamily: "'Inter', sans-serif", marginTop: !user ? '42px' : 0 }}>

      {/* ── Mobile Header Bar ── */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: !user ? '42px' : 0,
          left: 0,
          right: 0,
          height: '68px',
          background: '#ffffff',
          borderBottom: '1px solid #eaedf1',
          zIndex: 45,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2.5">
              <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
              <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
              <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
              <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
              <path d="M12 9v6M9 12h6" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 700, fontSize: '16px', color: brandColor, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                Dr. Srinath
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '8.5px', color: '#8db5c4', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Patient Portal
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: !user ? '54px' : '12px',
            left: '16px',
            zIndex: 100,
            width: '44px',
            height: '44px',
            background: '#ffffff',
            border: '1px solid #eef5f7',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,58,90,0.05)',
            cursor: 'pointer', color: brandColor,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 12h16M4 6h16M4 18h16" />}
          </svg>
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.2)',
            zIndex: 40,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          background: '#f0f4f8',
          borderRight: '1px solid #eaedf1',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: (isMobile && !sidebarOpen) ? 'translateX(-100%)' : 'translateX(0)',
          overflowX: 'hidden',
          overflowY: 'auto',
          willChange: 'width, transform',
        }}
      >
        {/* ── Logo Header + Inline Toggle (Desktop) ── */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: (isCollapsed && !isMobile) ? 'center' : 'flex-start',
          height: '76px',
          padding: (isCollapsed && !isMobile) ? '0' : '0 52px 0 24px',
          borderBottom: '1px solid #eaedf1',
          boxSizing: 'border-box',
          flexShrink: 0,
          transition: 'padding 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Logo / Icon — clicks navigate to homepage */}
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', minWidth: 0, textDecoration: 'none' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
              <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
              <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
              <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
              <path d="M12 9v6M9 12h6" />
            </svg>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              opacity: (isCollapsed && !isMobile) ? 0 : 1,
              maxWidth: (isCollapsed && !isMobile) ? '0' : '180px',
              transition: 'opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 700, fontSize: '18px', color: brandColor, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                Dr. Srinath
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '9px', color: '#8db5c4', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Patient Portal
              </span>
            </div>
          </Link>

          {/* Arrow toggle — absolutely pinned to right, never overlaps logo */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '26px',
                height: '26px',
                background: 'transparent',
                border: '1.5px solid #eaedf1',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#718096',
                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#253a5a';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#253a5a';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#718096';
                e.currentTarget.style.borderColor = '#eaedf1';
              }}
            >
              {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          )}
        </div>




        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '16px 0 0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {navigationCategories.map((category, catIdx) => (
              <div key={catIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {isCollapsed ? (
                  <div style={{ margin: '12px 16px 4px', height: '1px', background: '#eaedf1' }} />
                ) : (
                  <div style={{ 
                    padding: '0 24px 4px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: '#A0AEC0', 
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    {category.title}
                  </div>
                )}
                
                {category.items.map((item, itemIdx) => {
                  const isActive = getIsActive(item.path, item.label);
                  const IconComponent = IconMap[item.icon];
                  
                  return (
                    <div
                      key={itemIdx}
                      className={isCollapsed ? 'sidebar-tooltip-wrap' : ''}
                      data-label={item.label}
                      style={{ position: 'relative' }}
                    >
                      <Link
                        to={item.path}
                        style={isCollapsed ? {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 0',
                          margin: '2px auto',
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: isActive ? '#ffffff' : '#718096',
                          background: isActive ? '#253a5a' : 'transparent',
                          transition: 'background 0.2s ease, color 0.2s ease',
                          flexShrink: 0,
                        } : {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 16px',
                          margin: '0 16px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: isActive ? '#ffffff' : '#718096',
                          background: isActive ? '#253a5a' : 'transparent',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '14px',
                          transition: 'background 0.2s ease, color 0.2s ease',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#253a5a';
                          e.currentTarget.style.color = '#ffffff';
                          const icon = e.currentTarget.querySelector('svg');
                          if (icon) icon.style.color = '#ffffff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = isActive ? '#253a5a' : 'transparent';
                          e.currentTarget.style.color = isActive ? '#ffffff' : '#718096';
                          const icon = e.currentTarget.querySelector('svg');
                          if (icon) icon.style.color = isActive ? '#ffffff' : '#A0AEC0';
                        }}
                      >
                        {IconComponent && <IconComponent size={18} style={{ color: isActive ? '#ffffff' : '#A0AEC0', flexShrink: 0, transition: 'color 0.2s ease' }} />}
                        <span style={{
                          opacity: isCollapsed ? 0 : 1,
                          maxWidth: isCollapsed ? '0' : '200px',
                          overflow: 'hidden',
                          transition: 'opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1)',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}>{item.label}</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>



          {/* User Profile Card Footer */}
          <div style={{ 
            borderTop: '1px solid #eaedf1', 
            padding: '16px',
            boxSizing: 'border-box'
          }}>
            {isCollapsed ? (
              <Link
                to="/profile"
                title="Profile"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '44px',
                  height: '44px',
                  margin: '0 auto',
                  borderRadius: '50%',
                  background: '#eef5f7',
                  color: '#253a5a',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Link>
            ) : (
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  padding: '8px',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  color: 'inherit'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#eef5f7';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#eef5f7',
                    color: '#253a5a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#253a5a', fontSize: '13.5px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontFamily: "'Figtree', sans-serif" }}>
                      {user?.name || 'Patient'}
                    </div>
                    <div style={{ color: '#8db5c4', fontSize: '11px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontWeight: 500 }}>
                      {user?.email || 'patient@example.com'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#A0AEC0', flexShrink: 0, marginLeft: '8px' }} />
              </Link>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingTop: isMobile ? '68px' : '0',
      }}>


        {/* Outlet Content */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </main>

      {location.pathname === '/dashboard' && <RightUtilityPanel isMobile={isMobile} />}
    </div>

    {/* ── Sidebar Tooltip CSS ── */}
    <style>{`
      .sidebar-tooltip-wrap {
        position: relative;
      }
      .sidebar-tooltip-wrap::after {
        content: attr(data-label);
        position: absolute;
        left: calc(100% + 14px);
        top: 50%;
        transform: translateY(-50%) translateX(-6px);
        background: #253a5a;
        color: #ffffff;
        font-family: 'Figtree', sans-serif;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        padding: 5px 12px;
        border-radius: 8px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s ease;
        z-index: 200;
        box-shadow: 0 4px 12px rgba(37,58,90,0.18);
        letter-spacing: 0.01em;
      }
      .sidebar-tooltip-wrap::before {
        content: '';
        position: absolute;
        left: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%) translateX(-6px);
        border: 5px solid transparent;
        border-right-color: #253a5a;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s ease;
        z-index: 200;
      }
      .sidebar-tooltip-wrap:hover::after,
      .sidebar-tooltip-wrap:hover::before {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }
    `}</style>
    </>
  );
}
