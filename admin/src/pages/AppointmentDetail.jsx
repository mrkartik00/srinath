import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAppointmentById, completeAppointment, cancelAppointment } from '../api/endpoints/appointments';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

const statusVariant = { scheduled: 'scheduled', completed: 'completed', cancelled: 'cancelled', no_show: 'warning' };

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apt, setApt] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    getAppointmentById(id)
      .then((res) => setApt(res.data))
      .catch(() => navigate('/appointments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [id]);

  const handleComplete = async () => {
    try { await completeAppointment(id); toast.success('Completed'); fetch(); }
    catch (err) { toast.error(err.message); }
  };

  const handleCancel = async () => {
    const reason = prompt('Cancellation reason:');
    if (!reason) return;
    try { await cancelAppointment(id, reason); toast.success('Cancelled'); fetch(); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <Spinner size="lg" />;
  if (!apt) return null;

  const patientName = apt.patientId?.userId?.name || 'Patient';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>← Back</Button>
        <h1 className="text-lg font-serif font-semibold text-[#1e293b]">Appointment Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Appointment Info</h3></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Date & Time', value: new Date(apt.dateTime).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
              { label: 'Duration', value: `${apt.duration} minutes` },
              { label: 'Type', value: apt.type?.replace('_', ' ') },
              { label: 'Status', value: apt.status?.replace('_', ' ') },
              { label: 'Notes', value: apt.notes || '—' },
              { label: 'Cancellation Reason', value: apt.cancellationReason || '—' },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-[#64748b]">{f.label}</span>
                <span className="text-[#1e293b] font-medium capitalize text-right max-w-[60%]">{f.value}</span>
              </div>
            ))}
            <div className="pt-2">
              <Badge variant={statusVariant[apt.status]} dot>{apt.status?.replace('_', ' ')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Patient & Doctor</h3></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Patient</p>
              <p className="text-sm font-medium text-[#1e293b]">{patientName}</p>
              <p className="text-xs text-[#64748b]">{apt.patientId?.userId?.email}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Doctor</p>
              <p className="text-sm font-medium text-[#1e293b]">{apt.doctorId?.name || '—'}</p>
              <p className="text-xs text-[#64748b]">{apt.doctorId?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {apt.status === 'scheduled' && (
        <div className="flex gap-3">
          <Button onClick={handleComplete}>✓ Mark Completed</Button>
          <Button variant="danger" onClick={handleCancel}>Cancel Appointment</Button>
        </div>
      )}
    </div>
  );
}
