import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'rejected', label: 'Rejected' },
];

export default function Doctors() {
  const [tab, setTab] = useState('active');
  const [doctors, setDoctors] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', specialization: '', qualification: '', licenseNumber: '', experience: '', consultationFee: '' });
  const navigate = useNavigate();

  const fetchDoctors = () => { setLoading(true); api.get('/api/v1/superadmin/doctors').then((r) => setDoctors(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  const fetchRegistrations = (status) => { setLoading(true); api.get('/api/v1/superadmin/registrations', { status }).then((r) => setRegistrations(r.data)).catch(() => {}).finally(() => setLoading(false)); };

  useEffect(() => {
    if (tab === 'active') fetchDoctors();
    else if (tab === 'pending') fetchRegistrations('pending_approval');
    else fetchRegistrations('rejected');
  }, [tab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/api/v1/superadmin/doctors', { ...form, experience: +form.experience, consultationFee: +form.consultationFee }); toast.success('Doctor added'); setShowForm(false); fetchDoctors(); }
    catch (err) { toast.error(err.message); }
  };

  const handleApprove = async (id) => {
    try { await api.patch(`/api/v1/superadmin/registrations/${id}/approve`); toast.success('Doctor approved'); fetchRegistrations('pending_approval'); } catch (err) { toast.error(err.message); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try { await api.patch(`/api/v1/superadmin/registrations/${rejectModal}/reject`, { reason: rejectReason }); toast.success('Doctor rejected'); setRejectModal(null); setRejectReason(''); fetchRegistrations('pending_approval'); } catch (err) { toast.error(err.message); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this doctor?')) return;
    try { await api.delete(`/api/v1/superadmin/doctors/${id}`); toast.success('Deactivated'); fetchDoctors(); } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1e293b]">Doctors</h1>
        {tab === 'active' && <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[#273d71] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f58] transition">{showForm ? 'Cancel' : '+ Add Doctor'}</button>}
      </div>

      <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-100 shadow-sm w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-md text-xs font-medium transition ${tab === t.key ? 'bg-[#273d71] text-white' : 'text-[#64748b] hover:text-[#1e293b]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {showForm && tab === 'active' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 grid grid-cols-2 gap-4 border border-gray-100 shadow-sm">
          {['name', 'email', 'password', 'phone', 'specialization', 'qualification', 'licenseNumber', 'experience', 'consultationFee'].map((f) => (
            <input key={f} placeholder={f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} type={f === 'password' ? 'password' : ['experience', 'consultationFee'].includes(f) ? 'number' : 'text'} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required={['name', 'email', 'password'].includes(f)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] placeholder:text-gray-400 focus:outline-none focus:border-[#273d71]" />
          ))}
          <button type="submit" className="col-span-2 py-2.5 bg-[#273d71] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f58] transition">Add Doctor</button>
        </form>
      )}

      {loading && <div className="text-[#64748b] text-center py-10">Loading...</div>}

      {!loading && tab === 'active' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {doctors.map((doc) => (
            <div key={doc._id} onClick={() => navigate(`/doctors/${doc._id}`)} className="px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-[#f4f5f9]/50 transition cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[#1e293b]">{doc.name}</p>
                <p className="text-xs text-[#64748b]">{doc.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${doc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{doc.isActive ? 'Active' : 'Inactive'}</span>
                {doc.isActive && <button onClick={(e) => { e.stopPropagation(); handleDeactivate(doc._id); }} className="text-xs text-red-500 hover:text-red-600 font-medium">Deactivate</button>}
              </div>
            </div>
          ))}
          {doctors.length === 0 && <p className="px-6 py-10 text-center text-[#64748b] text-sm">No active doctors</p>}
        </div>
      )}

      {!loading && (tab === 'pending' || tab === 'rejected') && (
        <div className="space-y-3">
          {registrations.map((doc) => (
            <div key={doc._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1e293b]">{doc.name}</p>
                  <p className="text-xs text-[#64748b]">{doc.email} • {doc.phone}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${doc.approvalStatus === 'pending_approval' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                  {doc.approvalStatus === 'pending_approval' ? 'Pending' : 'Rejected'}
                </span>
              </div>
              {doc.profile && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div><span className="text-[#94a3b8]">Specialization:</span> <span className="text-[#1e293b] font-medium ml-1">{doc.profile.specialization}</span></div>
                  <div><span className="text-[#94a3b8]">Qualification:</span> <span className="text-[#1e293b] font-medium ml-1">{doc.profile.qualification}</span></div>
                  <div><span className="text-[#94a3b8]">License:</span> <span className="text-[#1e293b] font-medium ml-1">{doc.profile.licenseNumber}</span></div>
                  <div><span className="text-[#94a3b8]">Experience:</span> <span className="text-[#1e293b] font-medium ml-1">{doc.profile.experience} yrs</span></div>
                  {doc.profile.clinicName && <div><span className="text-[#94a3b8]">Clinic:</span> <span className="text-[#1e293b] font-medium ml-1">{doc.profile.clinicName}</span></div>}
                  {doc.profile.aboutMe && <div className="col-span-2"><span className="text-[#94a3b8]">About:</span> <span className="text-[#1e293b] ml-1">{doc.profile.aboutMe}</span></div>}
                </div>
              )}
              {tab === 'pending' && (
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => handleApprove(doc._id)} className="px-4 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition">Approve</button>
                  <button onClick={() => setRejectModal(doc._id)} className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition">Reject</button>
                </div>
              )}
              {tab === 'rejected' && doc.profile?.rejectionReason && (
                <p className="mt-3 text-xs text-red-500">Reason: {doc.profile.rejectionReason}</p>
              )}
            </div>
          ))}
          {registrations.length === 0 && <p className="text-center text-[#64748b] text-sm py-10">{tab === 'pending' ? 'No pending registrations' : 'No rejected registrations'}</p>}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-md">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Reject Doctor</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] placeholder:text-gray-400 focus:outline-none focus:border-[#273d71] mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 text-xs text-[#64748b] hover:text-[#1e293b] font-medium transition">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
