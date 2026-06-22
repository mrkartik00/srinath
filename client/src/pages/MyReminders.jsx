import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, Badge, Button, Spinner } from '../components/ui';
import api from '../api/axios';

const statusVariant = { pending: 'pending', sent: 'pending', acknowledged: 'success', missed: 'cancelled', snoozed: 'warning' };

export default function MyReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = () => {
    setLoading(true);
    api.get('/api/v1/my/reminders')
      .then((res) => setReminders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReminders(); }, []);

  const handleAction = async (id, action, body) => {
    try {
      await api.patch(`/api/v1/my/reminders/${id}/${action}`, body);
      toast.success(action === 'ack' ? 'Marked as taken!' : action === 'snooze' ? 'Snoozed 15 min' : 'Marked as missed');
      fetchReminders();
    } catch { toast.error('Action failed'); }
  };

  if (loading) return <Spinner size="lg" />;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-serif font-semibold text-[#1e293b]">Today's Reminders</h1>
        <p className="text-sm text-[#64748b] mt-0.5">{today}</p>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E5DE]/50 shadow-[0_1px_3px_rgba(37,89,70,0.04)]">
          <div className="text-4xl mb-3">💊</div>
          <p className="text-[#64748b] text-sm">No reminders for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <Card key={r._id} hover>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border ${r.status === 'acknowledged' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#2E7D32]' : r.status === 'missed' ? 'bg-[#FEF2F2] border-[#FECACA] text-[#C62828]' : 'bg-gradient-to-br from-[#255946]/10 to-[#255946]/5 border-[#255946]/10'}`}>
                    {r.status === 'acknowledged' ? '✓' : r.status === 'missed' ? '✕' : '💊'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1e293b]">{r.medicineName}</p>
                    <p className="text-xs text-[#64748b]">
                      {r.dosage} • {new Date(r.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(r.status === 'pending' || r.status === 'sent') && (
                    <>
                      <Button size="sm" onClick={() => handleAction(r._id, 'ack')}>Taken ✓</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleAction(r._id, 'snooze', { minutes: 15 })}>Snooze</Button>
                      <Button size="sm" variant="danger" onClick={() => handleAction(r._id, 'miss')}>Missed</Button>
                    </>
                  )}
                  {r.status === 'snoozed' && <Badge variant="warning" dot>Snoozed</Badge>}
                  {r.status === 'acknowledged' && <Badge variant="success" dot>Taken</Badge>}
                  {r.status === 'missed' && <Badge variant="cancelled" dot>Missed</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
