import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDashboardStats } from '../api/endpoints/dashboard';
import { cancelAppointment, completeAppointment } from '../api/endpoints/appointments';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';

const STAT_CARDS = [
  { key: 'totalPatients', label: 'Total Patient', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { key: 'todayAppointments', label: "Total Appointment", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { key: 'completedToday', label: 'Completed Today', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'pendingToday', label: 'Pending', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchStats = () => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleComplete = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await completeAppointment(id);
      toast.success('Appointment marked as complete');
      fetchStats();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to complete appointment');
    }
  };

  const handleCancel = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointment(id, 'Cancelled from dashboard');
      toast.success('Appointment cancelled');
      fetchStats();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  if (loading) return <Spinner size="lg" />;

  const s = stats || {};

  return (
    <div className="space-y-6" style={{ fontFamily: '"Figtree", sans-serif' }}>

      {/* Stat Cards - White with purple circle icon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="bg-white rounded-[10px] p-5 flex items-center gap-4 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-[#273d71] text-white flex items-center justify-center flex-shrink-0">
              {card.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-[#1e293b]">{s[card.key] ?? 0}</p>
              <p className="text-sm text-[#64748b]">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Row (Checkup style block for Next Appointment) & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Notifications (Unread Chats) */}
        <div className="bg-white rounded-[10px] p-5 shadow-sm border border-[#273d71]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#273d71]">Recent Notification of Chat</h3>
            {s.unreadConversations?.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {s.unreadConversations.length}
              </span>
            )}
          </div>
          {s.unreadConversations?.length > 0 ? (
            <div className="space-y-3">
              {s.unreadConversations.map((conv) => (
                <div
                  key={conv._id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/chat?id=${conv._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1e293b]">{conv.patientId?.name || 'Unknown Patient'}</p>
                      <p className="text-xs text-[#64748b] truncate max-w-[150px] sm:max-w-[200px] mt-0.5">{conv.lastMessagePreview || 'New message received'}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full uppercase tracking-wider">{conv.unreadByDoctor} New</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="text-sm text-[#64748b]">No unread messages</p>
            </div>
          )}
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-[10px] p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1e293b]">Recent Patients</h3>
            <span className="text-xs text-[#273d71] font-semibold">{s.recentPatients?.length || 0} New Patients</span>
          </div>
          {s.recentPatients?.length > 0 ? (
            <div className="space-y-3">
              {s.recentPatients.slice(0, 3).map((p, idx) => (
                <details key={p._id || idx} className="group p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <summary className="flex items-center justify-between list-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#273d71]/10 text-[#273d71] flex items-center justify-center font-bold text-sm">
                        {(p.userId?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1e293b]">{p.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-[#64748b] group-open:hidden">Tap for details</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 bg-[#273d71]/10 text-[#273d71] rounded-full group-open:hidden">New</span>
                    <span className="hidden group-open:block text-xs text-[#64748b]">Close</span>
                  </summary>
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#64748b] mb-1">Email</p>
                      <p className="text-sm font-medium text-[#1e293b]">{p.userId?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748b] mb-1">Phone</p>
                      <p className="text-sm font-medium text-[#1e293b]">{p.userId?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748b] mb-1">Gender</p>
                      <p className="text-sm font-medium text-[#1e293b] capitalize">{p.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748b] mb-1">Blood Group</p>
                      <p className="text-sm font-medium text-[#1e293b]">{p.bloodGroup || 'N/A'}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">No patients yet</p>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-[10px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <h3 className="text-base font-bold text-[#1e293b]">Appointment</h3>
          <span className="text-sm font-bold text-[#1e293b]">Total Appointment : {s.upcomingAppointments?.length || 0}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <tbody>
              {s.upcomingAppointments?.length > 0 ? (
                s.upcomingAppointments.map((apt) => {
                  const patientName = apt.patientId?.userId?.name || 'Unknown Patient';
                  const docName = apt.doctorId?.name || 'Unknown Doctor';
                  const initials = patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  return (
                    <tr 
                      key={apt._id} 
                      onClick={() => navigate(`/appointments/${apt._id}`)}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#f3f4f6] flex items-center justify-center text-sm font-bold text-[#273d71] flex-shrink-0">
                            {initials}
                          </div>
                          <span className="text-sm font-semibold text-[#1e293b]">{patientName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-[#64748b] whitespace-nowrap">{docName}</td>
                      <td className="py-4 px-4 text-sm text-[#1e293b] font-medium whitespace-nowrap">{formatDate(apt.dateTime)}, {formatTime(apt.dateTime)}</td>
                      <td className="py-4 px-4 text-sm text-[#64748b] capitalize whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{apt.type === 'virtual' ? '💻' : '🏥'}</span>
                          {apt.type === 'virtual' ? 'Virtual' : 'In-Clinic'}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#eff6ff] text-[#3b82f6] border border-[#bfdbfe] flex items-center gap-1.5 w-fit capitalize">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                          {apt.status || 'scheduled'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            type="button"
                            onClick={(e) => handleComplete(e, apt._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-[#475569] hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors cursor-pointer relative z-10"
                          >
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Complete
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleCancel(e, apt._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b91c1c] text-white text-sm font-medium hover:bg-[#991b1b] transition-colors cursor-pointer relative z-10"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-sm text-[#64748b]">No appointments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
