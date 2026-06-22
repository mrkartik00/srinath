import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPrescriptions, createPrescription, cancelPrescription } from '../api/endpoints/prescriptions';
import { getPatients } from '../api/endpoints/patients';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';

export default function Prescriptions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ patientId: '', diagnosis: '', notes: '', medicines: [{ name: '', dosage: '', frequency: 'once_daily', timings: ['08:00'], duration: 7, instructions: '', startDate: new Date().toISOString().split('T')[0] }] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rxRes, patRes] = await Promise.all([getPrescriptions(), getPatients()]);
      setPrescriptions(rxRes.data);
      setPatients(patRes.data);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addMedicine = () => setForm({ ...form, medicines: [...form.medicines, { name: '', dosage: '', frequency: 'once_daily', timings: ['08:00'], duration: 7, instructions: '', startDate: new Date().toISOString().split('T')[0] }] });
  const removeMedicine = (i) => setForm({ ...form, medicines: form.medicines.filter((_, idx) => idx !== i) });
  const updateMedicine = (i, field, value) => {
    const meds = [...form.medicines];
    meds[i] = { ...meds[i], [field]: value };
    setForm({ ...form, medicines: meds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Select a patient');
    if (!form.medicines[0]?.name) return toast.error('Add at least one medicine');
    setSubmitting(true);
    try {
      await createPrescription(form);
      toast.success('Prescription created + reminders scheduled');
      setShowForm(false);
      setForm({ patientId: '', diagnosis: '', notes: '', medicines: [{ name: '', dosage: '', frequency: 'once_daily', timings: ['08:00'], duration: 7, instructions: '', startDate: new Date().toISOString().split('T')[0] }] });
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed'); }
    setSubmitting(false);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this prescription? All pending reminders will be stopped.')) return;
    try { await cancelPrescription(id); toast.success('Cancelled'); fetchData(); } catch (err) { toast.error(err.message); }
  };

  if (loading) return <Spinner size="lg" />;
  const isDoctor = user?.role === 'doctor';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#1e293b]">Prescriptions</h1>
          <p className="text-sm text-[#64748b]">Digital prescriptions with automated reminders</p>
        </div>
        {isDoctor && <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Prescription'}</Button>}
      </div>

      {showForm && (
        <Card>
          <CardHeader><h3 className="text-base font-semibold">Create Prescription</h3></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Patient *</label>
                  <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className="w-full px-3 py-2 border border-[#E8E5DE] rounded-lg text-sm" required>
                    <option value="">Select patient</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.userId?.name || 'Unknown'}</option>)}
                  </select>
                </div>
                <Input label="Diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Medicines</h4>
                  <button type="button" onClick={addMedicine} className="text-xs text-[#255946] font-medium">+ Add Medicine</button>
                </div>
                {form.medicines.map((med, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 p-3 bg-[#F8F6F0] rounded-lg relative">
                    {form.medicines.length > 1 && <button type="button" onClick={() => removeMedicine(i)} className="absolute top-1 right-2 text-red-400 text-xs">✕</button>}
                    <Input label="Medicine *" value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} required />
                    <Input label="Dosage *" value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} placeholder="500mg" required />
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Frequency *</label>
                      <select value={med.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} className="w-full px-3 py-2 border border-[#E8E5DE] rounded-lg text-sm">
                        <option value="once_daily">Once Daily</option>
                        <option value="twice_daily">Twice Daily</option>
                        <option value="thrice_daily">Thrice Daily</option>
                      </select>
                    </div>
                    <Input label="Duration (days) *" type="number" value={med.duration} onChange={(e) => updateMedicine(i, 'duration', Number(e.target.value))} required />
                    <Input label="Timing" value={med.timings.join(',')} onChange={(e) => updateMedicine(i, 'timings', e.target.value.split(','))} placeholder="08:00,20:00" />
                    <Input label="Start Date *" type="date" value={med.startDate} onChange={(e) => updateMedicine(i, 'startDate', e.target.value)} required />
                    <Input label="Instructions" value={med.instructions} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)} placeholder="After food" />
                  </div>
                ))}
              </div>

              <Input label="Doctor Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Prescription'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {prescriptions.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#64748b]">No prescriptions yet</div>
          ) : (
            <div className="divide-y divide-[#E8E5DE]/50">
              {prescriptions.map((rx) => (
                <div key={rx._id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F8F6F0]/50 cursor-pointer" onClick={() => navigate(`/prescriptions/${rx._id}`)}>
                  <div>
                    <p className="text-sm font-medium text-[#1e293b]">
                      {rx.patientId?.userId?.name || 'Patient'} — {rx.diagnosis || 'No diagnosis'}
                    </p>
                    <p className="text-xs text-[#64748b]">
                      {rx.medicines.length} medicine(s) • {new Date(rx.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={rx.status === 'active' ? 'success' : rx.status === 'cancelled' ? 'error' : 'default'}>{rx.status}</Badge>
                    {rx.status === 'active' && isDoctor && (
                      <button onClick={(e) => { e.stopPropagation(); handleCancel(rx._id); }} className="text-xs text-red-500 hover:text-red-700">Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
