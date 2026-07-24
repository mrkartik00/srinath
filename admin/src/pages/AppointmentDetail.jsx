import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAppointmentById, completeAppointment, cancelAppointment } from '../api/endpoints/appointments';
import { startCall, joinCall, endCall } from '../api/endpoints/video';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import VideoRoom from '../components/video/VideoRoom';

const statusVariant = { scheduled: 'scheduled', completed: 'completed', cancelled: 'cancelled', no_show: 'warning', in_progress: 'success' };

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apt, setApt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoSession, setVideoSession] = useState(null); // { token, roomId }
  const [videoLoading, setVideoLoading] = useState(false);

  const fetchAppointment = () => {
    getAppointmentById(id)
      .then((res) => setApt(res.data))
      .catch(() => navigate('/appointments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointment(); }, [id]);

  const handleComplete = async () => {
    try { await completeAppointment(id); toast.success('Completed'); fetchAppointment(); }
    catch (err) { toast.error(err.message); }
  };

  const handleCancel = async () => {
    const reason = prompt('Cancellation reason:');
    if (!reason) return;
    try { await cancelAppointment(id, reason); toast.success('Cancelled'); fetchAppointment(); }
    catch (err) { toast.error(err.message); }
  };

  const handleStartCall = async () => {
    setVideoLoading(true);
    try {
      const res = await startCall(id);
      const { token, roomId } = res.data;
      setVideoSession({ token, roomId });
      toast.success('Video call started');
    } catch (err) {
      toast.error(err.message || 'Failed to start video call');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleRejoinCall = async () => {
    setVideoLoading(true);
    try {
      const res = await joinCall(id);
      const { token, roomId } = res.data;
      setVideoSession({ token, roomId });
      toast.success('Rejoined video call');
    } catch (err) {
      toast.error(err.message || 'Failed to rejoin video call');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleCallEnd = async () => {
    try {
      await endCall(id);
      toast.success('Call ended');
    } catch (err) {
      // Call may already have ended on backend
      console.warn('End call error:', err.message);
    }
    setVideoSession(null);
    fetchAppointment();
  };

  if (loading) return <Spinner size="lg" />;
  if (!apt) return null;

  const patientName = apt.patientId?.userId?.name || 'Patient';
  const isVirtual = apt.type === 'virtual';
  const canStartCall = isVirtual && (apt.status === 'scheduled' || apt.status === 'in_progress');
  const isCallLive = apt.video?.status === 'live';

  return (
    <>
      {/* Video Room Overlay */}
      {videoSession && (
        <VideoRoom
          token={videoSession.token}
          roomId={videoSession.roomId}
          onCallEnd={handleCallEnd}
          onTokenExpired={handleRejoinCall}
        />
      )}

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

        {/* Video Call + Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Video Call Buttons */}
          {canStartCall && !videoSession && (
            <>
              {isCallLive ? (
                <button
                  onClick={handleRejoinCall}
                  disabled={videoLoading}
                  style={buttonStyles.rejoin}
                  aria-label="Rejoin Video Call"
                >
                  {videoLoading ? (
                    <span style={buttonStyles.spinner} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  )}
                  <span>{videoLoading ? 'Connecting...' : 'Rejoin Call'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStartCall}
                  disabled={videoLoading}
                  style={buttonStyles.start}
                  aria-label="Start Video Call"
                >
                  {videoLoading ? (
                    <span style={buttonStyles.spinner} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  )}
                  <span>{videoLoading ? 'Starting...' : 'Start Video Call'}</span>
                </button>
              )}
            </>
          )}

          {/* Existing action buttons */}
          {apt.status === 'scheduled' && (
            <>
              <Button onClick={handleComplete}>✓ Mark Completed</Button>
              <Button variant="danger" onClick={handleCancel}>Cancel Appointment</Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const buttonStyles = {
  start: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  rejoin: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
};
