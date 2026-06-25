import { useState, useEffect } from 'react';
import api from '../api';

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/v1/superadmin/prescriptions', { limit: 50 }).then((r) => setPrescriptions(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-[#64748b] text-center py-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#64748b]">{prescriptions.length} prescriptions found</p>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-[#f4f5f9] text-xs text-[#64748b] uppercase"><th className="px-6 py-3 text-left">Patient</th><th className="px-6 py-3 text-left">Doctor</th><th className="px-6 py-3 text-left">Diagnosis</th><th className="px-6 py-3 text-left">Medicines</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Date</th></tr></thead>
          <tbody>
            {prescriptions.map((rx) => (
              <tr key={rx._id} className="border-t border-gray-100 hover:bg-[#f4f5f9]/50 transition">
                <td className="px-6 py-3 text-sm text-[#1e293b] font-medium">{rx.patientId?.userId?.name || '—'}</td>
                <td className="px-6 py-3 text-sm text-[#64748b]">{rx.doctorId?.name || '—'}</td>
                <td className="px-6 py-3 text-sm text-[#64748b]">{rx.diagnosis || '—'}</td>
                <td className="px-6 py-3 text-sm text-[#64748b]">{rx.medicines?.length || 0}</td>
                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${rx.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rx.status}</span></td>
                <td className="px-6 py-3 text-sm text-[#94a3b8]">{new Date(rx.issuedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {prescriptions.length === 0 && <p className="p-10 text-center text-[#64748b] text-sm">No prescriptions</p>}
      </div>
    </div>
  );
}
