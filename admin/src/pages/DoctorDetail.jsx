import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDoctorById, deactivateDoctor } from '../api/endpoints/doctors';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoctorById(id)
      .then((res) => setData(res.data))
      .catch(() => navigate('/doctors'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeactivate = async () => {
    if (!window.confirm('Deactivate this doctor? They will lose access.')) return;
    try { await deactivateDoctor(id); toast.success('Doctor deactivated'); navigate('/doctors'); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <Spinner size="lg" />;
  if (!data) return null;

  const { user, profile } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/doctors')}>← Back</Button>
        <div>
          <h1 className="text-lg font-serif font-semibold text-[#1e293b]">{user?.name}</h1>
          <p className="text-xs text-[#64748b]">{user?.email}</p>
        </div>
        <Badge variant={user?.isActive ? 'success' : 'error'} dot>{user?.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Account Info</h3></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Name', value: user?.name },
              { label: 'Email', value: user?.email },
              { label: 'Phone', value: user?.phone || '—' },
              { label: 'Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'Never' },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-[#64748b]">{f.label}</span>
                <span className="text-[#1e293b] font-medium">{f.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Professional Profile</h3></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Specialization', value: profile?.specialization || '—' },
              { label: 'Qualification', value: profile?.qualification || '—' },
              { label: 'License Number', value: profile?.licenseNumber || '—' },
              { label: 'Experience', value: profile?.experience ? `${profile.experience} years` : '—' },
              { label: 'Consultation Fee', value: profile?.consultationFee ? `₹${profile.consultationFee}` : '—' },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-[#64748b]">{f.label}</span>
                <span className="text-[#1e293b] font-medium">{f.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {profile?.availableSlots?.length > 0 && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Available Slots</h3></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.availableSlots.map((slot, i) => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return (
                  <Badge key={i} variant="info">{days[slot.day]} {slot.startTime}–{slot.endTime}</Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {user?.isActive && (
        <Button variant="danger" onClick={handleDeactivate}>Deactivate Doctor</Button>
      )}
    </div>
  );
}
