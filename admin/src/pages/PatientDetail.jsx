import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatientById, getPatientAppointments } from '../api/endpoints/patients';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

const statusVariant = { scheduled: 'scheduled', completed: 'completed', cancelled: 'cancelled', no_show: 'warning' };

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPatientById(id).catch(() => null),
      getPatientAppointments(id, { limit: 10 }).catch(() => ({ data: [] })),
    ]).then(([patientRes, aptRes]) => {
      if (!patientRes) return navigate('/patients');
      setPatient(patientRes.data);
      setAppointments(aptRes.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner size="lg" />;
  if (!patient) return null;

  const p = patient;
  const addr = p.address || {};
  const name = p.userId?.name || 'Patient';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>← Back</Button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#255946]/10 to-[#255946]/5 border border-[#255946]/10 flex items-center justify-center text-sm font-semibold text-[#255946]">
            {initials}
          </div>
          <div>
            <h1 className="text-lg font-serif font-semibold text-[#1e293b]">{name}</h1>
            <p className="text-xs text-[#64748b]">{p.userId?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Info */}
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-[#1e293b]">Profile Information</h3></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Phone', value: p.userId?.phone },
              { label: 'Date of Birth', value: p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
              { label: 'Gender', value: p.gender },
              { label: 'Blood Group', value: p.bloodGroup },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-[#64748b]">{f.label}</span>
                <span className="text-[#1e293b] capitalize font-medium">{f.value || '—'}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-[#1e293b]">Contact Details</h3></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-1">Address</p>
              {addr.street ? (
                <p className="text-sm text-[#1e293b]">{addr.street}, {addr.city}, {addr.state} — {addr.zipCode}</p>
              ) : (
                <p className="text-sm text-[#94a3b8]">Not provided</p>
              )}
            </div>
            {p.emergencyContact?.name && (
              <div>
                <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-1">Emergency Contact</p>
                <p className="text-sm text-[#1e293b]">{p.emergencyContact.name} ({p.emergencyContact.relation})</p>
                <p className="text-xs text-[#64748b]">{p.emergencyContact.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical */}
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-[#1e293b]">Medical Information</h3></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2">Allergies</p>
              <div className="flex flex-wrap gap-2">
                {p.allergies?.length ? p.allergies.map((a, i) => <Badge key={i} variant="danger">{a}</Badge>) : <span className="text-sm text-[#94a3b8]">None recorded</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2">Medical History</p>
              {p.medicalHistory?.length ? (
                <ul className="space-y-2">
                  {p.medicalHistory.map((m, i) => (
                    <li key={i} className="text-sm"><span className="font-medium text-[#1e293b]">{m.condition}</span>{m.notes && <span className="text-[#64748b]"> — {m.notes}</span>}</li>
                  ))}
                </ul>
              ) : <span className="text-sm text-[#94a3b8]">No history</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment History */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1e293b]">Appointment History</h3>
          <Badge variant="info" dot>{appointments.length} records</Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {appointments.length === 0 ? (
            <p className="px-6 py-8 text-sm text-[#64748b] text-center">No appointments yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F6F0]/60">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DE]/50">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-[#F8F6F0]/40 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-[#1e293b]">
                      {new Date(apt.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-[#64748b]">{apt.doctorId?.name || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-[#64748b] capitalize">{apt.type?.replace('_', ' ') || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-[#64748b]">{apt.duration} min</td>
                    <td className="px-6 py-3.5"><Badge variant={statusVariant[apt.status] || 'default'} dot>{apt.status?.replace('_', ' ')}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
