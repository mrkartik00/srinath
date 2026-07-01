import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  AlarmClock,
  RefreshCw
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:      { bg: '#EFF6FF', color: '#3B82F6',  label: 'Pending',      icon: <Clock size={14} className="text-[#3B82F6]" /> },
  sent:         { bg: '#EFF6FF', color: '#3B82F6',  label: 'Due',          icon: <Clock size={14} className="text-[#3B82F6]" /> },
  acknowledged: { bg: '#ECFDF5', color: '#10B981',  label: 'Taken',        icon: <CheckCircle2 size={14} className="text-[#10B981]" /> },
  snoozed:      { bg: '#FEF3C7', color: '#D97706',  label: 'Snoozed',      icon: <AlarmClock size={14} className="text-[#D97706]" /> },
  missed:       { bg: '#FEE2E2', color: '#EF4444',  label: 'Missed',       icon: <XCircle size={14} className="text-[#EF4444]" /> },
};

export default function MyReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const fetch = () => {
    setLoading(true);
    api.get('/api/v1/my/reminders')
      .then(res => setReminders(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleAction = async (id, action, body = {}) => {
    setActing(`${id}-${action}`);
    try {
      await api.patch(`/api/v1/my/reminders/${id}/${action}`, body);
      toast.success(
        action === 'ack'   ? 'Marked as taken!' :
        action === 'snooze' ? 'Snoozed 15 min' :
        'Marked as missed'
      );
      fetch();
    } catch {
      toast.error('Action failed');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafb]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3B82F6]" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Group by status for summary chips
  const pending    = reminders.filter(r => r.status === 'pending' || r.status === 'sent');
  const taken      = reminders.filter(r => r.status === 'acknowledged');
  const missed     = reminders.filter(r => r.status === 'missed');
  const snoozed    = reminders.filter(r => r.status === 'snoozed');

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 bg-[#f8fafb] min-h-screen font-['Figtree'] w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-5 border-b border-[#eaedf1]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#253a5a] tracking-tight">Today's Reminders</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">{today}</p>
        </div>
        <button
          onClick={fetch}
          className="flex items-center gap-1.5 border border-[#eaedf1] bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Summary Chips ── */}
      {reminders.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Pending', count: pending.length,  bg: '#EFF6FF', color: '#3B82F6'  },
            { label: 'Taken',   count: taken.length,    bg: '#ECFDF5', color: '#10B981'  },
            { label: 'Snoozed', count: snoozed.length,  bg: '#FEF3C7', color: '#D97706'  },
            { label: 'Missed',  count: missed.length,   bg: '#FEE2E2', color: '#EF4444'  },
          ].map(s => (
            <div key={s.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold"
              style={{ background: s.bg, color: s.color }}
            >
              {s.count} {s.label}
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {reminders.length === 0 ? (
        <div className="bg-white border border-[#eaedf1] rounded-[24px] p-16 flex flex-col items-center justify-center text-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
          <div className="w-16 h-16 rounded-full bg-[#E6F2F5] flex items-center justify-center text-[#253a5a]">
            <Pill size={32} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#253a5a]">No reminders for today</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1 max-w-xs leading-relaxed">
              Medicine reminders are automatically created when your doctor issues a prescription.
            </p>
          </div>
        </div>
      ) : (
        /* ── Reminders Table Card ── */
        <div className="bg-white border border-[#eaedf1] rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.01)] overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-[#eaedf1] text-[10px] font-bold text-[#8db5c4] uppercase tracking-wider">
            <span>Medicine</span>
            <span>Dosage</span>
            <span>Time</span>
            <span>Actions</span>
          </div>

          {reminders.map((r, idx) => {
            const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
            const isActionable = r.status === 'pending' || r.status === 'sent';
            const time = new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={r._id}
                className={`px-6 py-4 flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-start md:items-center transition-colors hover:bg-slate-50/60 ${idx !== 0 ? 'border-t border-[#eaedf1]' : ''}`}
              >
                {/* Medicine Name + Status */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0`}
                    style={{ background: st.bg }}>
                    <Pill size={16} style={{ color: st.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#253a5a] truncate">{r.medicineName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {st.icon}
                      <span className="text-[11px] font-bold" style={{ color: st.color }}>{st.label}</span>
                    </div>
                  </div>
                </div>

                {/* Dosage */}
                <span className="text-[12px] font-semibold text-slate-600">{r.dosage}</span>

                {/* Time */}
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
                  <Clock size={12} className="text-slate-400" />
                  {time}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {isActionable && (
                    <>
                      <button
                        disabled={!!acting}
                        onClick={() => handleAction(r._id, 'ack')}
                        className="bg-[#253a5a] hover:bg-[#1a2c44] disabled:opacity-50 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition-all uppercase tracking-wider"
                      >
                        Taken ✓
                      </button>
                      <button
                        disabled={!!acting}
                        onClick={() => handleAction(r._id, 'snooze', { minutes: 15 })}
                        className="border border-[#eaedf1] hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold text-[10px] px-3 py-2 rounded-xl transition-all"
                      >
                        Snooze
                      </button>
                      <button
                        disabled={!!acting}
                        onClick={() => handleAction(r._id, 'miss')}
                        className="border border-red-100 hover:border-red-200 hover:bg-red-50/50 disabled:opacity-50 text-red-500 font-bold text-[10px] px-3 py-2 rounded-xl transition-all"
                      >
                        Missed
                      </button>
                    </>
                  )}
                  {!isActionable && (
                    <span
                      className="text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
