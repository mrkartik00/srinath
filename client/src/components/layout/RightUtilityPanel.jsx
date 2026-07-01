import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Activity, 
  Pill, 
  MoreVertical,
  Calendar as CalendarIcon,
  Clock,
  Mail,
  Award,
  GraduationCap,
  Star,
  Tag,
  User,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RightUtilityPanel({ isMobile }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [viewingMode, setViewingMode] = useState('calendar'); // 'calendar', 'notifications', 'prescriptions'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptsRes, rxRes, convRes] = await Promise.all([
          api.get('/api/v1/appointments/my').catch(() => ({ data: [] })),
          api.get('/api/v1/my/prescriptions').catch(() => ({ data: [] })),
          api.get('/api/v1/chat/conversations').catch(() => ({ data: [] }))
        ]);
        setAppointments(apptsRes.data || []);
        setPrescriptions(rxRes.data || []);
        setConversations(convRes.data || []);
      } catch (err) {
        console.error("Error loading panel data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Listen for custom event showing doctor details in right panel
    const handleDoctorSelect = (e) => {
      setSelectedDoctor(e.detail);
    };
    window.addEventListener('show-doctor-details', handleDoctorSelect);
    return () => {
      window.removeEventListener('show-doctor-details', handleDoctorSelect);
    };
  }, []);

  // Filter scheduled appointments
  const scheduledAppts = appointments.filter(
    (appt) => appt.status === 'scheduled' || appt.status === 'rescheduled'
  );

  // Month details helper
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getStartDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // Monday is 0, Sunday is 6
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const startDay = getStartDayOfMonth(currentDate);

  // Create list of days (including padding for empty slots at start)
  const calendarCells = [];
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  // Format dates
  const todayDateStr = new Date().toLocaleString('default', { month: 'long', day: 'numeric' });
  const calendarMonthYearStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Helper to check if a specific calendar date has a booked appointment
  const dateHasAppointment = (cellDate) => {
    if (!cellDate) return false;
    return scheduledAppts.some((appt) => {
      const apptDate = new Date(appt.dateTime);
      return (
        apptDate.getDate() === cellDate.getDate() &&
        apptDate.getMonth() === cellDate.getMonth() &&
        apptDate.getFullYear() === cellDate.getFullYear()
      );
    });
  };

  // Helper to get the booked appointment details for a specific cell date
  const getAppointmentForDate = (cellDate) => {
    if (!cellDate) return null;
    return scheduledAppts.find((appt) => {
      const apptDate = new Date(appt.dateTime);
      return (
        apptDate.getDate() === cellDate.getDate() &&
        apptDate.getMonth() === cellDate.getMonth() &&
        apptDate.getFullYear() === cellDate.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatTimeRange = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const d = new Date(dateTimeStr);
    const end = new Date(d.getTime() + 30 * 60 * 1000); // 30 minutes duration
    return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <aside className="w-[380px] h-screen bg-[#F8F9FA] flex justify-center items-center shrink-0 border-l border-slate-100 hidden xl:flex">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#253a5a]"></div>
      </aside>
    );
  }

  // If a doctor is clicked, show details page in this right panel
  if (selectedDoctor) {
    const rate = selectedDoctor.rate || '$20/hour';
    
    const getDocExpText = (spec) => {
      const lower = (spec || '').toLowerCase();
      if (lower.includes('cardio')) {
        return 'Over 12 years of specialized practice in cardiology, focusing on preventative care, heart rate analysis, and non-invasive cardiovascular imaging.';
      }
      if (lower.includes('dent') || lower.includes('teeth')) {
        return 'Over 8 years of cosmetic and general dentistry, focusing on preventive treatments, root canals, and structural restorations.';
      }
      if (lower.includes('dermat') || lower.includes('skin')) {
        return 'Over 10 years in clinical dermatology, treating a wide range of conditions from eczema and acne to autoimmune skin disorders.';
      }
      return 'Over 10 years of clinical experience, specializing in advanced diagnostics and personalized treatment plans for diverse patient needs.';
    };

    const getDocSpecialitiesList = (spec) => {
      const lower = (spec || '').toLowerCase();
      if (lower.includes('cardio')) {
        return ['Coronary Care', 'Heart Rhythm Therapy', 'Hypertension Management'];
      }
      if (lower.includes('dent') || lower.includes('teeth')) {
        return ['Teeth Restoration', 'Cosmetic Veneers', 'Gum Health Care'];
      }
      if (lower.includes('dermat') || lower.includes('skin')) {
        return ['General Dermatology', 'Skin Allergy Treatment', 'Acne & Scarring Care'];
      }
      return ['General Consultation', 'Diagnostic Screenings', 'Preventative Therapy'];
    };

    return (
      <aside className={isMobile ? "fixed inset-0 w-full h-full bg-[#F8F9FA] z-[200] flex flex-col gap-4 p-5 overflow-y-auto hide-scrollbar font-['Figtree'] mobile-slide-in" : "w-[380px] h-screen overflow-y-auto hide-scrollbar bg-[#F8F9FA] flex flex-col gap-4 p-5 sticky top-0 right-0 shrink-0 z-40 hidden xl:flex font-['Figtree'] border-l border-slate-100 animate-[fadeIn_0.2s_ease-out]"}>
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .hide-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          @keyframes slideInLeftMobile {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
          .mobile-slide-in {
            animation: slideInLeftMobile 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
        
        {/* Title & Close Header */}
        <div className="flex justify-between items-center pb-2">
          <h2 className="text-[17px] font-bold text-slate-800 font-['Figtree']">Detail Doctor</h2>
          <button 
            onClick={() => setSelectedDoctor(null)}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-all focus:outline-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Large Image Box */}
        <div className="w-full h-48 rounded-[24px] bg-[#EFF6FF] text-[#253a5a] flex items-center justify-center font-bold text-4xl border border-slate-100/50 flex-shrink-0 relative overflow-hidden">
          {selectedDoctor.name.replace('Dr. ', '').charAt(0)}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#EFF6FF]/40 to-[#EFF6FF]/10 pointer-events-none"></div>
        </div>

        {/* Name & Specialty/Rate row */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-[#253a5a] font-['Figtree'] leading-tight">
            {selectedDoctor.name}
          </h3>
          <div className="flex items-center gap-4 text-slate-500 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <User size={14} className="text-slate-400" />
              <span className="capitalize">{selectedDoctor.specialty || 'General Practitioner'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Tag size={14} className="text-slate-400" />
              <span>{rate}</span>
            </span>
          </div>
        </div>

        <div className="border-t border-[#eaedf1] my-1"></div>

        {/* Experience Section */}
        <div className="flex flex-col gap-1.5">
          <h4 className="font-bold text-sm text-[#253a5a] flex items-center gap-2 font-['Figtree']">
            <GraduationCap size={16} className="text-slate-500" /> Experience
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {getDocExpText(selectedDoctor.specialty)}
          </p>
        </div>

        {/* Speciality Section */}
        <div className="flex flex-col gap-1.5">
          <h4 className="font-bold text-sm text-[#253a5a] flex items-center gap-2 font-['Figtree']">
            <Activity size={16} className="text-slate-500" /> Speciality
          </h4>
          <ul className="list-disc pl-5 text-xs text-slate-500 font-medium flex flex-col gap-1.5">
            {getDocSpecialitiesList(selectedDoctor.specialty).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Reviews Section */}
        <div className="flex flex-col gap-2">
          <h4 className="font-bold text-sm text-[#253a5a] font-['Figtree']">Reviews</h4>
          <div className="bg-white border border-[#eaedf1] rounded-2xl p-4 flex flex-col gap-2 relative">
            <div className="flex gap-0.5 text-amber-400">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold italic pr-6 line-clamp-2">
              "Dr. {selectedDoctor.name.replace('Dr. ', '')} was clear, caring, and professional. My treatment plan helped me recover quickly."
            </p>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 cursor-pointer shadow-xs hover:bg-slate-100 transition-colors">
              <ChevronRight size={12} />
            </div>
          </div>
        </div>

        {/* Bottom Action Row */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate('/book-appointment', { state: { doctorId: selectedDoctor.isMock ? undefined : (selectedDoctor._id || selectedDoctor.id) } })}
            className="bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-xs py-3.5 rounded-xl transition-all flex-1 text-center shadow-xs uppercase tracking-wider"
          >
            Book Now
          </button>
          
          <button
            onClick={() => navigate('/chat')}
            className="border border-[#eaedf1] text-[#253a5a] hover:bg-slate-50 font-bold text-xs py-3.5 rounded-xl transition-all flex-1 text-center bg-white"
          >
            Chat
          </button>
        </div>

      </aside>
    );
  }

  if (isMobile && !selectedDoctor) return null;

  const displayConvs = conversations.length > 0 ? conversations.slice(0, 2) : [
    {
      _id: 'mock-conv-1',
      doctorId: { name: 'Dr. Arun Sharma' },
      lastMessagePreview: 'Sent you the prescription updates. Please review...',
      lastMessageAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      unreadByPatient: 1,
      isMock: true
    },
    {
      _id: 'mock-conv-2',
      doctorId: { name: 'Dr. Priya Mehta' },
      lastMessagePreview: 'Your lab reports look excellent. No further actions needed.',
      lastMessageAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      unreadByPatient: 1,
      isMock: true
    }
  ];

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // If viewing all notifications, take over the right panel
  if (viewingMode === 'notifications') {
    const allConvs = conversations.length > 0 ? conversations : displayConvs;
    return (
      <aside className="w-[380px] h-screen overflow-y-auto hide-scrollbar bg-[#F8F9FA] flex flex-col gap-5 p-6 sticky top-0 right-0 shrink-0 z-40 hidden xl:flex font-['Figtree'] border-l border-slate-100 animate-[fadeIn_0.2s_ease-out]">
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none !important; }
          .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        `}</style>

        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[#eaedf1]">
          <div>
            <button 
              onClick={() => setViewingMode('calendar')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#36565F] hover:text-[#253a5a] mb-1.5 focus:outline-none uppercase tracking-wider"
            >
              <ChevronLeft size={14} /> Back to Panel
            </button>
            <h2 className="text-lg font-extrabold text-[#253a5a]">Notifications</h2>
          </div>
          <button onClick={() => setViewingMode('calendar')} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* List of all notifications */}
        <div className="flex flex-col gap-3">
          {allConvs.map((conv) => {
            const hasUnread = conv.unreadByPatient > 0;
            const docName = conv.doctorId?.name || 'Doctor';
            return (
              <div 
                key={conv._id}
                onClick={() => { navigate('/chat'); setViewingMode('calendar'); }}
                className="flex items-start gap-3 bg-white hover:bg-slate-50 p-4 rounded-2xl cursor-pointer transition-all border border-[#eaedf1] shadow-xs group"
              >
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#253a5a] shrink-0 font-bold text-xs">
                  {getInitials(docName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-[#111827] group-hover:text-[#253a5a] transition-colors truncate">{docName}</h4>
                    <span className="text-[9px] text-[#A0AEC0] font-semibold">{formatMsgTime(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 pr-2">
                    {conv.lastMessagePreview || 'No messages yet...'}
                  </p>
                </div>
                {hasUnread && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  // If viewing all prescriptions, take over the right panel
  if (viewingMode === 'prescriptions') {
    return (
      <aside className="w-[380px] h-screen overflow-y-auto hide-scrollbar bg-[#F8F9FA] flex flex-col gap-5 p-6 sticky top-0 right-0 shrink-0 z-40 hidden xl:flex font-['Figtree'] border-l border-slate-100 animate-[fadeIn_0.2s_ease-out]">
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none !important; }
          .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        `}</style>

        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[#eaedf1]">
          <div>
            <button 
              onClick={() => setViewingMode('calendar')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#36565F] hover:text-[#253a5a] mb-1.5 focus:outline-none uppercase tracking-wider"
            >
              <ChevronLeft size={14} /> Back to Panel
            </button>
            <h2 className="text-lg font-extrabold text-[#253a5a]">Your Treatment</h2>
          </div>
          <button onClick={() => setViewingMode('calendar')} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* List of all treatments */}
        <div className="flex flex-col gap-3">
          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => {
              const med = rx.medicines?.[0] || { name: 'Ibuprofen', dosage: '200mg', frequency: 'twice_daily' };
              const freqText = med.frequency === 'once_daily' ? 'Once per day' 
                             : med.frequency === 'twice_daily' ? '2 times per day' 
                             : med.frequency === 'thrice_daily' ? '3 times per day' 
                             : 'As prescribed';
              return (
                <div key={rx._id} className="flex items-center gap-3 bg-white border border-[#eaedf1] p-4 rounded-2xl shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#253a5a] shrink-0">
                    <Pill size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-[#111827]">{med.name}</h4>
                    <p className="text-[10px] text-[#A0AEC0] font-semibold mt-0.5">{freqText}</p>
                    <p className="text-[9px] text-[#8db5c4] font-medium mt-1">Prescribed by Dr. {rx.doctorId?.name || rx.doctor || 'Sharma'}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400 border border-[#eaedf1] shadow-xs">
              <span className="text-2xl block mb-2">💊</span>
              <p className="text-xs font-semibold">No active treatments found</p>
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[380px] h-screen overflow-y-auto hide-scrollbar bg-[#F8F9FA] flex flex-col gap-6 p-6 sticky top-0 right-0 shrink-0 z-40 hidden xl:flex border-l border-slate-100/50">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .hide-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      
      {/* ─── Calendar Widget Card ─── */}
      <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-wider block">Today</span>
            <h3 className="text-[14px] font-extrabold text-[#111827] mt-0.5">{todayDateStr}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-[#253a5a] capitalize bg-slate-50 border border-slate-100/50 px-3 py-1 rounded-full">
              {calendarMonthYearStr}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNextMonth} className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-semibold text-[#A0AEC0] uppercase tracking-wider mb-2">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>

        {/* Month grid cells */}
        <div className="grid grid-cols-7 gap-y-3 text-center">
          {calendarCells.map((cellDate, idx) => {
            if (!cellDate) return <div key={`empty-${idx}`} />;
            
            const isSelected = 
              selectedDate.getDate() === cellDate.getDate() &&
              selectedDate.getMonth() === cellDate.getMonth() &&
              selectedDate.getFullYear() === cellDate.getFullYear();
              
            const hasDot = dateHasAppointment(cellDate);
            const apptForDate = getAppointmentForDate(cellDate);
            
            // Dynamic tooltip positioning inline styles to prevent clipping at left/right edges
            const colIdx = idx % 7;
            let tooltipStyle = { left: '50%', transform: 'translateX(-50%)' };
            let arrowStyle = { left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
            
            if (colIdx <= 1) {
              tooltipStyle = { left: '8px', transform: 'none' };
              arrowStyle = { left: '16px', transform: 'rotate(45deg)' };
            } else if (colIdx >= 5) {
              tooltipStyle = { right: '8px', left: 'auto', transform: 'none' };
              arrowStyle = { right: '16px', left: 'auto', transform: 'rotate(45deg)' };
            }

            return (
              <div key={idx} className="w-9 h-9 relative group mx-auto flex items-center justify-center">
                <button
                  onClick={() => setSelectedDate(cellDate)}
                  className={`w-full h-full rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isSelected 
                      ? 'bg-[#253a5a] text-white shadow-md shadow-[#253a5a]/20 scale-105' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cellDate.getDate()}
                </button>
                {/* Dot underneath if date has an appointment */}
                {hasDot && (
                  <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#253a5a]'}`} />
                )}
                {/* Hover Tooltip Overlay */}
                {hasDot && apptForDate && (
                  <div 
                    style={tooltipStyle}
                    className="absolute bottom-11 hidden group-hover:block z-50 w-44 bg-[#253a5a] text-white text-[10px] p-2.5 rounded-xl shadow-lg pointer-events-none text-left border border-slate-700/30 animate-[fadeIn_0.15s_ease-out]"
                  >
                    <div className="font-bold truncate">{apptForDate.type || 'Consultation'}</div>
                    <div className="text-white/80 mt-0.5 truncate">Dr. {apptForDate.doctorId?.name || apptForDate.doctor}</div>
                    <div className="text-white/60 mt-0.5 font-semibold">
                      {new Date(apptForDate.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {/* Popover triangle indicator */}
                    <div 
                      style={arrowStyle}
                      className="absolute -bottom-1 w-2 h-2 bg-[#253a5a] border-r border-b border-slate-700/30"
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Recent Notifications Card ─── */}
      <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100/50">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-sm text-[#111827]">Recent Notifications</h3>
          <button 
            onClick={() => setViewingMode('notifications')} 
            className="text-xs font-bold text-[#253a5a] hover:underline focus:outline-none"
          >
            See all
          </button>
        </div>
        <p className="text-[11px] text-[#A0AEC0] font-medium mb-5">Latest messages from your doctors</p>

        <div className="flex flex-col gap-3.5">
          {displayConvs.map((conv) => {
            const hasUnread = conv.unreadByPatient > 0;
            const docName = conv.doctorId?.name || 'Doctor';
            return (
              <div 
                key={conv._id}
                onClick={() => navigate('/chat')}
                className="flex items-start gap-3 bg-slate-50/50 hover:bg-slate-100/50 p-3 rounded-2xl cursor-pointer transition-all border border-slate-100/30 group"
              >
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#253a5a] shrink-0 font-bold text-xs">
                  {getInitials(docName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-[#111827] group-hover:text-[#253a5a] transition-colors truncate">{docName}</h4>
                    <span className="text-[9px] text-[#A0AEC0] font-semibold">{formatMsgTime(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate pr-2">
                    {conv.lastMessagePreview || 'No messages yet...'}
                  </p>
                </div>
                {hasUnread && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── "Your treatment" Card ─── */}
      <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100/50">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-sm text-[#111827]">Your treatment</h3>
          <button 
            onClick={() => setViewingMode('prescriptions')} 
            className="text-xs font-bold text-[#253a5a] hover:underline focus:outline-none"
          >
            See more
          </button>
        </div>
        <p className="text-[11px] text-[#A0AEC0] font-medium mb-5">All your prescriptions are here</p>

        <div className="flex flex-col gap-3">
          {prescriptions.length > 0 ? (
            prescriptions.slice(0, 2).map((rx) => {
              const med = rx.medicines?.[0] || { name: 'Ibuprofen', dosage: '200mg', frequency: 'twice_daily' };
              const freqText = med.frequency === 'once_daily' ? 'Once per day' 
                             : med.frequency === 'twice_daily' ? '2 times per day' 
                             : med.frequency === 'thrice_daily' ? '3 times per day' 
                             : 'As prescribed';
              return (
                <div key={rx._id} className="flex items-center gap-3 bg-slate-50/50 border border-slate-100/30 p-3.5 rounded-2xl">
                  <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#253a5a] shrink-0">
                    <Pill size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#111827]">{med.name}</h4>
                    <p className="text-[10px] text-[#A0AEC0] font-semibold mt-0.5">{freqText}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-slate-400">
              <p className="text-xs">No active treatments found</p>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}
