import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Icons = {
  Dashboard: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Patient: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Appt: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Doc: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Chat: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  Bell: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Search: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Settings: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Grid: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Vault: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  Clock: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Card: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
};

const navConfig = [
  {
    label: '',
    items: [
      { to: '/', label: 'Dashboard', icon: Icons.Dashboard, implemented: true },
      { to: '/patients', label: 'All Patient', icon: Icons.Patient, implemented: true },
      { to: '/prescriptions', label: 'Prescriptions', icon: Icons.Doc, implemented: true },
      { to: '/appointments', label: 'All Appointment', icon: Icons.Appt, implemented: true },
      { to: '/chat', label: 'Messages', icon: Icons.Chat, implemented: true },
      { to: '/reminders', label: 'Reminders', icon: Icons.Bell, implemented: false },
      { to: '/medical-vault', label: 'Medical Vault', icon: Icons.Vault, implemented: false },
      { to: '/availability', label: 'Availability', icon: Icons.Clock, implemented: false },
      { to: '/subscription', label: 'Subscription', icon: Icons.Card, implemented: false },
      { to: '/profile', label: 'My Profile', icon: Icons.Settings, implemented: false },
    ],
  }
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => { if (!window.confirm('Sign out?')) return; logout(); navigate('/login'); };
  const cleanName = (user?.name || 'Doctor').replace(/^Dr\.?\s*/i, '');
  const initials = cleanName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  let currentTitle = 'Dashboard';
  let currentIcon = Icons.Grid;
  
  const allItems = navConfig.flatMap(g => g.items);
  const activeItem = allItems.find(item => 
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  if (activeItem) {
    currentTitle = activeItem.label;
    currentIcon = activeItem.icon;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#f4f5f9] font-sans" style={{ fontFamily: '"Figtree", sans-serif' }}>
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`bg-[#273d71] text-white flex flex-col transition-all duration-300 ${isMobile ? `fixed inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` : sidebarOpen ? 'w-64' : 'w-[72px]'}`}>
        
        {/* Header Logo */}
        <div className="h-16 flex items-center px-4 mt-2">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#eb8c68] flex items-center justify-center text-white font-bold text-sm leading-none">S+</div>
              <span className="text-xl font-bold tracking-tight">Surgirize</span>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-md bg-[#eb8c68] flex items-center justify-center text-white font-bold text-sm leading-none">S+</div>
          )}
        </div>

        {/* Profile Card */}
        {sidebarOpen && (
          <div className="px-4 mt-4 mb-6">
            <div className="bg-white rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#273d71] to-[#1e2f58] border-2 border-[#273d71]/20 flex items-center justify-center text-white font-bold text-sm mb-2">
                {initials}
              </div>
              <h3 className="text-[#273d71] font-bold text-sm">Dr. {cleanName}</h3>
              <p className="text-[#64748b] text-xs mt-0.5">Dermatologist</p>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
          {navConfig.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {group.items.map((item) => (
                <NavLink 
                  key={item.to} 
                  to={item.to} 
                  end={item.to === '/'} 
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all duration-200 ${isActive ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                >
                  <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center w-full' : ''}`}>
                    <span className="flex-shrink-0 opacity-90">{item.icon}</span>
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </div>
                  {sidebarOpen && (
                    <div className="flex items-center">
                      {!item.implemented && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-2" />}
                      <span className="text-white/40 text-xs">▶</span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#f4f5f9] flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-[#1e293b]">
            {isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 rounded-lg hover:bg-gray-200">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            )}
            <span className="text-[#273d71]">{currentIcon}</span>
            <h1 className="text-xl font-bold" style={{ fontFamily: '"Figtree", sans-serif' }}>{currentTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center gap-2 text-[#b91c1c] font-medium text-sm hover:bg-[#b91c1c] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-4 overflow-y-scroll"><Outlet /></main>
      </div>
    </div>
  );
}
