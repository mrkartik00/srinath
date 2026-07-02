import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icons = {
  Dashboard: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Analytics: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Doctor: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Patient: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Appt: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Prescription: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Plans: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  Revenue: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Billing: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Bell: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Vault: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  AI: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Health: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  Settings: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Logs: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
};

export const navConfig = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: Icons.Dashboard, implemented: true },
      { to: '/analytics', label: 'Analytics', icon: Icons.Analytics, implemented: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/doctors', label: 'Doctors', icon: Icons.Doctor, implemented: true },
      { to: '/patients', label: 'Patients', icon: Icons.Patient, implemented: true },
      { to: '/appointments', label: 'Appointments', icon: Icons.Appt, implemented: true },
      { to: '/prescriptions', label: 'Prescriptions', icon: Icons.Prescription, implemented: true },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/plans', label: 'Plans', icon: Icons.Plans, implemented: true },
      { to: '/revenue', label: 'Revenue', icon: Icons.Revenue, implemented: false },
      { to: '/billing', label: 'Billing', icon: Icons.Billing, implemented: false },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { to: '/reminders', label: 'Reminders', icon: Icons.Bell, implemented: false },
      { to: '/medical-vault', label: 'Medical Vault', icon: Icons.Vault, implemented: false },
      { to: '/ai-chat', label: 'AI Triage Chat', icon: Icons.AI, implemented: false },
      { to: '/health-updates', label: 'Health Updates', icon: Icons.Health, implemented: false },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: Icons.Settings, implemented: true },
      { to: '/logs', label: 'System Logs', icon: Icons.Logs, implemented: true },
      { to: '/notifications', label: 'Notifications', icon: Icons.Bell, implemented: false },
    ],
  },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => { if (!window.confirm('Sign out?')) return; logout(); navigate('/login'); };

  const initials = (user?.name || 'SA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Dynamic header title
  const allItems = navConfig.flatMap(g => g.items);
  const activeItem = allItems.find(item =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );
  const currentTitle = activeItem?.label || 'Dashboard';
  const currentIcon = activeItem?.icon || Icons.Dashboard;

  return (
    <div className="h-screen flex overflow-hidden bg-[#f4f5f9]" style={{ fontFamily: '"Figtree", sans-serif' }}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#273d71] text-white flex flex-col transform transition-transform duration-300 lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header Logo */}
        <div className="h-16 flex items-center px-4 mt-2">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" className="shrink-0">
              <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" />
              <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" />
              <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" />
              <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" />
              <path d="M12 9v6M9 12h6" />
            </svg>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white leading-none">Janki Care</span>
              <span className="text-[8px] font-semibold text-slate-300 tracking-wider uppercase mt-0.5">Super Admin</span>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="px-4 mt-4 mb-4">
          <div className="bg-white rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#273d71] to-[#1e2f58] border-2 border-[#273d71]/20 flex items-center justify-center text-white font-bold text-sm mb-2">
              {initials}
            </div>
            <h3 className="text-[#273d71] font-bold text-sm">{user?.name || 'Super Admin'}</h3>
            <p className="text-[#64748b] text-xs mt-0.5">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-4">
          {navConfig.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-white/40 font-medium">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 opacity-90">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center">
                      {!item.implemented && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-2" />}
                      <span className="text-white/40 text-xs">▶</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#f4f5f9] flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-[#1e293b]">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 mr-1 rounded-md text-[#273d71] hover:bg-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
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
