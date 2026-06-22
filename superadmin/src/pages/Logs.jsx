import { useState, useEffect } from 'react';
import api from '../api';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/v1/superadmin/logs', { limit: 100 }).then((r) => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-white/50 text-center py-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">System Logs</h1>
      <div className="bg-[#1e293b] rounded-xl border border-white/10 overflow-hidden">
        {logs.length === 0 ? <p className="p-10 text-center text-white/40 text-sm">No logs yet</p> : (
          <table className="w-full">
            <thead><tr className="bg-white/5 text-xs text-white/40 uppercase"><th className="px-6 py-3 text-left">Time</th><th className="px-6 py-3 text-left">Actor</th><th className="px-6 py-3 text-left">Action</th><th className="px-6 py-3 text-left">Target</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-t border-white/5">
                  <td className="px-6 py-3 text-xs text-white/40">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm text-white/60">{l.actorName || l.actorId}</td>
                  <td className="px-6 py-3 text-sm text-white">{l.action}</td>
                  <td className="px-6 py-3 text-sm text-white/40">{l.target || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
