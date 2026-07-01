import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useRequireAuth from '../hooks/useRequireAuth';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Calendar, 
  Clock, 
  Video, 
  FileText, 
  Brain, 
  Heart,
  ChevronRight,
  Activity,
  Smile,
  Stethoscope,
  Shield,
  Sparkles,
  X,
  User,
  SlidersHorizontal,
  Search,
  MessageSquare,
  Tag,
  HeartPulse,
  Bone,
  Eye,
  Ear
} from 'lucide-react';
import toast from 'react-hot-toast';

// Custom Lungs SVG icon since older lucide-react versions don't export it
const Lungs = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M12 3v7" />
    <path d="M12 10c0-1.5-1.5-2.5-3.5-2.5S5 9 5 11.5c0 2 1.5 3.5 3 4.5.5.3 1 .6 1.5.9.5.3.8.7.8 1.2 0 1.2-1 2.4-2.3 2.4-1 0-1.8-.7-2-1.7" />
    <path d="M12 10c0-1.5 1.5-2.5 3.5-2.5S19 9 19 11.5c0 2-1.5 3.5-3 4.5-.5.3-1 .6-1.5.9-.5.3-.8.7-.8 1.2 0 1.2 1 2.4 2.3 2.4 1 0 1.8-.7 2-1.7" />
  </svg>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingDept, setViewingDept] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [apptsRes, docsRes] = await Promise.all([
          api.get('/api/v1/appointments/my').catch(() => ({ data: [] })),
          api.get('/api/v1/config/doctors').catch(() => ({ data: [] }))
        ]);
        setAppointments(apptsRes.data || []);
        setDoctors(docsRes.data || []);
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Filter scheduled appointments
  const upcomingAppointments = appointments.filter(
    (appt) => appt.status === 'scheduled' || appt.status === 'rescheduled'
  );
  
  // Use first scheduled appointment or null (no fake data)
  const activeAppt = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  const formatDateLabel = (date) => {
    const d = new Date(date);
    return `Today, ${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
  };

  const formatTimeLabel = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group doctors by unique specialties dynamically
  const getDynamicDepartments = () => {
    const mockupDepts = [
      { name: 'Cardiology', match: 'cardio', icon: <HeartPulse size={20} className="transition-colors duration-300 text-[#253a5a] group-hover:text-white" /> },
      { name: 'Pulmonology', match: 'pulmon', icon: <Lungs size={20} className="transition-colors duration-300 text-[#253a5a] group-hover:text-white" /> },
      { name: 'Neurology', match: 'neuro', icon: <Brain size={20} className="transition-colors duration-300 text-[#253a5a] group-hover:text-white" /> },
      { name: 'Orthopedic', match: 'ortho', icon: <Bone size={20} className="transition-colors duration-300 text-[#253a5a] group-hover:text-white" /> },
      { name: 'Ophthalmology', match: 'ophthalm', icon: <Eye size={20} className="transition-colors duration-300 text-[#253a5a] group-hover:text-white" /> },
      { name: 'Otolaryngology', match: 'oto', icon: <Ear size={20} className="transition-colors duration-300 text-[#253a5a] group-hover:text-white" /> },
      { name: 'Dermatology', match: 'dermat', icon: <Sparkles size={20} className="transition-colors duration-300 text-[#253a5a] group-hover:text-white" /> }
    ];

    if (doctors.length === 0) {
      return mockupDepts.map(dept => ({
        ...dept,
        count: 0
      }));
    }

    return mockupDepts.map(dept => {
      // Find actual count of database doctors in this department
      const count = doctors.filter(doc => {
        const spec = (doc.specialty || doc.specialization || '').toLowerCase();
        return spec.includes(dept.match) || dept.match.includes(spec);
      }).length;

      return {
        name: dept.name,
        match: dept.match,
        icon: dept.icon,
        count: count
      };
    }).filter(dept => dept.count > 0);
  };

  const departments = getDynamicDepartments();

  // Find all doctors registered for a specific specialty dynamically (with fallback mock support)
  const getDoctorsInDept = (deptName) => {
    const lowerDept = deptName.toLowerCase();
    const matched = doctors.filter(doc => {
      const spec = (doc.specialty || '').toLowerCase();
      return spec.includes(lowerDept) || lowerDept.includes(spec);
    });

    if (matched.length > 0) return matched;

    // No doctors found for this department
    return [];
  };

  // Filter completed/cancelled consultations dynamically
  const pastAppointments = appointments.filter(
    (appt) => appt.status === 'completed' || appt.status === 'cancelled' || new Date(appt.dateTime) < new Date()
  ).sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 flex-1 bg-[#f8fafb]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

  // Determine if active appointment is video or clinic visit
  const isVideoConsultation = activeAppt && (
    activeAppt.type?.toLowerCase().includes('video') || 
    activeAppt.type?.toLowerCase().includes('online') || 
    activeAppt.notes?.toLowerCase().includes('video') || 
    activeAppt.notes?.toLowerCase().includes('online')
  );

  // Helper to map active appointment doctor data
  const getActiveApptDoc = () => {
    if (!activeAppt) return null;
    return activeAppt.doctorId || {
      name: activeAppt.doctor || 'Doctor',
      specialty: activeAppt.type || 'General Practitioner',
    };
  };

  // If viewing a department, show the dynamic sub-page list of doctors
  if (viewingDept) {
    const deptDoctors = getDoctorsInDept(viewingDept.name);
    const filteredDoctors = deptDoctors.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex-1 flex flex-col gap-4 md:gap-6 p-4 md:p-6 bg-[#f8fafb] min-h-screen font-['Figtree'] max-w-[850px] mx-auto xl:mx-0 animate-[fadeIn_0.2s_ease-out]">
        
        {/* Department Page Header */}
        <div className="flex flex-col gap-4 pb-4 md:pb-5 border-b border-[#eaedf1]">
          <div>
            <button 
              onClick={() => { setViewingDept(null); setSearchQuery(''); }}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#36565F] hover:text-[#253a5a] transition-colors mb-2 focus:outline-none uppercase tracking-wider"
            >
              <ChevronRight size={14} className="rotate-180" /> Back to Dashboard
            </button>
            <h1 className="text-[22px] md:text-2xl font-extrabold text-[#253a5a] tracking-tight">
              Doctor List
            </h1>
          </div>

          <div className="flex items-center gap-2 w-full">
            {/* Search Bar */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search Doctor"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#eaedf1] rounded-full px-4 py-2.5 text-xs font-semibold text-[#253a5a] placeholder-slate-400 focus:outline-none focus:border-[#253a5a] transition-colors pr-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              />
              <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Filter Button */}
            <button className="flex items-center gap-1.5 border border-[#eaedf1] bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-full transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] whitespace-nowrap flex-shrink-0">
              <SlidersHorizontal size={14} className="text-slate-500" /> Filter
            </button>
          </div>
        </div>

        {/* Grid of Specialists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {filteredDoctors.map((doc, idx) => {
            const rate = doc.rate || (idx % 3 === 0 ? '$20/hour' : idx % 3 === 1 ? '$30/hour' : '$32/hour');
            return (
              <div 
                key={doc._id || idx}
                className="bg-white border border-[#eaedf1] rounded-[20px] md:rounded-[24px] p-4 md:p-5 flex flex-col gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)]"
              >
                {/* Top Section */}
                <div className="flex gap-3 md:gap-4 items-center">
                  {/* Left Headshot Placeholder */}
                  <div className="w-16 h-20 md:w-24 md:h-28 rounded-2xl bg-[#EFF6FF] text-[#253a5a] flex items-center justify-center font-bold text-2xl md:text-3xl border border-slate-100 flex-shrink-0 relative overflow-hidden">
                    {doc.name.replace('Dr. ', '').charAt(0)}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#EFF6FF]/40 to-[#EFF6FF]/10 pointer-events-none"></div>
                  </div>

                  {/* Right Details */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <h3 className="font-bold text-[16px] md:text-[17px] text-[#253a5a] font-['Figtree'] leading-tight truncate">
                      {doc.name}
                    </h3>
                    
                    {/* Specialty Row */}
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] md:text-xs font-semibold">
                      <User size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="capitalize truncate">{doc.specialty || viewingDept.name}</span>
                    </div>

                    {/* Hourly Rate Row */}
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] md:text-xs font-semibold">
                      <Tag size={13} className="text-slate-400 flex-shrink-0" />
                      <span>{rate}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex gap-2 items-center mt-1">
                  {/* Book Now Button */}
                  <button
                    onClick={() => requireAuth(() => navigate('/book-appointment', { state: { doctorId: doc._id || doc.id } }))}
                    className="bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-[11px] py-2.5 md:py-3 rounded-xl transition-all flex-1 text-center shadow-[0_2px_8px_rgba(37,58,90,0.15)] uppercase tracking-wider"
                  >
                    Book Now
                  </button>

                  {/* Detail Button */}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('show-doctor-details', { detail: doc }))}
                    className="border border-[#eaedf1] text-slate-700 hover:bg-slate-50 font-bold text-[11px] py-2.5 md:py-3 px-4 md:px-5 rounded-xl transition-all flex-1 text-center"
                  >
                    Detail
                  </button>

                  {/* Message/Chat Icon Button */}
                  <button
                    onClick={() => requireAuth(() => navigate('/chat'))}
                    className="border border-[#eaedf1] text-slate-500 hover:bg-slate-50 w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-xl transition-all flex-shrink-0 flex items-center justify-center"
                  >
                    <MessageSquare size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  /* ─── Guest Landing View ─── */
  if (!user) {
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return (
      <div className="flex-1 flex flex-col gap-6 p-6 bg-[#f8fafb] min-h-screen font-['Figtree'] max-w-[850px] mx-auto xl:mx-0">

        {/* Header row — mirrors the logged-in greeting */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7C84] uppercase tracking-widest mb-1">{todayStr}</p>
            <h1 className="text-2xl font-extrabold text-[#253a5a] tracking-tight leading-tight">
              Janki Care
            </h1>
            <p className="text-sm text-[#6B7C84] font-medium mt-0.5">Sign in to access your health dashboard.</p>
          </div>
          <Link
            to="/login"
            className="hidden md:flex items-center gap-2 bg-[#253a5a] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all hover:bg-[#36565F]"
            style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Sign In
          </Link>
        </div>

        {/* Main CTA card — same style as the hero consultation card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#36565F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#f0f4f8] text-[#36565F] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Get Started</span>
              </div>
              <h2 className="text-lg font-bold text-[#253a5a] font-['Figtree']">Book your first appointment</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Connect with our specialists — online or in-clinic.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-sm px-5 py-3 rounded-full transition-all shadow-sm"
              style={{ textDecoration: 'none' }}
            >
              Sign In to Book
            </Link>
            <Link
              to="/register"
              className="border border-[#253a5a] text-[#253a5a] hover:bg-slate-50 font-bold text-sm px-5 py-3 rounded-full transition-all"
              style={{ textDecoration: 'none' }}
            >
              Register
            </Link>
          </div>
        </div>

        {/* What you get — 3 info rows in a card, same as portal info cards */}
        <div>
          <h3 className="text-[16px] font-semibold text-[#253a5a] font-['Figtree'] mb-4">What's included in your portal</h3>
          <div className="bg-white rounded-[24px] border border-slate-100/50 shadow-sm overflow-hidden">
            {[
              { label: 'Appointments', sub: 'View, book and manage all your consultations', icon: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
              { label: 'Prescriptions', sub: 'Access digital prescriptions issued by your doctor', icon: <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></> },
              { label: 'Health Records', sub: 'Your full medical history, securely stored', icon: <><path d="M12 2a5 5 0 100 10A5 5 0 0012 2z" /><path d="M2 20c0-4 4-7 10-7s10 3 10 7" /></> },
              { label: 'Reminders', sub: 'Never miss a dose or a follow-up visit', icon: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></> },
            ].map(({ label, sub, icon }, i, arr) => (
              <div key={label} className={`flex items-center gap-4 px-6 py-4 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-[#f0f4f8] flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#36565F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#253a5a]">{label}</p>
                  <p className="text-xs text-slate-400 font-medium">{sub}</p>
                </div>
                <Link to="/login" className="text-[11px] font-bold text-[#36565F] hover:underline" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Login to access →
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }


  return (
    <div className="flex-1 flex flex-col gap-6 p-6 bg-[#f8fafb] min-h-screen font-['Figtree'] max-w-[850px] mx-auto xl:mx-0">

      {/* ─── Welcome Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#6B7C84] uppercase tracking-widest mb-1">{todayLabel}</p>
          <h1 className="text-2xl font-extrabold text-[#253a5a] tracking-tight leading-tight">
            {greeting}, <span className="text-[#36565F]">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-[#6B7C84] font-medium mt-0.5">Here's your health overview for today.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white border border-[#eaedf1] rounded-2xl px-4 py-2.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block"></span>
          <span className="text-xs font-bold text-[#253a5a]">Active Patient</span>
        </div>
      </div>


      {/* ─── Upcoming Consultation Hero Card ─── */}
      {activeAppt ? (
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div 
          onClick={() => window.dispatchEvent(new CustomEvent('show-doctor-details', { detail: getActiveApptDoc() }))}
          className="flex gap-4 items-center cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-lg text-slate-700">
              {activeAppt?.doctorId?.name ? activeAppt.doctorId.name.charAt(0) : 'D'}
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#EFF6FF] text-[#3B82F6] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Upcoming
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isVideoConsultation ? 'Video Consultation' : 'Clinic Consultation'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#253a5a] mt-1.5 font-['Figtree']">
              {(() => {
                const docName = activeAppt?.doctorId?.name || activeAppt?.doctor || '';
                return docName.startsWith('Dr.') ? docName : `Dr. ${docName}`;
              })()}
            </h2>
            <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">
              {activeAppt?.type || 'General Consultation'}
            </p>
            
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#3B82F6]" />
                {formatDateLabel(activeAppt.dateTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#3B82F6]" />
                {formatTimeLabel(activeAppt.dateTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isVideoConsultation ? (
            <button 
              onClick={() => requireAuth(() => toast.success('Joining video consultation room...'))}
              className="flex items-center justify-center gap-2 bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-sm px-5 py-3 rounded-full transition-all shadow-sm"
            >
              <Video size={16} /> Join Call
            </button>
          ) : (
            <button 
              onClick={() => requireAuth(() => navigate('/appointments'))}
              className="flex items-center justify-center gap-2 bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-sm px-5 py-3 rounded-full transition-all shadow-sm"
            >
              <FileText size={16} /> View Details
            </button>
          )}
          <button 
            onClick={() => requireAuth(() => navigate('/book-appointment'))}
            className="border border-[#253a5a] text-[#253a5a] hover:bg-slate-50 font-bold text-sm px-5 py-3 rounded-full transition-all"
          >
            Reschedule
          </button>
        </div>
      </div>
      ) : (
      <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100/50 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f0f4f8] flex items-center justify-center">
          <Calendar size={24} className="text-[#36565F]" />
        </div>
        <h3 className="text-lg font-semibold text-[#253a5a] mb-2">No Upcoming Appointments</h3>
        <p className="text-sm text-slate-500 mb-4">Book your first appointment with our doctors</p>
        <button onClick={() => navigate('/book-appointment')} className="bg-[#253a5a] hover:bg-[#1a2c44] text-white font-semibold text-sm px-6 py-3 rounded-full transition-all">
          Book Appointment
        </button>
      </div>
      )}

      {/* ─── Explore Departments Section ─── */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[20px] font-semibold text-[#253a5a] font-['Figtree']">Explore Departments</h3>
          <Link to="/book-appointment" className="text-xs font-bold text-[#36565F] hover:text-[#253a5a] hover:underline">View All</Link>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {departments.map((dept, idx) => {
            return (
              <div 
                key={idx}
                onClick={() => setViewingDept(dept)}
                className="bg-white border border-[#eaedf1] rounded-[24px] p-5 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.015)] transition-all duration-300 hover:bg-[#f0f4f8] hover:border-transparent group text-center"
              >
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-[#E6F2F5] transition-all duration-300 group-hover:bg-[#253a5a]"
                >
                  {dept.icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-extrabold text-[#253a5a] transition-colors duration-300 font-['Figtree'] tracking-tight block">
                    {dept.name}
                  </span>
                  <span className="text-[10px] font-bold text-[#8db5c4] transition-colors duration-300 block">
                    {dept.count} Doctors
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Recent Consultations Table Card ─── */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#eaedf1]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[20px] font-semibold text-[#253a5a] font-['Figtree']">Recent Consultations</h3>
          <Link to="/appointments" className="text-xs font-bold text-[#36565F] hover:text-[#253a5a] hover:underline">View All</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#eaedf1] text-[10px] font-bold text-[#8db5c4] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Doctor</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pastAppointments.length > 0 ? (
                pastAppointments.slice(0, 3).map((appt, idx) => {
                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status === 'cancelled';
                  
                  let statusText = 'Scheduled';
                  let statusBg = '#EFF6FF';
                  let statusColor = '#3B82F6';
                  
                  if (isCompleted || new Date(appt.dateTime) < new Date()) {
                    statusText = 'Completed';
                    statusBg = '#ECFDF5';
                    statusColor = '#10B981';
                  } else if (isCancelled) {
                    statusText = 'Canceled';
                    statusBg = '#FEE2E2';
                    statusColor = '#EF4444';
                  }

                  return (
                    <tr key={appt._id || idx} className="text-xs text-slate-700 hover:bg-slate-50/50 transition-colors">
                      <td 
                        onClick={() => window.dispatchEvent(new CustomEvent('show-doctor-details', { 
                          detail: appt.doctorId || {
                            name: appt.doctor || 'Doctor',
                            specialty: appt.type || 'General Practitioner',
                            email: 'contact@healthsrinath.com'
                          } 
                        }))}
                        className="py-3.5 flex items-center gap-3 cursor-pointer hover:text-[#253a5a]"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-[10px] text-slate-500">
                          {appt.doctorId?.name ? appt.doctorId.name.charAt(0) : 'D'}
                        </div>
                        <span className="font-bold text-slate-800">
                          {(() => {
                            const n = appt.doctorId?.name || appt.doctor || 'Doctor';
                            return n.startsWith('Dr.') ? n : `Dr. ${n}`;
                          })()}
                        </span>
                      </td>
                      <td className="py-3.5 font-medium text-slate-600 capitalize">
                        {appt.type || 'General Consultation'}
                      </td>
                      <td className="py-3.5 text-slate-500 font-semibold">
                        {new Date(appt.dateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5">
                        <span 
                          className="px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider"
                          style={{ background: statusBg, color: statusColor }}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button 
                          onClick={() => navigate('/appointments')}
                          className="inline-flex items-center gap-1 text-[#36565F] hover:text-[#253a5a] font-bold transition-colors"
                        >
                          <FileText size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                    No past consultations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
