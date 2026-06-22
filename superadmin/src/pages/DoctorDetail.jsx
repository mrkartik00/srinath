import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/api/v1/superadmin/doctors/${id}`), api.get(`/api/v1/superadmin/doctors/${id}/activity`)])
      .then(([d, a]) => { setData(d.data); setActivity(a.data); })
      .catch(() => navigate('/doctors'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-white/50 text-center py-20">Loading...</div>;
  if (!data) return null;

  const { user, profile, stats } = data;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/doctors')} className="text-sm text-white/40 hover:text-white">← Back</button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{user?.name}</h1>
          <p className="text-sm text-white/40">{user?.email} • {profile?.specialization || 'No specialization'}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs ${user?.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{user?.isActive ? 'Active' : 'Inactive'}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Patients', value: stats?.patientCount }, { label: 'Appointments', value: stats?.appointmentCount }, { label: 'Prescriptions', value: stats?.prescriptionCount }].map((s) => (
          <div key={s.label} className="bg-[#1e293b] rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-white">{s.value ?? 0}</p>
            <p className="text-xs text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Profile</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['Qualification', profile?.qualification], ['License', profile?.licenseNumber], ['Experience', profile?.experience ? `${profile.experience} yrs` : '—'], ['Fee', profile?.consultationFee ? `₹${profile.consultationFee}` : '—'], ['Phone', user?.phone], ['Joined', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—']].map(([k, v]) => (
            <div key={k} className="flex justify-between"><span className="text-white/40">{k}</span><span className="text-white">{v || '—'}</span></div>
          ))}
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Recent Activity</h3>
        {activity.length === 0 ? <p className="text-sm text-white/40">No activity recorded</p> : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {activity.map((a) => (
              <div key={a._id} className="flex justify-between text-xs">
                <span className="text-white/60">{a.action}</span>
                <span className="text-white/30">{new Date(a.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
