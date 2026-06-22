import { useState, useEffect } from 'react';
import api from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/superadmin/dashboard').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white/50 text-center py-20">Loading...</div>;
  const d = data || {};

  const stats = [
    { label: 'Total Doctors', value: d.totalDoctors, icon: '👨‍⚕️', color: 'from-[#6366f1] to-[#8b5cf6]' },
    { label: 'Total Patients', value: d.totalPatients, icon: '🏥', color: 'from-[#06b6d4] to-[#22d3ee]' },
    { label: 'Total Appointments', value: d.totalAppointments, icon: '📅', color: 'from-[#10b981] to-[#34d399]' },
    { label: "Today's Appointments", value: d.todayAppointments, icon: '📋', color: 'from-[#f59e0b] to-[#fbbf24]' },
    { label: 'Prescriptions', value: d.totalPrescriptions, icon: '📝', color: 'from-[#ef4444] to-[#f87171]' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Platform Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-5 text-white`}>
            <span className="text-2xl">{s.icon}</span>
            <p className="text-2xl font-bold mt-2">{s.value ?? 0}</p>
            <p className="text-xs text-white/70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
