import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Pill,
  Calendar,
  User,
  ChevronDown,
  FileText,
  Download,
  Stethoscope,
  Clock
} from 'lucide-react';

const STATUS_CONFIG = {
  active:    { bg: '#ECFDF5', color: '#10B981', label: 'Active' },
  completed: { bg: '#EFF6FF', color: '#3B82F6', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', color: '#EF4444', label: 'Cancelled' },
};

const FREQ_LABEL = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  thrice_daily: 'Thrice daily',
  custom: 'Custom',
};

export default function MyPrescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/api/v1/my/prescriptions')
      .then(res => setPrescriptions(res.data || []))
      .catch(() => toast.error('Failed to load prescriptions'))
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = async (rxId, e) => {
    e.stopPropagation();
    const t = toast.loading('Preparing download...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/my/prescriptions/${rxId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error('PDF not available yet', { id: t }); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `prescription-${rxId}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded!', { id: t });
    } catch {
      toast.error('Failed to download PDF', { id: t });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafb]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3B82F6]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 bg-[#f8fafb] min-h-screen font-['Figtree'] w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-5 border-b border-[#eaedf1]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#253a5a] tracking-tight">Prescriptions</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} issued by your doctors
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#EFF6FF] text-[#3B82F6] text-[11px] font-bold px-3 py-1.5 rounded-full">
          <Stethoscope size={13} /> Prescription History
        </div>
      </div>

      {/* ── Empty State ── */}
      {prescriptions.length === 0 ? (
        <div className="bg-white border border-[#eaedf1] rounded-[24px] p-16 flex flex-col items-center justify-center text-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
          <div className="w-16 h-16 rounded-full bg-[#E6F2F5] flex items-center justify-center text-[#253a5a]">
            <Pill size={32} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#253a5a]">No prescriptions yet</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1 max-w-xs leading-relaxed">
              Your healthcare providers have not issued any prescriptions for you yet.
            </p>
          </div>
        </div>
      ) : (
        /* ── Prescriptions List ── */
        <div className="bg-white border border-[#eaedf1] rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.01)] overflow-hidden">
          {prescriptions.map((rx, idx) => {
            const status = STATUS_CONFIG[rx.status] || STATUS_CONFIG.active;
            const doctorName = rx.doctorId?.name || 'Doctor';
            const issuedDate = new Date(rx.issuedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const isOpen = expanded === rx._id;

            return (
              <div key={rx._id} className={idx !== 0 ? 'border-t border-[#eaedf1]' : ''}>

                {/* ── Row (click to expand) ── */}
                <div
                  onClick={() => setExpanded(isOpen ? null : rx._id)}
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6F2F5] flex items-center justify-center flex-shrink-0">
                      <Pill size={18} className="text-[#36565F]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[15px] text-[#253a5a] truncate">{rx.diagnosis || 'Prescription'}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                          <User size={11} /> Dr. {doctorName.replace(/^Dr\.?\s*/i, '')}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                          <Calendar size={11} /> {issuedDate}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                          <Pill size={11} /> {rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* ── Expanded Detail ── */}
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-6 flex flex-col gap-5">

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Issued On', value: issuedDate },
                        { label: 'Prescribing Doctor', value: `Dr. ${doctorName}` },
                        { label: 'Medicines', value: `${rx.medicines.length} item${rx.medicines.length !== 1 ? 's' : ''}` },
                        { label: 'Status', value: rx.status },
                      ].map(item => (
                        <div key={item.label} className="bg-[#f8fafb] rounded-2xl p-4">
                          <p className="text-[10px] font-bold text-[#8db5c4] uppercase tracking-wider mb-1">{item.label}</p>
                          <p className="text-[13px] font-bold text-[#253a5a] capitalize">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Medicines */}
                    <div>
                      <p className="text-[11px] font-bold text-[#36565F] uppercase tracking-wider mb-3">Prescribed Medications</p>
                      <div className="flex flex-col gap-2">
                        {rx.medicines.map((med, i) => (
                          <div key={i} className="bg-white border border-[#eaedf1] rounded-2xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#E6F2F5] flex items-center justify-center flex-shrink-0">
                                <Pill size={14} className="text-[#36565F]" />
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-[#253a5a]">{med.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {med.dosage} · {FREQ_LABEL[med.frequency] || med.frequency}
                                  {med.instructions && ` · ${med.instructions}`}
                                </p>
                              </div>
                            </div>
                            <span className="bg-[#EFF6FF] text-[#3B82F6] text-[10px] font-bold px-3 py-1 rounded-full">
                              {med.duration} Days
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {rx.notes && (
                      <div className="border-l-4 border-[#8db5c4] bg-[#f8fafb] rounded-r-2xl px-4 py-3">
                        <p className="text-[10px] font-bold text-[#8db5c4] uppercase tracking-wider mb-1">Doctor's Notes</p>
                        <p className="text-[13px] text-[#36565f] font-medium leading-relaxed">{rx.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/prescriptions/${rx._id}`); }}
                        className="bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <FileText size={13} /> View Full Details
                      </button>
                      <button
                        onClick={(e) => downloadPdf(rx._id, e)}
                        className="border border-[#eaedf1] hover:bg-slate-50 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5"
                      >
                        <Download size={13} /> Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
