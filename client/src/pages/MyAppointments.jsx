import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyAppointments, cancelAppointment } from '../api/endpoints/appointment';

const STATUS_STYLES = {
  scheduled: { bg: '#EFF6FF', color: '#3B82F6', label: 'Scheduled' },
  completed: { bg: '#ECFDF5', color: '#10B981', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', color: '#EF4444', label: 'Cancelled' },
  no_show: { bg: '#F3F4F6', color: '#6B7280', label: 'No Show' },
  rescheduled: { bg: '#EFF6FF', color: '#3B82F6', label: 'Rescheduled' },
  in_progress: { bg: '#FEF3C7', color: '#F59E0B', label: 'In Progress' },
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const isMobile = useIsMobile();

  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments({ limit: 50 });
      setAppointments(res.data || []);
    } catch { } finally { setLoading(false); }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f8fafb]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(apt => !['completed', 'cancelled', 'no_show'].includes(apt.status));
  const pastAppointments = appointments.filter(apt => ['completed', 'cancelled', 'no_show'].includes(apt.status));

  const renderAppointmentList = (list) => {
    if (list.length === 0) {
      return (
        <p className="text-sm text-slate-400 font-medium italic py-6 text-center">
          No appointments in this section.
        </p>
      );
    }
    return (
      <div className="flex flex-col">
        {list.map((apt) => {
          const statusInfo = STATUS_STYLES[apt.status] || STATUS_STYLES.scheduled;
          const dateObj = new Date(apt.dateTime);
          const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
          const formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          const doctorName = apt.doctorId?.name || 'Doctor';
          const isExpanded = expandedCard === apt._id;

          return (
            <div
              key={apt._id}
              className="border-b border-[#eaedf1] last:border-0"
              onMouseEnter={() => { if (!isMobile) setExpandedCard(apt._id); }}
              onMouseLeave={() => { if (!isMobile) setExpandedCard(null); }}
            >
              <div
                className="flex items-center justify-between py-6 cursor-pointer transition-all"
                onClick={() => {
                  if (isMobile) {
                    navigate(`/appointments/${apt._id}`);
                  } else {
                    setExpandedCard(isExpanded ? null : apt._id);
                  }
                }}
              >
                <div className="flex items-center gap-4 flex-wrap flex-1">
                  <h4 className={`text-lg font-bold font-['Figtree'] transition-colors ${isExpanded ? 'text-[#3B82F6]' : 'text-[#253a5a]'}`}>
                    Dr. {doctorName}
                  </h4>
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="bg-[#f0f4f8] text-[#253a5a] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                      {formattedDate}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                      style={{ background: statusInfo.bg, color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <span className={`text-[#8db5c4] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>

              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: isExpanded ? '300px' : '0',
                  opacity: isExpanded ? 1 : 0,
                  paddingBottom: isExpanded ? '20px' : '0',
                }}
              >
                <div className="bg-[#f0f4f8] rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#8db5c4] uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-bold text-[#253a5a]">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8db5c4] uppercase tracking-wider mb-1">Time</p>
                    <p className="text-sm font-bold text-[#253a5a]">{formattedTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8db5c4] uppercase tracking-wider mb-1">Type</p>
                    <p className="text-sm font-bold text-[#253a5a] capitalize">{apt.type?.replace('_', ' ') || 'Consultation'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8db5c4] uppercase tracking-wider mb-1">Duration</p>
                    <p className="text-sm font-bold text-[#253a5a]">{apt.duration} mins</p>
                  </div>
                </div>

                {apt.cancellationReason && (
                  <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl leading-relaxed">
                    <strong>Cancellation Reason:</strong> {apt.cancellationReason}
                  </p>
                )}

                <div className="flex gap-3 mt-4 flex-wrap">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${apt._id}`); }}
                    className="bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all focus:outline-none shadow-xs"
                  >
                    View Details
                  </button>
                  <Link
                    to="/book-appointment"
                    onClick={e => e.stopPropagation()}
                    className="border border-[#253a5a] text-[#253a5a] hover:bg-slate-50 font-bold text-xs px-5 py-2.5 rounded-full transition-all text-center no-underline inline-block"
                  >
                    Reschedule
                  </Link>
                  {apt.status === 'scheduled' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancel(apt._id); }}
                      className="border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs px-5 py-2.5 rounded-full transition-all focus:outline-none"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-[#f8fafb] min-h-screen p-6 font-['Figtree'] max-w-[1280px] mx-auto w-full">

      {/* Appointments Page Header */}
      <div className="flex justify-between items-center mb-8 pb-5 border-b border-[#eaedf1]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#253a5a] font-['Figtree'] tracking-tight">
            Appointments
          </h1>
          <p className="text-xs text-[#6B7C84] mt-1 font-semibold">
            Manage, schedule, and view your upcoming and past medical visits.
          </p>
        </div>
        <button
          onClick={() => navigate('/book-appointment')}
          className="flex items-center gap-2 bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all focus:outline-none shadow-xs"
        >
          Book Appointment
        </button>
      </div>

      {appointments.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-[24px] border border-[#eaedf1] p-8 shadow-xs">
          <div className="text-5xl mb-4 opacity-50">📋</div>
          <h3 className="text-xl font-bold text-[#253a5a] font-['Figtree'] mb-2">
            No consultations yet
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            You don't have any appointments scheduled in our records.
          </p>
          <button
            onClick={() => navigate('/book-appointment')}
            className="bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-xs px-6 py-3 rounded-full transition-all focus:outline-none shadow-xs"
          >
            Book Your First Appointment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Upcoming Section */}
          <div className="bg-white rounded-[24px] border border-[#eaedf1] p-6 shadow-xs">
            <h3 className="text-[20px] font-semibold text-[#253a5a] font-['Figtree'] mb-6 pb-3 border-b border-[#eaedf1]">
              Upcoming
            </h3>
            {renderAppointmentList(upcomingAppointments)}
          </div>

          {/* Past Section */}
          <div className="bg-white rounded-[24px] border border-[#eaedf1] p-6 shadow-xs">
            <h3 className="text-[20px] font-semibold text-[#253a5a] font-['Figtree'] mb-6 pb-3 border-b border-[#eaedf1]">
              Past Visits
            </h3>
            {renderAppointmentList(pastAppointments)}
          </div>

        </div>
      )}


    </div>
  );
}
