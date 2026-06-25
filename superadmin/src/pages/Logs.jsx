import { useState, useEffect } from 'react';
import api from '../api';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/v1/superadmin/logs', { limit: 100 }).then((r) => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-[#64748b] text-center py-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {logs.length === 0 ? <p className="p-10 text-center text-[#64748b] text-sm">No logs yet</p> : (
          <table className="w-full">
            <thead><tr className="bg-[#f4f5f9] text-xs text-[#64748b] uppercase"><th className="px-6 py-3 text-left">Time</th><th className="px-6 py-3 text-left">Actor</th><th className="px-6 py-3 text-left">Action</th><th className="px-6 py-3 text-left">Target</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-t border-gray-100 hover:bg-[#f4f5f9]/50 transition">
                  <td className="px-6 py-3 text-xs text-[#94a3b8]">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm text-[#64748b]">{l.actorName || l.actorId}</td>
                  <td className="px-6 py-3 text-sm text-[#1e293b] font-medium">{l.action}</td>
                  <td className="px-6 py-3 text-sm text-[#94a3b8]">{l.target || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
