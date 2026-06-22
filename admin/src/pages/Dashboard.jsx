import { useState, useEffect } from 'react';
import { getDashboardStats } from '../api/endpoints/dashboard';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

const STAT_CARDS = [
  { key: 'totalPatients', label: 'Total Patients', icon: '👥', gradient: 'from-[#255946] to-[#2d6b54]' },
  { key: 'todayAppointments', label: "Today's Appointments", icon: '📋', gradient: 'from-[#1565C0] to-[#1976D2]' },
  { key: 'completedToday', label: 'Completed Today', icon: '✓', gradient: 'from-[#2E7D32] to-[#388E3C]' },
  { key: 'pendingToday', label: 'Pending', icon: '⏱', gradient: 'from-[#E65100] to-[#F4845F]' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" />;

  const s = stats || {};
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8">
      {/* Hero Greeting */}
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#1e293b]">
          {greeting}, Dr. {user?.name?.split(' ')[0] || 'Admin'}
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Here's what's happening at your practice today.</p>
      </div>

      {/* Stat Cards — gradient with white text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl p-5 text-white shadow-[0_4px_15px_rgba(37,89,70,0.12)] transition-all duration-200 hover:shadow-[0_8px_25px_rgba(37,89,70,0.18)] hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs">↗</span>
            </div>
            <p className="text-3xl font-bold">{s[card.key] ?? 0}</p>
            <p className="text-sm text-white/70 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#1e293b]">Upcoming Appointments</h3>
              <p className="text-xs text-[#64748b] mt-0.5">{s.upcomingAppointments?.length || 0} scheduled</p>
            </div>
            <Badge variant="info" dot>Today</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {s.upcomingAppointments?.length > 0 ? (
              <div className="divide-y divide-[#E8E5DE]/50">
                {s.upcomingAppointments.map((apt, i) => {
                  const patientName = apt.patientId?.userId?.name || 'Unknown Patient';
                  return (
                    <div key={apt._id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F8F6F0]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#255946]/10 to-[#255946]/5 border border-[#255946]/10 flex items-center justify-center text-xs font-semibold text-[#255946]">
                          {patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1e293b]">{patientName}</p>
                          <p className="text-xs text-[#64748b]">
                            {formatDate(apt.dateTime)} at {formatTime(apt.dateTime)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#64748b]">{apt.duration} min</p>
                        {apt.type === 'virtual' && <Badge variant="info">Virtual</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[#64748b]">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#1e293b]">Recent Patients</h3>
              <p className="text-xs text-[#64748b] mt-0.5">{s.recentPatients?.length || 0} new</p>
            </div>
            <Badge variant="success" dot>Active</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {s.recentPatients?.length > 0 ? (
              <div className="divide-y divide-[#E8E5DE]/50">
                {s.recentPatients.map((p) => (
                  <div key={p._id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F8F6F0]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4845F]/10 to-[#F4845F]/5 border border-[#F4845F]/10 flex items-center justify-center text-xs font-semibold text-[#F4845F]">
                        {(p.userId?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1e293b]">{p.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-[#64748b]">{p.userId?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.bloodGroup && <Badge>{p.bloodGroup}</Badge>}
                      <span className="text-xs text-[#64748b] capitalize">{p.gender}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[#64748b]">No patients yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
