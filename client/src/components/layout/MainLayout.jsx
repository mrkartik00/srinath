import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../home/Navbar';
import Footer from '../home/Footer';
import '../../styles/home.css';
import '../../styles/shared.css';

const AUTH_PATHS = ['/login', '/register'];
const NO_FOOTER_PATHS = ['/book-appointment'];

// Pages where the navbar sits on top of a full-bleed hero (no top-padding needed)
const FULL_BLEED_PATHS = [
  '/',
  '/services',
  '/book-appointment',
];

const FULL_BLEED_PREFIXES = [
  '/appointments',
  '/prescriptions',
  '/profile',
  '/chat',
];

export default function MainLayout() {
  const { pathname } = useLocation();

  // Auth pages render without Navbar / Footer
  if (AUTH_PATHS.includes(pathname)) {
    return <Outlet />;
  }

  // Determine if page manages its own top spacing (full-bleed hero pages)
  const isFullBleed =
    FULL_BLEED_PATHS.includes(pathname) ||
    FULL_BLEED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div
      className="hp-global-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--ds-font)',
      }}
    >
      <Navbar />

      {/*
       * Main content area.
       * - Full-bleed pages: no top padding (hero starts behind the navbar)
       * - Standard pages: 90px top padding to clear the absolute-positioned navbar
       */}
      <main
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: isFullBleed ? 0 : '90px',
        }}
      >
        <Outlet />
      </main>

      {!NO_FOOTER_PATHS.includes(pathname) && <Footer />}
    </div>
  );
}
