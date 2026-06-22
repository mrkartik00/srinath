import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [form, setForm] = useState({ key: '', value: '', category: 'general', description: '' });

  const fetch = () => api.get('/api/v1/superadmin/settings').then((r) => setSettings(r.data)).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try { await api.post('/api/v1/superadmin/settings', form); toast.success('Setting saved'); setForm({ key: '', value: '', category: 'general', description: '' }); fetch(); }
    catch (err) { toast.error(err.message); }
  };

  const categories = ['general', 'branding', 'ai', 'notifications', 'features'];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Platform Settings</h1>

      <form onSubmit={handleSave} className="bg-[#1e293b] rounded-xl p-6 grid grid-cols-2 gap-4 border border-white/10">
        <input placeholder="Key (e.g. ai.enabled)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" />
        <input placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#6366f1]">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" />
        <button type="submit" className="col-span-2 py-2.5 bg-[#6366f1] text-white rounded-lg text-sm font-medium">Save Setting</button>
      </form>

      <div className="bg-[#1e293b] rounded-xl border border-white/10 overflow-hidden">
        {settings.length === 0 ? <p className="p-10 text-center text-white/40 text-sm">No settings configured</p> : (
          <table className="w-full">
            <thead><tr className="bg-white/5 text-xs text-white/40 uppercase"><th className="px-6 py-3 text-left">Key</th><th className="px-6 py-3 text-left">Value</th><th className="px-6 py-3 text-left">Category</th></tr></thead>
            <tbody>
              {settings.map((s) => (
                <tr key={s._id} className="border-t border-white/5">
                  <td className="px-6 py-3 text-sm text-white font-mono">{s.key}</td>
                  <td className="px-6 py-3 text-sm text-white/60">{typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)}</td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/40">{s.category}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
