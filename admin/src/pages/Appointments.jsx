import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAppointments, cancelAppointment, completeAppointment } from '../api/endpoints/appointments';
import api from '../api/axios';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

const statusVariant = { scheduled: 'scheduled', completed: 'completed', cancelled: 'cancelled', no_show: 'warning' };

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    api.get('/api/v1/config/constants').then((res) => setStatuses(res.data?.appointmentStatuses || [])).catch(() => {});
  }, []);

  const fetchAppointments = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await getAppointments(params);
      setAppointments(res.data);
      setMeta(res.meta);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleFilter = (e) => { e.preventDefault(); fetchAppointments(1); };

  const handleComplete = async (id) => {
    setActionLoading(id);
    try { await completeAppointment(id); toast.success('Marked as completed'); fetchAppointments(meta.page); }
    catch (err) { toast.error(err.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    setActionLoading(id);
    try { await cancelAppointment(id, reason); toast.success('Cancelled'); fetchAppointments(meta.page); }
    catch (err) { toast.error(err.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-semibold text-[#1e293b]">Appointments</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Manage and track all patient appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" dot>{meta.total} total</Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E8E5DE]/60 p-4 shadow-[0_1px_3px_rgba(37,89,70,0.04)]">
        <form onSubmit={handleFilter} className="flex items-center gap-3 flex-wrap">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-44"
          />
          <select
            className="px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] text-sm text-[#1e293b] transition-all duration-200 hover:border-[#255946]/30 focus:outline-none focus:ring-2 focus:ring-[#255946]/20 focus:border-[#255946]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Button type="submit" size="sm">Apply Filter</Button>
          {(dateFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => { setDateFilter(''); setStatusFilter(''); fetchAppointments(1); }}
              className="text-xs text-[#64748b] hover:text-[#C62828] transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? <Spinner /> : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F6F0]/60">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DE]/50">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-[#F8F6F0]/40 transition-colors cursor-pointer" onClick={() => navigate(`/appointments/${apt._id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#255946]/10 to-[#255946]/5 flex items-center justify-center text-[10px] font-semibold text-[#255946]">
                          {(apt.patientId?.userId?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-[#1e293b]">{apt.patientId?.userId?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748b]">{apt.doctorId?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#1e293b]">
                      {apt.dateTime ? new Date(apt.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs capitalize text-[#64748b]">
                        {apt.type === 'virtual' ? '🖥 Virtual' : '🏥 In-Clinic'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[apt.status] || 'default'} dot>
                        {apt.status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {apt.status === 'scheduled' && (
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="secondary" disabled={actionLoading === apt._id} onClick={() => handleComplete(apt._id)}>
                            ✓ Complete
                          </Button>
                          <Button size="sm" variant="danger" disabled={actionLoading === apt._id} onClick={() => handleCancel(apt._id)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-[#64748b]">
                      <p className="text-base">No appointments found</p>
                      <p className="text-xs mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748b]">
            Page <span className="font-medium text-[#1e293b]">{meta.page}</span> of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={meta.page <= 1} onClick={() => fetchAppointments(meta.page - 1)}>
              ← Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={meta.page >= meta.totalPages} onClick={() => fetchAppointments(meta.page + 1)}>
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
