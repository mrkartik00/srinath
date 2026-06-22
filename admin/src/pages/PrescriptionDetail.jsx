import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPrescriptionById, cancelPrescription, getPrescriptionAdherence } from '../api/endpoints/prescriptions';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';

const statusVariant = { active: 'success', completed: 'default', cancelled: 'error' };
const freqLabel = { once_daily: 'Once daily', twice_daily: 'Twice daily', thrice_daily: 'Thrice daily', custom: 'Custom' };

export default function PrescriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rx, setRx] = useState(null);
  const [adherence, setAdherence] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPrescriptionById(id),
      getPrescriptionAdherence(id).catch(() => ({ data: [] })),
    ]).then(([rxRes, adhRes]) => {
      setRx(rxRes.data);
      setAdherence(adhRes.data || []);
    }).catch(() => navigate('/prescriptions'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this prescription? All pending reminders will be stopped.')) return;
    try { await cancelPrescription(id); toast.success('Cancelled'); navigate('/prescriptions'); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <Spinner size="lg" />;
  if (!rx) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/prescriptions')}>← Back</Button>
          <div>
            <h1 className="text-lg font-serif font-semibold text-[#1e293b]">Prescription Details</h1>
            <p className="text-xs text-[#64748b]">Issued {new Date(rx.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <Badge variant={statusVariant[rx.status]} dot>{rx.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Overview</h3></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-[#64748b]">Patient</span><span className="font-medium text-[#1e293b]">{rx.patientId?.userId?.name || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#64748b]">Doctor</span><span className="font-medium text-[#1e293b]">{rx.doctorId?.name || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#64748b]">Diagnosis</span><span className="font-medium text-[#1e293b]">{rx.diagnosis || '—'}</span></div>
            {rx.notes && <div className="flex justify-between text-sm"><span className="text-[#64748b]">Notes</span><span className="text-[#1e293b] text-right max-w-[60%]">{rx.notes}</span></div>}
          </CardContent>
        </Card>

        {adherence.length > 0 && (
          <Card>
            <CardHeader><h3 className="text-sm font-semibold">Adherence (Last 7 Days)</h3></CardHeader>
            <CardContent className="space-y-2">
              {adherence.slice(0, 7).map((a) => (
                <div key={a._id} className="flex items-center justify-between text-sm">
                  <span className="text-[#64748b]">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#E8E5DE] rounded-full overflow-hidden">
                      <div className="h-full bg-[#255946] rounded-full" style={{ width: `${a.adherencePercent}%` }} />
                    </div>
                    <span className="text-xs font-medium text-[#1e293b] w-10 text-right">{a.adherencePercent}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Medicines */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold">Medicines ({rx.medicines.length})</h3></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#E8E5DE]/50">
            {rx.medicines.map((med, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1e293b]">{med.name} — {med.dosage}</p>
                    <p className="text-xs text-[#64748b]">
                      {freqLabel[med.frequency]} • {med.duration} days • Timings: {med.timings?.join(', ')}
                    </p>
                    {med.instructions && <p className="text-xs text-[#64748b] mt-0.5">Instructions: {med.instructions}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#64748b]">{new Date(med.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(med.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {rx.status === 'active' && user?.role === 'doctor' && (
        <Button variant="danger" onClick={handleCancel}>Cancel Prescription</Button>
      )}
    </div>
  );
}
