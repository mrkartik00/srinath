import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Spinner } from '../components/ui';
import api from '../api/axios';

const statusVariant = { active: 'success', completed: 'default', cancelled: 'cancelled' };
const freqLabel = { once_daily: 'Once daily', twice_daily: 'Twice daily', thrice_daily: 'Thrice daily', custom: 'Custom' };

export default function MyPrescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/api/v1/my/prescriptions')
      .then((res) => setPrescriptions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-serif font-semibold text-[#1e293b]">My Prescriptions</h1>
        <p className="text-sm text-[#64748b] mt-0.5">{prescriptions.length} prescription(s)</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E5DE]/50 shadow-[0_1px_3px_rgba(37,89,70,0.04)]">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-[#64748b] text-sm">No prescriptions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <Card key={rx._id} hover>
              <CardContent>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpanded(expanded === rx._id ? null : rx._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#36565F]/10 to-[#36565F]/5 border border-[#36565F]/10 flex items-center justify-center text-sm">💊</div>
                    <div>
                      <p className="text-sm font-medium text-[#1e293b]">{rx.diagnosis || 'Prescription'}</p>
                      <p className="text-xs text-[#64748b]">
                        Dr. {(rx.doctorId?.name || 'Doctor').replace(/^Dr\.?\s*/i, '')} • {new Date(rx.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {rx.medicines.length} medicine(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[rx.status]} dot>{rx.status}</Badge>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/prescriptions/${rx._id}`); }} className="text-xs text-[#36565F] font-medium hover:text-[#253F47]">View →</button>
                    <span className="text-xs text-[#64748b]">{expanded === rx._id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === rx._id && (
                  <div className="mt-4 pt-4 border-t border-[#E8E5DE]/50 space-y-2">
                    {rx.medicines.map((med, i) => (
                      <div key={i} className="p-3 bg-[#F8F6F0]/60 rounded-lg border border-[#E8E5DE]/40">
                        <p className="text-sm font-medium text-[#1e293b]">{med.name} — {med.dosage}</p>
                        <p className="text-xs text-[#64748b]">
                          {freqLabel[med.frequency] || med.frequency} • {med.duration} days{med.instructions ? ` • ${med.instructions}` : ''}
                        </p>
                      </div>
                    ))}
                    {rx.notes && <p className="text-xs text-[#64748b] italic mt-2">Note: {rx.notes}</p>}
                    <button onClick={(e) => { e.stopPropagation(); const token = localStorage.getItem('token'); fetch(`/api/v1/my/prescriptions/${rx._id}/pdf`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.blob() : Promise.reject()).then(b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `prescription-${rx._id}.pdf`; a.click(); URL.revokeObjectURL(u); }).catch(() => alert('PDF not available yet')); }} className="mt-3 text-xs px-3 py-1.5 bg-[#36565F] text-white rounded-lg hover:bg-[#253F47]">📄 Download PDF</button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
