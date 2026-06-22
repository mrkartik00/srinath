import { useState, useEffect } from 'react';
import api from '../api';

const statusColor = { scheduled: 'bg-blue-500/20 text-blue-400', completed: 'bg-green-500/20 text-green-400', cancelled: 'bg-red-500/20 text-red-400', no_show: 'bg-yellow-500/20 text-yellow-400' };

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/v1/superadmin/appointments', { limit: 50 }).then((r) => setAppointments(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-white/50 text-center py-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">All Appointments ({appointments.length})</h1>
      <div className="bg-[#1e293b] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-white/5 text-xs text-white/40 uppercase"><th className="px-6 py-3 text-left">Patient</th><th className="px-6 py-3 text-left">Doctor</th><th className="px-6 py-3 text-left">Date</th><th className="px-6 py-3 text-left">Type</th><th className="px-6 py-3 text-left">Status</th></tr></thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a._id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-6 py-3 text-sm text-white">{a.patientId?.userId?.name || '—'}</td>
                <td className="px-6 py-3 text-sm text-white/60">{a.doctorId?.name || '—'}</td>
                <td className="px-6 py-3 text-sm text-white/60">{new Date(a.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-6 py-3 text-sm text-white/60 capitalize">{a.type?.replace('_', ' ')}</td>
                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-xs ${statusColor[a.status] || ''}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && <p className="p-10 text-center text-white/40 text-sm">No appointments</p>}
      </div>
    </div>
  );
}
