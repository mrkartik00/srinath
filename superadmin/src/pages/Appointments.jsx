import { useState, useEffect } from 'react';
import api from '../api';

const statusColor = { scheduled: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', no_show: 'bg-yellow-100 text-yellow-700' };

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/v1/superadmin/appointments', { limit: 50 }).then((r) => setAppointments(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-[#64748b] text-center py-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#64748b]">{appointments.length} appointments found</p>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-[#f4f5f9] text-xs text-[#64748b] uppercase"><th className="px-6 py-3 text-left">Patient</th><th className="px-6 py-3 text-left">Doctor</th><th className="px-6 py-3 text-left">Date</th><th className="px-6 py-3 text-left">Type</th><th className="px-6 py-3 text-left">Status</th></tr></thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a._id} className="border-t border-gray-100 hover:bg-[#f4f5f9]/50 transition">
                <td className="px-6 py-3 text-sm text-[#1e293b] font-medium">{a.patientId?.userId?.name || '—'}</td>
                <td className="px-6 py-3 text-sm text-[#64748b]">{a.doctorId?.name || '—'}</td>
                <td className="px-6 py-3 text-sm text-[#64748b]">{new Date(a.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-6 py-3 text-sm text-[#64748b] capitalize">{a.type?.replace('_', ' ')}</td>
                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[a.status] || ''}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && <p className="p-10 text-center text-[#64748b] text-sm">No appointments</p>}
      </div>
    </div>
  );
}
