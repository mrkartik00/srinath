import { useState, useEffect } from 'react';
import api from '../api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/v1/superadmin/analytics').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-[#64748b] text-center py-20">Loading...</div>;
  const { patientGrowth = [], appointmentsByStatus = [], doctorPerformance = [] } = data || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Growth */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Patient Growth (30 days)</h3>
          {patientGrowth.length === 0 ? <p className="text-sm text-[#64748b]">No data yet</p> : (
            <div className="space-y-1">
              {patientGrowth.map((d) => (
                <div key={d._id} className="flex items-center gap-3">
                  <span className="text-xs text-[#94a3b8] w-20">{d._id}</span>
                  <div className="flex-1 h-4 bg-[#f4f5f9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#273d71] rounded-full" style={{ width: `${Math.min(100, d.count * 20)}%` }} />
                  </div>
                  <span className="text-xs text-[#1e293b] font-medium w-6 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Appointments by Status</h3>
          <div className="space-y-3">
            {appointmentsByStatus.map((s) => (
              <div key={s._id} className="flex items-center justify-between">
                <span className="text-sm text-[#64748b] capitalize">{s._id?.replace('_', ' ')}</span>
                <span className="text-sm font-bold text-[#1e293b]">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Performance */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Top Doctors (by completed appointments)</h3>
          {doctorPerformance.length === 0 ? <p className="text-sm text-[#64748b]">No data yet</p> : (
            <div className="space-y-2">
              {doctorPerformance.map((d, i) => (
                <div key={d._id} className="flex items-center gap-3">
                  <span className="text-xs text-[#94a3b8] w-6">#{i + 1}</span>
                  <span className="text-sm text-[#1e293b] flex-1">{d.name}</span>
                  <span className="text-sm font-bold text-[#273d71]">{d.completed}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
