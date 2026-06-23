import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../home/Navbar';
import Footer from '../home/Footer';
import '../../styles/home.css';

export default function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isServices = location.pathname === '/services';
  
  // If we are on the login or register page, we might just show the raw layout or hide navbar.
  // Actually, login and register have their own full-bleed layouts.
  // Let's hide the Navbar and Footer on auth pages to match original design.
  const isAuth = location.pathname === '/login' || location.pathname === '/register';

  if (isAuth) {
    return <Outlet />;
  }

  const isFullBleed = isHome || isServices || location.pathname === '/book-appointment' || location.pathname.startsWith('/appointments');

  return (
    <div 
      className="min-h-screen flex flex-col hp-global-bg" 
    >
      <Navbar />
      
      {/* Content wrapper with no artificial restriction so pages can span 1680px */}
      <main className={`flex-1 w-full flex flex-col ${!isFullBleed ? 'pt-[120px]' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
