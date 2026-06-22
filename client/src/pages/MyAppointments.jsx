import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyAppointments, cancelAppointment } from '../api/endpoints/appointment';
import { Card, CardContent, Badge, Button, Spinner } from '../components/ui';

const statusVariant = { scheduled: 'scheduled', completed: 'completed', cancelled: 'cancelled', no_show: 'warning' };

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments({ limit: 50 });
      setAppointments(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    try {
      await cancelAppointment(id, reason);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-semibold text-[#1e293b]">My Appointments</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{appointments.length} total appointments</p>
        </div>
        <Link to="/book-appointment"><Button size="sm">Book New →</Button></Link>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E5DE]/50 shadow-[0_1px_3px_rgba(37,89,70,0.04)]">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[#64748b] mb-4">No appointments yet</p>
          <Link to="/book-appointment"><Button>Book Your First Appointment</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt._id} hover>
              <CardContent className="flex items-center justify-between cursor-pointer" onClick={() => navigate(`/appointments/${apt._id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#255946]/10 to-[#255946]/5 border border-[#255946]/10 flex items-center justify-center">
                    <span className="text-sm">📅</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1e293b]">
                      {new Date(apt.dateTime).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-[#64748b] mt-0.5 capitalize">
                      {apt.doctorId?.name || 'Doctor'} • {apt.type?.replace('_', ' ')} • {apt.duration} min
                    </p>
                    {apt.cancellationReason && (
                      <p className="text-xs text-[#C62828] mt-1">Reason: {apt.cancellationReason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant[apt.status]} dot>{apt.status?.replace('_', ' ')}</Badge>
                  {apt.status === 'scheduled' && (
                    <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleCancel(apt._id); }}>Cancel</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
