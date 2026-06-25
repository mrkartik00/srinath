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
      <div className="flex gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="flex-1 max-w-xs px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] placeholder:text-gray-400 focus:outline-none focus:border-[#273d71]" />
        <button onClick={() => fetch(search)} className="px-4 py-2 bg-[#273d71] text-white rounded-lg text-sm hover:bg-[#1e2f58] transition">Search</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <p className="p-6 text-[#64748b] text-center">Loading...</p> : patients.length === 0 ? <p className="p-10 text-[#64748b] text-center text-sm">No patients found</p> : (
          <table className="w-full">
            <thead><tr className="bg-[#f4f5f9] text-xs text-[#64748b] uppercase"><th className="px-6 py-3 text-left">Name</th><th className="px-6 py-3 text-left">Email</th><th className="px-6 py-3 text-left">Gender</th><th className="px-6 py-3 text-left">Blood Group</th></tr></thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} className="border-t border-gray-100 hover:bg-[#f4f5f9]/50 transition">
                  <td className="px-6 py-3 text-sm text-[#1e293b] font-medium">{p.userId?.name || '—'}</td>
                  <td className="px-6 py-3 text-sm text-[#64748b]">{p.userId?.email}</td>
                  <td className="px-6 py-3 text-sm text-[#64748b] capitalize">{p.gender || '—'}</td>
                  <td className="px-6 py-3 text-sm text-[#64748b]">{p.bloodGroup || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
