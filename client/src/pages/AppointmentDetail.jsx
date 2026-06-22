import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cancelAppointment } from '../api/endpoints/appointment';
import api from '../api/axios';
import { Card, CardContent, Badge, Button, Spinner } from '../components/ui';

const statusVariant = { scheduled: 'scheduled', completed: 'completed', cancelled: 'cancelled', no_show: 'warning' };

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apt, setApt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/v1/appointments/${id}`)
      .then((res) => setApt(res.data))
      .catch(() => navigate('/appointments'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    try { await cancelAppointment(id, reason); toast.success('Cancelled'); navigate('/appointments'); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <Spinner size="lg" />;
  if (!apt) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => navigate('/appointments')}>← Back</Button>
        <h1 className="text-xl font-serif font-semibold text-[#1e293b]">Appointment Details</h1>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-[#1e293b]">
                {new Date(apt.dateTime).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-[#64748b] mt-1">
                {apt.doctorId?.name || 'Doctor'} • {apt.type?.replace('_', ' ')} • {apt.duration} min
              </p>
            </div>
            <Badge variant={statusVariant[apt.status]} dot>{apt.status?.replace('_', ' ')}</Badge>
          </div>

          {apt.notes && (
            <div className="pt-3 border-t border-[#E8E5DE]/50">
              <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Your Notes</p>
              <p className="text-sm text-[#1e293b]">{apt.notes}</p>
            </div>
          )}

          {apt.cancellationReason && (
            <div className="pt-3 border-t border-[#E8E5DE]/50">
              <p className="text-xs text-[#C62828] uppercase tracking-wider mb-1">Cancellation Reason</p>
              <p className="text-sm text-[#1e293b]">{apt.cancellationReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {apt.status === 'scheduled' && (
        <Button variant="danger" onClick={handleCancel}>Cancel Appointment</Button>
      )}
    </div>
  );
}
