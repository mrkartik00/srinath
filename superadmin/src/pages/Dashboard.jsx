import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/superadmin/analytics/overview').then(r => r.data).catch(() => null),
      api.get('/api/v1/superadmin/analytics/growth?range=30d').then(r => r.data).catch(() => null),
    ]).then(([o, g]) => { setData(o); setGrowth(g); setLoading(false); });
  }, []);

  if (loading) return <div className="text-white/50 text-center py-20">Loading...</div>;
  const d = data || {};

  const stats = [
    { label: 'Total Doctors', value: d.totalDoctors, icon: '👨‍⚕️', color: 'from-[#6366f1] to-[#8b5cf6]' },
    { label: 'Active Doctors', value: d.activeDoctors, icon: '✅', color: 'from-[#10b981] to-[#34d399]' },
    { label: 'Pending Approvals', value: d.pendingApprovals, icon: '⏳', color: 'from-[#f59e0b] to-[#fbbf24]' },
    { label: 'Total Patients', value: d.totalPatients, icon: '🏥', color: 'from-[#06b6d4] to-[#22d3ee]' },
    { label: "Today's Appointments", value: d.todayAppointments, icon: '📋', color: 'from-[#ec4899] to-[#f472b6]' },
    { label: 'Active Prescriptions', value: d.activePrescriptions, icon: '💊', color: 'from-[#8b5cf6] to-[#a78bfa]' },
    { label: "Today's Messages", value: d.todayMessages, icon: '💬', color: 'from-[#14b8a6] to-[#2dd4bf]' },
    { label: 'Active Chats', value: d.activeConversations, icon: '🗨️', color: 'from-[#ef4444] to-[#f87171]' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Platform Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
            <span className="text-xl">{s.icon}</span>
            <p className="text-2xl font-bold mt-2">{s.value ?? 0}</p>
            <p className="text-[11px] text-white/70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {growth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Patient Growth (30 days)</h3>
            {growth.patientsGrowth?.length ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={growth.patientsGrowth}>
                  <defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => v?.slice(5)} /><YAxis tick={{ fill: '#64748b', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#06b6d4" fill="url(#gp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-white/40">No data yet</p>}
          </div>
          <div className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Doctor Growth (30 days)</h3>
            {growth.doctorsGrowth?.length ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={growth.doctorsGrowth}>
                  <defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => v?.slice(5)} /><YAxis tick={{ fill: '#64748b', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#gd)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-white/40">No data yet</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Appointments" value={d.totalAppointments} />
        <MiniStat label="Total Prescriptions" value={d.totalPrescriptions} />
        <MiniStat label="Reminders Today" value={d.todayReminders} />
        <MiniStat label="Reminders Sent" value={d.remindersSent} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-[#1e293b] rounded-xl border border-white/10 p-4">
      <p className="text-xl font-bold text-white">{value ?? 0}</p>
      <p className="text-[11px] text-white/50 mt-1">{label}</p>
    </div>
  );
}
