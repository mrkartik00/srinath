import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookAppointment } from '../api/endpoints/appointment';
import { getDoctors } from '../api/endpoints/auth';
import api from '../api/axios';
import { Button, Input, Card, CardContent, Spinner } from '../components/ui';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [surgeonsLoading, setSurgeonsLoading] = useState(true);
  const [form, setForm] = useState({ doctorId: '', dateTime: '', duration: 30, type: '', notes: '' });

  useEffect(() => {
    Promise.all([
      getDoctors().then((res) => setDoctors(res.data || [])),
      api.get('/api/v1/config/constants').then((res) => {
        const types = res.data?.appointmentTypes || [];
        setAppointmentTypes(types);
        if (types.length) setForm((f) => ({ ...f, type: types[0].value }));
      }),
    ]).catch(() => toast.error('Could not load form data')).finally(() => setSurgeonsLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctorId) return toast.error('Please select a doctor');
    setLoading(true);
    try { await bookAppointment(form); toast.success('Appointment booked!'); navigate('/appointments'); }
    catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const selectClass = "w-full px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] text-sm transition-all duration-200 hover:border-[#36565F]/30 focus:outline-none focus:ring-2 focus:ring-[#36565F]/20 focus:border-[#36565F]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-serif font-semibold text-[#1e293b]">Book Appointment</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Schedule a consultation with your doctor</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Select Doctor</label>
              {surgeonsLoading ? <Spinner size="sm" /> : (
                <select name="doctorId" className={selectClass} value={form.doctorId} onChange={handleChange} required>
                  <option value="">Choose a doctor</option>
                  {doctors.map((s) => <option key={s._id} value={s._id}>{s.name} — {s.email}</option>)}
                </select>
              )}
            </div>
            <Input label="Date & Time" name="dateTime" type="datetime-local" value={form.dateTime} onChange={handleChange} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Type</label>
                <select name="type" className={selectClass} value={form.type} onChange={handleChange}>
                  {appointmentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Duration</label>
                <select name="duration" className={selectClass} value={form.duration} onChange={handleChange}>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Notes (optional)</label>
              <textarea name="notes" className="w-full px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] text-sm transition-all duration-200 hover:border-[#36565F]/30 focus:outline-none focus:ring-2 focus:ring-[#36565F]/20 focus:border-[#36565F] placeholder:text-[#94a3b8]" rows={3} value={form.notes} onChange={handleChange} placeholder="Any notes for the doctor..." />
            </div>
            <Button type="submit" size="lg" disabled={loading}>{loading ? 'Booking...' : 'Confirm Booking →'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
