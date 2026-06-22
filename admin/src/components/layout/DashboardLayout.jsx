import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navConfig = [
  {
    label: 'Core',
    items: [
      { to: '/', label: 'Dashboard', icon: '📊', implemented: true },
      { to: '/patients', label: 'My Patients', icon: '🏥', implemented: true },
      { to: '/appointments', label: 'Appointments', icon: '📅', implemented: true },
      { to: '/prescriptions', label: 'Prescriptions', icon: '📝', implemented: true },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { to: '/reminders', label: 'Reminders', icon: '🔔', implemented: false },
      { to: '/chat', label: 'Patient Chat', icon: '💬', implemented: true },
      { to: '/medical-vault', label: 'Medical Vault', icon: '🗄️', implemented: false },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', label: 'My Profile', icon: '👤', implemented: false },
      { to: '/availability', label: 'Availability', icon: '🕐', implemented: false },
      { to: '/subscription', label: 'Subscription', icon: '💎', implemented: false },
    ],
  },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const cleanName = (user?.name || 'Doctor').replace(/^Dr\.?\s*/i, '');
  const initials = cleanName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="h-screen flex overflow-hidden bg-[#F8F6F0]">
      <aside className={`bg-gradient-to-b from-[#255946] via-[#1e4d3d] to-[#163a2e] text-white flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-[72px]'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm font-bold">S+</div>
              <span className="text-base font-serif font-bold tracking-tight">Doctor Panel</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-sm">
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navConfig.map((group) => (
            <div key={group.label}>
              {sidebarOpen && <p className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-white/30 font-medium">{group.label}</p>}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${!sidebarOpen ? 'justify-center' : ''} ${isActive ? 'bg-white/15 text-white font-medium' : 'text-white/50 hover:text-white hover:bg-white/8'}`}>
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="flex-1 truncate">{item.label}</span>}
                    {sidebarOpen && !item.implemented && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/60" />}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-3 pb-4 mt-auto border-t border-white/10 pt-3">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/8 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">{initials}</div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Dr. {cleanName.split(' ')[0]}</p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-[#E8E5DE]/60 flex items-center justify-between px-8 shadow-[0_1px_3px_rgba(37,89,70,0.03)]">
          <p className="text-xs text-[#64748b] uppercase tracking-wider font-medium">Doctor Portal</p>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[#1e293b]">Dr. {cleanName.split(' ')[0]}</span>
            <button onClick={handleLogout} className="text-xs text-[#C62828] hover:text-[#B71C1C] font-medium px-3 py-1.5 rounded-lg hover:bg-[#FEF2F2] transition-colors">Logout</button>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
