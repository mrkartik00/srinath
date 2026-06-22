import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', specialization: '', qualification: '', licenseNumber: '', experience: '', consultationFee: '' });
  const navigate = useNavigate();

  const fetch = () => { setLoading(true); api.get('/api/v1/superadmin/doctors').then((r) => setDoctors(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/api/v1/superadmin/doctors', { ...form, experience: +form.experience, consultationFee: +form.consultationFee }); toast.success('Doctor added'); setShowForm(false); fetch(); }
    catch (err) { toast.error(err.message); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this doctor?')) return;
    try { await api.delete(`/api/v1/superadmin/doctors/${id}`); toast.success('Deactivated'); fetch(); } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="text-white/50 text-center py-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Doctors ({doctors.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#5558e6]">{showForm ? 'Cancel' : '+ Add Doctor'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1e293b] rounded-xl p-6 grid grid-cols-2 gap-4 border border-white/10">
          {['name', 'email', 'password', 'phone', 'specialization', 'qualification', 'licenseNumber', 'experience', 'consultationFee'].map((f) => (
            <input key={f} placeholder={f.replace(/([A-Z])/g, ' $1')} type={f === 'password' ? 'password' : f === 'experience' || f === 'consultationFee' ? 'number' : 'text'} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required={['name', 'email', 'password'].includes(f)} className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" />
          ))}
          <button type="submit" className="col-span-2 py-2.5 bg-[#6366f1] text-white rounded-lg text-sm font-medium">Add Doctor</button>
        </form>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-white/10 overflow-hidden">
        {doctors.map((doc) => (
          <div key={doc._id} onClick={() => navigate(`/doctors/${doc._id}`)} className="px-6 py-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-white">{doc.name}</p>
              <p className="text-xs text-white/40">{doc.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-xs ${doc.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{doc.isActive ? 'Active' : 'Inactive'}</span>
              {doc.isActive && <button onClick={(e) => { e.stopPropagation(); handleDeactivate(doc._id); }} className="text-xs text-red-400 hover:text-red-300">Deactivate</button>}
            </div>
          </div>
        ))}
        {doctors.length === 0 && <p className="px-6 py-10 text-center text-white/40 text-sm">No doctors yet</p>}
      </div>
    </div>
  );
}
