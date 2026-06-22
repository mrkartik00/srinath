import { useState, useEffect } from 'react';
import api from '../api';

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/v1/superadmin/prescriptions', { limit: 50 }).then((r) => setPrescriptions(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-white/50 text-center py-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">All Prescriptions ({prescriptions.length})</h1>
      <div className="bg-[#1e293b] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-white/5 text-xs text-white/40 uppercase"><th className="px-6 py-3 text-left">Patient</th><th className="px-6 py-3 text-left">Doctor</th><th className="px-6 py-3 text-left">Diagnosis</th><th className="px-6 py-3 text-left">Medicines</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Date</th></tr></thead>
          <tbody>
            {prescriptions.map((rx) => (
              <tr key={rx._id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-6 py-3 text-sm text-white">{rx.patientId?.userId?.name || '—'}</td>
                <td className="px-6 py-3 text-sm text-white/60">{rx.doctorId?.name || '—'}</td>
                <td className="px-6 py-3 text-sm text-white/60">{rx.diagnosis || '—'}</td>
                <td className="px-6 py-3 text-sm text-white/60">{rx.medicines?.length || 0}</td>
                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-xs ${rx.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{rx.status}</span></td>
                <td className="px-6 py-3 text-sm text-white/40">{new Date(rx.issuedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {prescriptions.length === 0 && <p className="p-10 text-center text-white/40 text-sm">No prescriptions</p>}
      </div>
    </div>
  );
}
