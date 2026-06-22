import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyStats } from '../api/endpoints/patient';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, Badge, Button, Spinner } from '../components/ui';

const STAT_CARDS = [
  { key: 'upcomingCount', label: 'Upcoming', icon: '📋', gradient: 'from-[#1565C0] to-[#1976D2]' },
  { key: 'completedCount', label: 'Completed', icon: '✓', gradient: 'from-[#2E7D32] to-[#388E3C]' },
  { key: 'cancelledCount', label: 'Cancelled', icon: '✕', gradient: 'from-[#E65100] to-[#F4845F]' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    getMyStats().then((res) => setStats(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" />;

  const s = stats || {};
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-br from-[#255946] to-[#1e4d3d] rounded-2xl p-8 text-white shadow-[0_8px_30px_rgba(37,89,70,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-white/3 translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-white/60 text-sm">{greeting}</p>
          <h1 className="text-2xl font-serif font-semibold mt-1">{user?.name || 'Patient'}</h1>
          <p className="text-white/60 text-sm mt-2 max-w-md">
            Welcome to your health dashboard. Track appointments, manage your profile, and stay on top of your care.
          </p>
          <Link to="/book-appointment">
            <button className="mt-5 px-5 py-2.5 bg-white text-[#255946] rounded-[10px] text-sm font-medium hover:bg-white/90 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.1)] active:scale-[0.97]">
              Book Appointment →
            </button>
          </Link>
        </div>
      </div>

      {/* Profile completion nudge */}
      {!s.hasProfile && (
        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">👤</span>
            <div>
              <p className="text-sm font-medium text-[#E65100]">Complete your profile</p>
              <p className="text-xs text-[#E65100]/70">Add medical details for personalized care</p>
            </div>
          </div>
          <Link to="/profile">
            <Button size="sm" variant="secondary">Complete →</Button>
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl p-5 text-white shadow-[0_4px_15px_rgba(37,89,70,0.1)] transition-all duration-200 hover:shadow-[0_8px_25px_rgba(37,89,70,0.15)] hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className="text-3xl font-bold">{s[card.key] ?? 0}</p>
            <p className="text-sm text-white/70 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-[#1e293b]">Upcoming Appointments</h3>
              <p className="text-xs text-[#64748b] mt-0.5">{s.upcomingAppointments?.length || 0} scheduled</p>
            </div>
            <Link to="/book-appointment">
              <Button size="sm">Book New</Button>
            </Link>
          </div>

          {!s.upcomingAppointments || s.upcomingAppointments.length === 0 ? (
            <div className="text-center py-10 bg-[#F8F6F0]/50 rounded-xl border border-[#E8E5DE]/50">
              <p className="text-[#64748b] text-sm">No upcoming appointments</p>
              <Link to="/book-appointment">
                <Button size="sm" variant="secondary" className="mt-3">Book Your First Appointment</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {s.upcomingAppointments.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between p-4 rounded-xl bg-[#F8F6F0]/60 border border-[#E8E5DE]/40 hover:border-[#255946]/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#255946]/10 to-[#255946]/5 border border-[#255946]/10 flex items-center justify-center text-sm">
                      📅
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1e293b]">
                        {new Date(apt.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-[#64748b] capitalize">
                        {apt.doctorId?.name || 'Doctor'} • {apt.type?.replace('_', ' ')} • {apt.duration} min
                      </p>
                    </div>
                  </div>
                  <Badge variant="scheduled" dot>Scheduled</Badge>
                </div>
              ))}
              <Link to="/appointments" className="block text-center text-sm text-[#255946] hover:text-[#1a3f32] font-medium mt-3 transition-colors">
                View all appointments →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
