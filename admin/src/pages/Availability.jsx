import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Availability() {
  const [slots, setSlots] = useState(DAYS.map((_, i) => ({ day: i, enabled: false, startTime: '09:00', endTime: '17:00' })));
  const [maxPatients, setMaxPatients] = useState(20);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/doctor/profile').then(({ data }) => {
      const { profile } = data;
      setMaxPatients(profile.maxPatientsPerDay || 20);
      if (profile.availableSlots?.length) {
        setSlots(DAYS.map((_, i) => {
          const s = profile.availableSlots.find(sl => sl.day === i);
          return s ? { day: i, enabled: true, startTime: s.startTime, endTime: s.endTime } : { day: i, enabled: false, startTime: '09:00', endTime: '17:00' };
        }));
      }
    }).catch(() => toast.error('Failed to load availability'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/v1/doctor/profile', { availableSlots: slots.filter(s => s.enabled).map(({ day, startTime, endTime }) => ({ day, startTime, endTime })), maxPatientsPerDay: maxPatients });
      toast.success('Availability updated');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-[#255946] border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1e293b]">Availability Settings</h1>

      <section className="bg-white border border-[#E8E5DE] rounded-[10px] p-6 space-y-3">
        <h2 className="text-lg font-semibold text-[#255946]">Weekly Schedule</h2>
        {slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 w-28">
              <input type="checkbox" checked={slot.enabled} onChange={() => { const s = [...slots]; s[i] = { ...s[i], enabled: !s[i].enabled }; setSlots(s); }} className="accent-[#255946]" />
              <span className="text-sm font-medium text-[#1e293b]">{DAYS[i].slice(0, 3)}</span>
            </label>
            <input type="time" value={slot.startTime} disabled={!slot.enabled} onChange={e => { const s = [...slots]; s[i] = { ...s[i], startTime: e.target.value }; setSlots(s); }} className="px-3 py-2 border border-[#E8E5DE] rounded-lg disabled:opacity-40" />
            <span className="text-sm text-gray-500">to</span>
            <input type="time" value={slot.endTime} disabled={!slot.enabled} onChange={e => { const s = [...slots]; s[i] = { ...s[i], endTime: e.target.value }; setSlots(s); }} className="px-3 py-2 border border-[#E8E5DE] rounded-lg disabled:opacity-40" />
          </div>
        ))}
      </section>

      <section className="bg-white border border-[#E8E5DE] rounded-[10px] p-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-[#1e293b]">Max Patients/Day</label>
          <input type="range" min={1} max={50} value={maxPatients} onChange={e => setMaxPatients(+e.target.value)} className="accent-[#255946]" />
          <span className="text-sm font-semibold w-8">{maxPatients}</span>
        </div>
      </section>

      <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-[#255946] text-white rounded-[10px] font-medium hover:bg-[#1e4a3a] disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Availability'}
      </button>
    </div>
  );
}
