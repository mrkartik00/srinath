import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const navConfig = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: '📊', implemented: true },
      { to: '/analytics', label: 'Analytics', icon: '📈', implemented: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/doctors', label: 'Doctors', icon: '👨‍⚕️', implemented: true },
      { to: '/patients', label: 'Patients', icon: '🏥', implemented: true },
      { to: '/appointments', label: 'Appointments', icon: '📅', implemented: true },
      { to: '/prescriptions', label: 'Prescriptions', icon: '📝', implemented: true },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/plans', label: 'Plans', icon: '💎', implemented: true },
      { to: '/revenue', label: 'Revenue', icon: '💰', implemented: false },
      { to: '/billing', label: 'Billing', icon: '🧾', implemented: false },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { to: '/reminders', label: 'Reminders', icon: '🔔', implemented: false },
      { to: '/medical-vault', label: 'Medical Vault', icon: '🗄️', implemented: false },
      { to: '/ai-chat', label: 'AI Triage Chat', icon: '🤖', implemented: false },
      { to: '/health-updates', label: 'Health Updates', icon: '💊', implemented: false },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: '⚙️', implemented: true },
      { to: '/logs', label: 'System Logs', icon: '📋', implemented: true },
      { to: '/notifications', label: 'Notifications', icon: '🔔', implemented: false },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="h-screen flex overflow-hidden bg-[#0f172a]">
      <aside className="w-60 bg-[#1e293b] text-white flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center text-xs font-bold mr-2">S+</div>
          <span className="text-sm font-bold">Super Admin</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto scrollbar-thin">
          {navConfig.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-white/30 font-medium">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-[#6366f1] text-white font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {!item.implemented && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/60" title="Coming Soon" />}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <div className="px-3 py-2 rounded-lg bg-white/5">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email || 'Super Admin'}</p>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-[#1e293b] border-b border-white/5 flex items-center justify-between px-6">
          <p className="text-xs text-white/40 uppercase tracking-wider">Platform Control</p>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 font-medium">Logout</button>
        </header>
        <main className="flex-1 p-6 overflow-y-auto bg-[#0f172a]"><Outlet /></main>
      </div>
    </div>
  );
}
