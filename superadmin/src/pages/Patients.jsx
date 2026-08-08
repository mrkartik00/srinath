import { useState, useEffect } from 'react';
import api from '../api';
import ResetPasswordModal from '../components/ResetPasswordModal';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', gender: '', bloodGroup: '', dateOfBirth: '' });
  const [submitting, setSubmitting] = useState(false);
  const [resetUser, setResetUser] = useState(null);

  const fetchPatients = (s) => {
    setLoading(true);
    api.get('/api/v1/superadmin/patients', s ? { search: s } : {})
      .then((r) => setPatients(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return alert('Name, email and password are required');
    setSubmitting(true);
    try {
      await api.post('/api/v1/superadmin/patients', form);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', password: '', gender: '', bloodGroup: '', dateOfBirth: '' });
      fetchPatients();
    } catch (err) {
      alert(err?.message || 'Failed to add patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="flex-1 min-w-[200px] px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] placeholder:text-gray-400 focus:outline-none focus:border-[#273d71]"
          />
          <button onClick={() => fetchPatients(search)} className="px-4 py-2 bg-[#273d71] text-white rounded-lg text-sm hover:bg-[#1e2f58] transition">
            Search
          </button>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#273d71] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f58] transition flex items-center gap-2"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2v12M2 8h12"/></svg>
          Add Patient
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-[#64748b] text-center">Loading...</p>
        ) : patients.length === 0 ? (
          <p className="p-10 text-[#64748b] text-center text-sm">No patients found</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#f4f5f9] text-xs text-[#64748b] uppercase">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Gender</th>
                <th className="px-6 py-3 text-left">Blood Group</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} className="border-t border-gray-100 hover:bg-[#f4f5f9]/50 transition">
                  <td className="px-6 py-3 text-sm text-[#1e293b] font-medium">{p.userId?.name || '—'}</td>
                  <td className="px-6 py-3 text-sm text-[#64748b]">{p.userId?.email}</td>
                  <td className="px-6 py-3 text-sm text-[#64748b]">{p.userId?.phone || '—'}</td>
                  <td className="px-6 py-3 text-sm text-[#64748b] capitalize">{p.gender || '—'}</td>
                  <td className="px-6 py-3 text-sm text-[#64748b]">{p.bloodGroup || '—'}</td>
                  <td className="px-6 py-3 text-right">
                    {p.userId?._id && (
                      <button
                        onClick={() => setResetUser({ _id: p.userId._id, name: p.userId.name, email: p.userId.email })}
                        className="px-3 py-1.5 text-xs font-medium text-[#273d71] border border-[#273d71]/30 rounded-lg hover:bg-[#273d71]/5 transition"
                      >
                        Reset Password
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1e293b]">Add New Patient</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#273d71]" placeholder="Patient's full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#273d71]" placeholder="patient@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Password *</label>
                <div className="relative">
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required minLength={6} className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#273d71]" placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6z"/><circle cx="9" cy="9" r="2.5"/><path d="M3 15L15 3"/></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6z"/><circle cx="9" cy="9" r="2.5"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#273d71]" placeholder="+91 9876543210" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-1">Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#273d71]">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-1">Blood Group</label>
                  <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#273d71]">
                    <option value="">Select</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Date of Birth</label>
                <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#273d71]" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#64748b] hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-[#273d71] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f58] transition disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ResetPasswordModal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        user={resetUser}
      />
    </div>
  );
}
