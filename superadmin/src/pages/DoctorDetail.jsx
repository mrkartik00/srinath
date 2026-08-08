import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import ResetPasswordModal from '../components/ResetPasswordModal';

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/api/v1/superadmin/doctors/${id}`), api.get(`/api/v1/superadmin/doctors/${id}/activity`)])
      .then(([d, a]) => { setData(d.data); setActivity(a.data); })
      .catch(() => navigate('/doctors'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-[#64748b] text-center py-20">Loading...</div>;
  if (!data) return null;

  const { user, profile, stats } = data;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/doctors')} className="text-sm text-[#64748b] hover:text-[#1e293b] font-medium transition">← Back to Doctors</button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1e293b]">{user?.name}</h1>
          <p className="text-sm text-[#64748b]">{user?.email} • {profile?.specialization || 'No specialization'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#273d71] text-white hover:bg-[#1e2f58] transition"
          >
            Reset Password
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user?.isActive ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Patients', value: stats?.patientCount }, { label: 'Appointments', value: stats?.appointmentCount }, { label: 'Prescriptions', value: stats?.prescriptionCount }].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-[#1e293b]">{s.value ?? 0}</p>
            <p className="text-xs text-[#64748b] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Profile Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
          {[['Qualification', profile?.qualification], ['License', profile?.licenseNumber], ['Experience', profile?.experience ? `${profile.experience} yrs` : '—'], ['Fee', profile?.consultationFee ? `₹${profile.consultationFee}` : '—'], ['Phone', user?.phone], ['Joined', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—']].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1"><span className="text-[#64748b]">{k}</span><span className="text-[#1e293b] font-medium">{v || '—'}</span></div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Recent Activity</h3>
        {activity.length === 0 ? <p className="text-sm text-[#64748b] py-4 border-t border-gray-100">No activity recorded</p> : (
          <div className="space-y-3 max-h-60 overflow-y-auto border-t border-gray-100 pt-4">
            {activity.map((a) => (
              <div key={a._id} className="flex justify-between text-xs">
                <span className="text-[#1e293b] font-medium">{a.action}</span>
                <span className="text-[#94a3b8]">{new Date(a.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        user={user ? { _id: user._id, name: user.name, email: user.email } : null}
      />
    </div>
  );
}
