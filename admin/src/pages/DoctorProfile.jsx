import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorProfile() {
  const [form, setForm] = useState(null);
  const [slots, setSlots] = useState(DAYS.map((_, i) => ({ day: i, enabled: false, startTime: '09:00', endTime: '17:00' })));
  const [maxPatients, setMaxPatients] = useState(20);
  const [isOnline, setIsOnline] = useState(false);
  const [saving, setSaving] = useState(false);

  const [avatar, setAvatar] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    api.get('/api/v1/doctor/profile').then(({ data }) => {
      const { user, profile } = data;
      setAvatar(user.avatar || null);
      setForm({ name: user.name, specialization: profile.specialization || '', qualification: profile.qualification || '', licenseNumber: profile.licenseNumber || '', experience: profile.experience || '', consultationFee: profile.consultationFee || '', clinicName: profile.clinicName || '', clinicAddress: profile.clinicAddress || '', aboutMe: profile.aboutMe || '' });
      setMaxPatients(profile.maxPatientsPerDay || 20);
      setIsOnline(profile.isOnline || false);
      if (profile.availableSlots?.length) {
        setSlots(DAYS.map((_, i) => {
          const s = profile.availableSlots.find(sl => sl.day === i);
          return s ? { day: i, enabled: true, startTime: s.startTime, endTime: s.endTime } : { day: i, enabled: false, startTime: '09:00', endTime: '17:00' };
        }));
      }
    }).catch(() => toast.error('Failed to load profile'));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/v1/doctor/profile', { ...form, availableSlots: slots.filter(s => s.enabled).map(({ day, startTime, endTime }) => ({ day, startTime, endTime })), maxPatientsPerDay: maxPatients, isOnline });
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (!form) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-[#255946] border-t-transparent rounded-full" /></div>;

  const Input = ({ label, field, type = 'text' }) => (
    <div>
      <label className="block text-sm font-medium text-[#1e293b] mb-1">{label}</label>
      <input type={type} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className="w-full px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] outline-none focus:border-[#255946]" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1e293b]">Doctor Profile</h1>

      {/* Avatar */}
      <section className="bg-white border border-[#E8E5DE] rounded-[10px] p-6 flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d4e8ec] to-[#b8d8df] border-3 border-white shadow-md overflow-hidden flex items-center justify-center text-2xl font-bold text-[#255946]">
            {avatar ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" /> : (form.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR')}
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#255946] border-2 border-white flex items-center justify-center cursor-pointer shadow-md hover:bg-[#1a3f32] transition-colors">
            {avatarUploading ? (
              <svg className="animate-spin w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/></svg>
            ) : (
              <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
            )}
            <input type="file" accept="image/*" className="hidden" disabled={avatarUploading} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
              setAvatarUploading(true);
              const formData = new FormData();
              formData.append('avatar', file);
              try {
                const baseUrl = import.meta.env.VITE_API_URL || '';
                const token = localStorage.getItem('token');
                const res = await fetch(`${baseUrl}/api/v1/auth/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
                const data = await res.json();
                if (data.success) { setAvatar(data.data.avatar); toast.success('Profile picture updated!'); }
                else toast.error(data.message || 'Upload failed');
              } catch { toast.error('Failed to upload'); }
              finally { setAvatarUploading(false); e.target.value = ''; }
            }} />
          </label>
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1e293b]">{form.name}</h3>
          <p className="text-sm text-[#64748b]">{form.specialization || 'Doctor'}</p>
          <p className="text-xs text-[#94a3b8] mt-1">Click the + button to update your profile picture</p>
        </div>
      </section>

      {/* Profile Info */}
      <section className="bg-white border border-[#E8E5DE] rounded-[10px] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#255946]">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" field="name" />
          <Input label="Specialization" field="specialization" />
          <Input label="Qualification" field="qualification" />
          <Input label="License Number" field="licenseNumber" />
          <Input label="Experience (years)" field="experience" type="number" />
          <Input label="Consultation Fee (₹)" field="consultationFee" type="number" />
          <Input label="Clinic Name" field="clinicName" />
          <Input label="Clinic Address" field="clinicAddress" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-1">About Me</label>
          <textarea value={form.aboutMe} onChange={e => setForm({ ...form, aboutMe: e.target.value })} rows={3} className="w-full px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] outline-none focus:border-[#255946] resize-none" />
        </div>
      </section>

      {/* Availability */}
      <section className="bg-white border border-[#E8E5DE] rounded-[10px] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#255946]">Weekly Availability</h2>
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 w-28">
                <input type="checkbox" checked={slot.enabled} onChange={() => { const s = [...slots]; s[i] = { ...s[i], enabled: !s[i].enabled }; setSlots(s); }} className="accent-[#255946]" />
                <span className="text-sm font-medium text-[#1e293b]">{DAYS[i].slice(0, 3)}</span>
              </label>
              <input type="time" value={slot.startTime} disabled={!slot.enabled} onChange={e => { const s = [...slots]; s[i] = { ...s[i], startTime: e.target.value }; setSlots(s); }} className="px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] disabled:opacity-40" />
              <span className="text-sm text-gray-500">to</span>
              <input type="time" value={slot.endTime} disabled={!slot.enabled} onChange={e => { const s = [...slots]; s[i] = { ...s[i], endTime: e.target.value }; setSlots(s); }} className="px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] disabled:opacity-40" />
            </div>
          ))}
        </div>
      </section>

      {/* Settings */}
      <section className="bg-white border border-[#E8E5DE] rounded-[10px] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#255946]">Settings</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-[#1e293b]">Max Patients/Day</label>
          <input type="range" min={1} max={50} value={maxPatients} onChange={e => setMaxPatients(+e.target.value)} className="accent-[#255946]" />
          <span className="text-sm font-semibold w-8">{maxPatients}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[#1e293b]">Online Status</label>
          <button onClick={() => setIsOnline(!isOnline)} className={`w-12 h-6 rounded-full transition-colors ${isOnline ? 'bg-[#255946]' : 'bg-gray-300'} relative`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isOnline ? 'left-7' : 'left-1'}`} />
          </button>
          <span className="text-sm text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </section>

      <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-[#255946] text-white rounded-[10px] font-medium hover:bg-[#1e4a3a] disabled:opacity-50 transition-colors">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
