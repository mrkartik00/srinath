import { useState, useEffect } from 'react';
import api from '../api';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = (s) => { setLoading(true); api.get('/api/v1/superadmin/patients', s ? { search: s } : {}).then((r) => setPatients(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">All Patients</h1>
      <div className="flex gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="flex-1 max-w-xs px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" />
        <button onClick={() => fetch(search)} className="px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm">Search</button>
      </div>
      <div className="bg-[#1e293b] rounded-xl border border-white/10 overflow-hidden">
        {loading ? <p className="p-6 text-white/40 text-center">Loading...</p> : patients.length === 0 ? <p className="p-10 text-white/40 text-center text-sm">No patients found</p> : (
          <table className="w-full">
            <thead><tr className="bg-white/5 text-xs text-white/40 uppercase"><th className="px-6 py-3 text-left">Name</th><th className="px-6 py-3 text-left">Email</th><th className="px-6 py-3 text-left">Gender</th><th className="px-6 py-3 text-left">Blood Group</th></tr></thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-6 py-3 text-sm text-white">{p.userId?.name || '—'}</td>
                  <td className="px-6 py-3 text-sm text-white/60">{p.userId?.email}</td>
                  <td className="px-6 py-3 text-sm text-white/60 capitalize">{p.gender || '—'}</td>
                  <td className="px-6 py-3 text-sm text-white/60">{p.bloodGroup || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
