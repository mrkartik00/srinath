import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardContent, Badge, Button, Spinner } from '../components/ui';
import api from '../api/axios';

const statusVariant = { active: 'success', completed: 'default', cancelled: 'cancelled' };
const freqLabel = { once_daily: 'Once daily', twice_daily: 'Twice daily', thrice_daily: 'Thrice daily', custom: 'Custom' };

export default function PrescriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rx, setRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/api/v1/my/prescriptions')
      .then((res) => {
        const found = res.data.find((p) => p._id === id);
        if (found) setRx(found);
        else navigate('/prescriptions');
      })
      .catch(() => navigate('/prescriptions'))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/my/prescriptions/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { toast.error('PDF not available yet'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(false); }
  };

  if (loading) return <Spinner size="lg" />;
  if (!rx) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => navigate('/prescriptions')}>← Back</Button>
          <div>
            <h1 className="text-xl font-serif font-semibold text-[#1e293b]">{rx.diagnosis || 'Prescription'}</h1>
            <p className="text-xs text-[#64748b]">
              Dr. {(rx.doctorId?.name || 'Doctor').replace(/^Dr\.?\s*/i, '')} • Issued {new Date(rx.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[rx.status]} dot>{rx.status}</Badge>
          <Button size="sm" onClick={downloadPdf} disabled={downloading}>
            {downloading ? 'Downloading...' : '📄 Download PDF'}
          </Button>
        </div>
      </div>

      {/* Medicines */}
      <Card>
        <CardContent>
          <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Medicines ({rx.medicines.length})</h3>
          <div className="space-y-3">
            {rx.medicines.map((med, i) => (
              <div key={i} className="p-4 bg-[#F8F6F0]/60 rounded-xl border border-[#E8E5DE]/40">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1e293b]">{med.name}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{med.dosage} • {freqLabel[med.frequency] || med.frequency}</p>
                  </div>
                  <Badge variant="info">{med.duration} days</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#64748b]">
                  <span>⏰ {med.timings?.join(', ')}</span>
                  <span>📅 {new Date(med.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(med.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                {med.instructions && <p className="mt-2 text-xs text-[#64748b] italic">💡 {med.instructions}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {rx.notes && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-[#1e293b] mb-2">Doctor's Notes</h3>
            <p className="text-sm text-[#64748b]">{rx.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
