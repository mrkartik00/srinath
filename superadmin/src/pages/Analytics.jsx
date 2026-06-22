import { useState, useEffect } from 'react';
import api from '../api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/v1/superadmin/analytics').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-white/50 text-center py-20">Loading...</div>;
  const { patientGrowth = [], appointmentsByStatus = [], doctorPerformance = [] } = data || {};

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Growth */}
        <div className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Patient Growth (30 days)</h3>
          {patientGrowth.length === 0 ? <p className="text-sm text-white/40">No data yet</p> : (
            <div className="space-y-1">
              {patientGrowth.map((d) => (
                <div key={d._id} className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-20">{d._id}</span>
                  <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6366f1] rounded-full" style={{ width: `${Math.min(100, d.count * 20)}%` }} />
                  </div>
                  <span className="text-xs text-white w-6 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Appointments by Status</h3>
          <div className="space-y-3">
            {appointmentsByStatus.map((s) => (
              <div key={s._id} className="flex items-center justify-between">
                <span className="text-sm text-white/60 capitalize">{s._id?.replace('_', ' ')}</span>
                <span className="text-sm font-bold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Performance */}
        <div className="bg-[#1e293b] rounded-xl border border-white/10 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Top Doctors (by completed appointments)</h3>
          {doctorPerformance.length === 0 ? <p className="text-sm text-white/40">No data yet</p> : (
            <div className="space-y-2">
              {doctorPerformance.map((d, i) => (
                <div key={d._id} className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-6">#{i + 1}</span>
                  <span className="text-sm text-white flex-1">{d.name}</span>
                  <span className="text-sm font-bold text-[#6366f1]">{d.completed}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
