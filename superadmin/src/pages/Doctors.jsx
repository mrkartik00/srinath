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
        <h1 className="text-xl font-bold text-white">Doctors</h1>
        {tab === 'active' && <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#5558e6]">{showForm ? 'Cancel' : '+ Add Doctor'}</button>}
      </div>

      <div className="flex gap-1 bg-[#1e293b] rounded-lg p-1 border border-white/10 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-md text-xs font-medium transition ${tab === t.key ? 'bg-[#6366f1] text-white' : 'text-white/50 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {showForm && tab === 'active' && (
        <form onSubmit={handleSubmit} className="bg-[#1e293b] rounded-xl p-6 grid grid-cols-2 gap-4 border border-white/10">
          {['name', 'email', 'password', 'phone', 'specialization', 'qualification', 'licenseNumber', 'experience', 'consultationFee'].map((f) => (
            <input key={f} placeholder={f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} type={f === 'password' ? 'password' : ['experience', 'consultationFee'].includes(f) ? 'number' : 'text'} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required={['name', 'email', 'password'].includes(f)} className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" />
          ))}
          <button type="submit" className="col-span-2 py-2.5 bg-[#6366f1] text-white rounded-lg text-sm font-medium">Add Doctor</button>
        </form>
      )}

      {loading && <div className="text-white/50 text-center py-10">Loading...</div>}

      {!loading && tab === 'active' && (
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
          {doctors.length === 0 && <p className="px-6 py-10 text-center text-white/40 text-sm">No active doctors</p>}
        </div>
      )}

      {!loading && (tab === 'pending' || tab === 'rejected') && (
        <div className="space-y-3">
          {registrations.map((doc) => (
            <div key={doc._id} className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{doc.name}</p>
                  <p className="text-xs text-white/40">{doc.email} • {doc.phone}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${doc.approvalStatus === 'pending_approval' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                  {doc.approvalStatus === 'pending_approval' ? 'Pending' : 'Rejected'}
                </span>
              </div>
              {doc.profile && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div><span className="text-white/40">Specialization:</span> <span className="text-white/80 ml-1">{doc.profile.specialization}</span></div>
                  <div><span className="text-white/40">Qualification:</span> <span className="text-white/80 ml-1">{doc.profile.qualification}</span></div>
                  <div><span className="text-white/40">License:</span> <span className="text-white/80 ml-1">{doc.profile.licenseNumber}</span></div>
                  <div><span className="text-white/40">Experience:</span> <span className="text-white/80 ml-1">{doc.profile.experience} yrs</span></div>
                  {doc.profile.clinicName && <div><span className="text-white/40">Clinic:</span> <span className="text-white/80 ml-1">{doc.profile.clinicName}</span></div>}
                  {doc.profile.aboutMe && <div className="col-span-2"><span className="text-white/40">About:</span> <span className="text-white/80 ml-1">{doc.profile.aboutMe}</span></div>}
                </div>
              )}
              {tab === 'pending' && (
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => handleApprove(doc._id)} className="px-4 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30">Approve</button>
                  <button onClick={() => setRejectModal(doc._id)} className="px-4 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30">Reject</button>
                </div>
              )}
              {tab === 'rejected' && doc.profile?.rejectionReason && (
                <p className="mt-3 text-xs text-red-400/80">Reason: {doc.profile.rejectionReason}</p>
              )}
            </div>
          ))}
          {registrations.length === 0 && <p className="text-center text-white/40 text-sm py-10">{tab === 'pending' ? 'No pending registrations' : 'No rejected registrations'}</p>}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-xl border border-white/10 p-6 w-full max-w-md">
            <h3 className="text-sm font-semibold text-white mb-4">Reject Doctor</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1] mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 text-xs text-white/50 hover:text-white">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
