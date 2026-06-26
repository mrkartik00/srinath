import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../api/endpoints/patient';
import { getMyAppointments } from '../api/endpoints/appointment';
import api from '../api/axios';
import { Button, Input, Spinner } from '../components/ui';
import VIPPage from './VIP';
import PaymentsPage from './Payments';
import MyReminders from './MyReminders';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const getVitalStatusStyle = (valStr, type) => {
  if (!valStr) return { text: 'In the norm', class: 'text-[#2E7D32]' };
  if (type === 'heart') {
    const heartVal = parseInt(valStr);
    if (isNaN(heartVal)) return { text: 'In the norm', class: 'text-[#2E7D32]' };
    if (heartVal > 100 || heartVal < 60) return { text: 'Above the norm', class: 'text-[#C62828]' };
    return { text: 'In the norm', class: 'text-[#2E7D32]' };
  }
  if (type === 'glucose') {
    const glucoseVal = parseInt(valStr);
    if (isNaN(glucoseVal)) return { text: 'In the norm', class: 'text-[#2E7D32]' };
    if (glucoseVal > 125 || glucoseVal < 70) return { text: 'Above the norm', class: 'text-[#C62828]' };
    return { text: 'In the norm', class: 'text-[#2E7D32]' };
  }
  if (type === 'cholesterol') {
    const cholVal = parseInt(valStr);
    if (isNaN(cholVal)) return { text: 'In the norm', class: 'text-[#2E7D32]' };
    if (cholVal > 200) return { text: 'Above the norm', class: 'text-[#C62828]' };
    return { text: 'In the norm', class: 'text-[#2E7D32]' };
  }
  if (type === 'bp') {
    if (valStr.includes('/')) {
      const [sys, dia] = valStr.split('/').map(Number);
      if (!isNaN(sys) && !isNaN(dia)) {
        if (sys > 130 || dia > 85) return { text: 'Above the norm', class: 'text-[#C62828]' };
      }
    }
    return { text: 'In the norm', class: 'text-[#2E7D32]' };
  }
  return { text: 'In the norm', class: 'text-[#2E7D32]' };
};

function SidebarReminders({ navigate }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/my/reminders')
      .then((res) => {
        setReminders(res.data.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-4"><Spinner size="sm" /></div>;
  if (!reminders || reminders.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mb-6 pt-2 border-t border-[#E8E5DE]/50">
      <div className="flex justify-between items-center mb-1">
        <h5 className="text-xs font-bold text-[#253a5a] uppercase tracking-wider">Reminders</h5>
        <span className="w-5 h-5 rounded-full bg-[#E2F0F0] text-[#36565F] text-[10px] font-bold flex items-center justify-center">{reminders.length}</span>
      </div>
      
      {reminders.map((r, i) => {
        const isUrgent = i === 0;
        return (
          <div key={r._id} onClick={() => navigate('/reminders')} className={`${isUrgent ? 'bg-[#E2F0F0] border-[#8db5c4]' : 'bg-[#F8F6F0] border-[#E8E5DE]'} border rounded-xl p-3 flex gap-3 relative overflow-hidden group hover:shadow-sm transition-shadow cursor-pointer`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isUrgent ? 'bg-[#36565F]' : 'bg-[#36565F]/40'}`} />
            <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#36565F] flex-shrink-0 shadow-sm`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isUrgent ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                )}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#253a5a] truncate">{r.medicineName}</p>
              <p className={`text-[10px] font-semibold ${isUrgent ? 'text-[#36565F]' : 'text-[#5F8190]'} mt-0.5 truncate`}>
                {r.dosage} • {new Date(r.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Profile() {
  const selectClass = "w-full px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] text-sm transition-all duration-200 hover:border-[#36565F]/30 focus:outline-none focus:ring-2 focus:ring-[#36565F]/20 focus:border-[#36565F]";
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [genders, setGenders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const getInitialTab = () => {
    if (location.state?.activeTab) return location.state.activeTab;
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'profile';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    } else if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);
  
  const [profileData, setProfileData] = useState(null);
  const [form, setForm] = useState({
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    emergencyContact: { name: '', phone: '', relation: '' },
    allergies: '',
  });

  const [vitals, setVitals] = useState(() => {
    const saved = localStorage.getItem('patient_vitals');
    return saved ? JSON.parse(saved) : {
      bloodPressure: '120/89',
      heartRate: '120',
      glucose: '97',
      cholesterol: '85'
    };
  });

  const [vitalsForm, setVitalsForm] = useState({ ...vitals });

  // Detail Modal States for Mock Items
  const [selectedMockPrescription, setSelectedMockPrescription] = useState(null);
  const [selectedMockAppointment, setSelectedMockAppointment] = useState(null);

  // Chat System States
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [doctors, setDoctors] = useState([]);
  
  const socketRef = useRef(null);
  const activeIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Sync ref
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // Connect Socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => console.log('Profile Socket connected'));
    socket.on('connect_error', (err) => console.error('Profile Socket error:', err.message));

    socket.on('message:new', ({ message, conversationId }) => {
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => [...prev, message]);
        socket.emit('messages:read', conversationId);
      }
      fetchConversations();
    });

    socket.on('typing:indicator', ({ conversationId, isTyping: t }) => {
      if (conversationId === activeIdRef.current) setTyping(t);
    });

    socket.on('messages:read_receipt', ({ conversationId }) => {
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => prev.map((m) => m.senderId?._id === user?.id || m.senderId === user?.id ? { ...m, readAt: m.readAt || new Date().toISOString() } : m));
      }
    });

    socket.on('notification:message', () => fetchConversations());

    return () => { socket.disconnect(); };
  }, [user]);

  const fetchConversations = useCallback(() => {
    api.get('/api/v1/chat/conversations')
      .then((r) => setConversations(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchConversations();
      api.get('/api/v1/auth/doctors').then((r) => setDoctors(r.data || [])).catch(() => {});
    }
  }, [activeTab, fetchConversations]);

  const selectConversation = async (conv) => {
    if (activeIdRef.current) socketRef.current?.emit('conversation:leave', activeIdRef.current);
    setActiveId(conv._id);
    try {
      const res = await api.get(`/api/v1/chat/conversations/${conv._id}/messages`);
      setMessages(res.data || []);
      socketRef.current?.emit('conversation:join', conv._id);
      socketRef.current?.emit('messages:read', conv._id);
    } catch {}
  };

  const startConversation = async (doctorId) => {
    try {
      const res = await api.post('/api/v1/chat/conversations', { doctorId });
      fetchConversations();
      selectConversation(res.data);
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;
    socketRef.current?.emit('message:send', { conversationId: activeId, body: input.trim(), tempId: Date.now().toString() });
    setInput('');
    socketRef.current?.emit('typing:stop', activeId);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!activeId) return;
    socketRef.current?.emit('typing:start', activeId);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socketRef.current?.emit('typing:stop', activeId), 2000);
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Mock Data Sets
  const mockPrescriptions = [
    {
      _id: 'mock-rx-1',
      date: '20 Jan, 2023',
      doctor: 'Dr. Richa Linda',
      specialty: 'Cardiology',
      medications: 'Atorvastatin 10mg (once daily), CoQ10 100mg',
      notes: 'Take Atorvastatin before sleeping. Follow low-sodium diet and record vitals daily.',
      status: 'Active',
      statusClass: 'bg-[#FFF7ED] text-[#E65100] border-[#FED7AA]'
    },
    {
      _id: 'mock-rx-2',
      date: '12 Jan, 2022',
      doctor: 'Dr. David Vance',
      specialty: 'General Medicine',
      medications: 'Amoxicillin 500mg (thrice daily)',
      notes: 'Complete the full course of antibiotics even if feeling better.',
      status: 'Completed',
      statusClass: 'bg-[#ECFDF5] text-[#2E7D32] border-[#A7F3D0]'
    },
    {
      _id: 'mock-rx-3',
      date: '20 Jan, 2021',
      doctor: 'Dr. Sarah Jenkins',
      specialty: 'Infectious Diseases',
      medications: 'Paracetamol 650mg (every 6h as needed)',
      notes: 'Take for fever or pain. Do not exceed 4 tablets in 24 hours.',
      status: 'Completed',
      statusClass: 'bg-[#ECFDF5] text-[#2E7D32] border-[#A7F3D0]'
    }
  ];

  const mockAppointments = [
    {
      _id: 'mock-appt-1',
      date: '24 Jun, 2026',
      time: '10:30 AM',
      doctor: 'Dr. Richa Linda',
      specialty: 'Cardiology',
      notes: 'Cardiovascular checkup & ECG review.',
      status: 'scheduled',
      statusClass: 'bg-[#EEF6FF] text-[#1565C0] border-[#BFDBFE]'
    },
    {
      _id: 'mock-appt-2',
      date: '15 May, 2026',
      time: '02:15 PM',
      doctor: 'Dr. David Vance',
      specialty: 'General Medicine',
      notes: 'Annual physical examination and blood report review.',
      status: 'completed',
      statusClass: 'bg-[#ECFDF5] text-[#2E7D32] border-[#A7F3D0]'
    },
    {
      _id: 'mock-appt-3',
      date: '10 Apr, 2026',
      time: '09:00 AM',
      doctor: 'Dr. Sarah Jenkins',
      specialty: 'Infectious Diseases',
      notes: 'Follow-up consultation for viral fever.',
      status: 'cancelled',
      statusClass: 'bg-[#FEF2F2] text-[#C62828] border-[#FECACA]'
    }
  ];

  useEffect(() => {
    Promise.all([
      getMyProfile(),
      api.get('/api/v1/config/constants'),
      getMyAppointments({ limit: 50 }).catch(() => ({ data: [] })),
      api.get('/api/v1/my/prescriptions').catch(() => ({ data: [] }))
    ])
      .then(([profileRes, configRes, appointmentsRes, prescriptionsRes]) => {
        const p = profileRes.data;
        setProfileData(p);
        setForm({
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
          gender: p.gender || '',
          bloodGroup: p.bloodGroup || '',
          address: p.address || { street: '', city: '', state: '', zipCode: '' },
          emergencyContact: p.emergencyContact || { name: '', phone: '', relation: '' },
          allergies: p.allergies?.join(', ') || '',
        });
        setBloodGroups(configRes.data?.bloodGroups || []);
        setGenders(configRes.data?.genders || []);
        
        if (appointmentsRes && appointmentsRes.data) {
          setAppointments(appointmentsRes.data);
        }
        if (prescriptionsRes && prescriptionsRes.data) {
          setPrescriptions(prescriptionsRes.data);
        }
      })
      .catch((err) => {
        toast.error('Failed to load profile details');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter((p) => p && p.trim() !== '');
    return parts.join(', ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleEditClick = () => {
    setVitalsForm({ ...vitals });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setForm({
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: profileData.gender || '',
        bloodGroup: profileData.bloodGroup || '',
        address: profileData.address || { street: '', city: '', state: '', zipCode: '' },
        emergencyContact: profileData.emergencyContact || { name: '', phone: '', relation: '' },
        allergies: profileData.allergies?.join(', ') || '',
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedForm = {
        ...form,
        allergies: form.allergies ? form.allergies.split(',').map((a) => a.trim()).filter(Boolean) : []
      };
      const res = await updateMyProfile(updatedForm);
      setProfileData(res.data);
      
      localStorage.setItem('patient_vitals', JSON.stringify(vitalsForm));
      setVitals(vitalsForm);
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePrescriptionClick = (rx) => {
    if (rx._id.startsWith('mock-')) {
      setSelectedMockPrescription(rx);
    } else {
      navigate(`/prescriptions/${rx._id}`);
    }
  };

  const handleAppointmentClick = (appt) => {
    if (appt._id.startsWith('mock-')) {
      setSelectedMockAppointment(appt);
    } else {
      navigate(`/appointments/${appt._id}`);
    }
  };

  const formattedInitials = profileData?.userId?.name
    ? profileData.userId.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PT';

  const age = calculateAge(profileData?.dateOfBirth);

  const rxList = prescriptions.length > 0 ? prescriptions : mockPrescriptions;
  const apptList = appointments.length > 0 ? appointments : mockAppointments;

  const bpStatus = getVitalStatusStyle(vitals.bloodPressure, 'bp');
  const hrStatus = getVitalStatusStyle(vitals.heartRate, 'heart');
  const glucStatus = getVitalStatusStyle(vitals.glucose, 'glucose');
  const cholStatus = getVitalStatusStyle(vitals.cholesterol, 'cholesterol');

  // Sidebar navigation options
  const sidebarTabs = [
    {
      id: 'profile',
      label: 'Patient',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      )
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      )
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.093.81.22 1.668.343 2.555.343z" />
        </svg>
      )
    },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'vip',
      label: 'VIP Membership',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-1.28.347v.14a.563.563 0 001.28.347l4.204 3.602c.38.325.178.948-.321.988l-5.518.442a.563.563 0 00-.475.345l-2.125 5.111a.562.562 0 01-1.04 0l-2.125-5.111a.563.563 0 00-.475-.345l-5.518-.442c-.499-.04-.701-.663-.321-.988l4.204-3.602a.563.563 0 00.182-.557l-1.285-5.385a.562.562 0 01.84-.61l4.925 2.89a.563.563 0 00.52 0l4.925-2.89a.562.562 0 01.84.61l-1.285 5.385z" />
        </svg>
      )
    },
    {
      id: 'billing',
      label: 'Payments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      )
    }
  ];

  const activeConv = conversations.find((c) => c._id === activeId);

  return (
    <div className="bg-[#f0f4f8] min-h-screen pt-[84px] md:pt-[96px] pb-10" style={{ boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 w-full" style={{ boxSizing: 'border-box' }}>
      

      {/* ═══════════════════════════════════════════════ */}
      {/* MAIN TWO-COLUMN LAYOUT                          */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ─────────────────────────────────────────────── */}
        {/* LEFT COLUMN: SIDEBAR CARD (Patient Specific)    */}
        {/* ─────────────────────────────────────────────── */}
        <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
          <div className="bg-white border border-[#E8E5DE]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(54,86,95,0.03)] flex flex-col min-h-[620px]">
            
            {/* Top: Patient Card (Display Patient initials and name) */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-[#E8E5DE]/50">
              <div className="w-24 h-24 rounded-full bg-[#E2F0F0] flex items-center justify-center text-3xl font-extrabold text-[#36565F] border-4 border-white shadow-md relative overflow-hidden mb-4">
                {formattedInitials}
              </div>
              <h4 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-lg font-bold text-[#253a5a] tracking-tight text-center truncate max-w-full">
                {profileData?.userId?.name}
              </h4>
              <p className="text-xs text-[#6B7C84] mt-1 font-medium text-center truncate max-w-full">
                {profileData?.userId?.email}
              </p>
              <span className="bg-[#E2F0F0] text-[#36565F] text-[10px] font-bold rounded-md px-2.5 py-0.5 mt-2 uppercase tracking-wide">
                Patient Member
              </span>
            </div>

            {/* Middle: Tab Navigation list */}
            <div className="flex flex-col py-6 gap-1 flex-1">
              {sidebarTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsEditing(false);
                    }}
                    className={`relative flex items-center gap-3.5 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
                      isActive 
                        ? 'text-[#36565F] bg-[#E2F0F0]/60' 
                        : 'text-[#6B7C84] hover:text-[#36565F] hover:bg-[#F8F6F0]/20'
                    }`}
                  >
                    {/* Active vertical line overlay on the left */}
                    {isActive && (
                      <div className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-[#36565F] rounded-r-md" />
                    )}
                    <span className={isActive ? 'text-[#36565F]' : 'text-[#6B7C84]'}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Reminders Widget */}
            <SidebarReminders navigate={navigate} />

            {/* Bottom: membership promotion card */}
            <div className="bg-[#1a2332] text-white rounded-2xl p-5 relative overflow-hidden shadow-md mt-auto">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full border border-white/10 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <p className="text-lg font-bold mb-0.5">20 Days Left</p>
                <p className="text-[11px] text-white/60 mb-4">Extend your membership</p>
                <button 
                  onClick={() => toast.success('Membership extended (simulation)')}
                  className="bg-white hover:bg-gray-50 text-[#1a2332] text-xs font-bold rounded-full px-5 py-2 transition-colors focus:outline-none shadow-sm"
                >
                  Check Now
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: CONTENT CONTAINER                 */}
        {/* ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-8 w-full">
          
          {/* TAB 1: PROFILE AND PERSONAL PARTICULARS DETAILS */}
          {activeTab === 'profile' && (
            <>
              {/* Profile Details Form Card */}
              <div className="bg-white rounded-[24px] border border-[#E8E5DE]/60 p-8 shadow-[0_4px_20px_rgba(54,86,95,0.03)]">
                
                {/* Header of right card (Clean section header) */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E8E5DE]/45">
                  <div>
                    <h3 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-xl font-bold text-[#253a5a]">
                      Profile Particulars
                    </h3>
                    <p className="text-xs text-[#6B7C84] mt-0.5">Review and manage your personal medical records and contact details.</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={handleEditClick}
                      className="border border-[#36565F]/80 text-[#36565F] hover:bg-[#36565F] hover:text-white rounded-full px-6 py-2 transition-all duration-200 text-sm font-semibold shadow-xs focus:outline-none"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  /* Form Fields Edit Mode */
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <Input 
                        label="Date of Birth" 
                        type="date" 
                        value={form.dateOfBirth} 
                        onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} 
                      />
                      <div>
                        <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Gender</label>
                        <select 
                          className={selectClass} 
                          value={form.gender} 
                          onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        >
                          <option value="">Select</option>
                          {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Blood Group</label>
                        <select 
                          className={selectClass} 
                          value={form.bloodGroup} 
                          onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                        >
                          <option value="">Select</option>
                          {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-[#E8E5DE]/45 pt-5">
                      <h5 className="text-[12px] font-bold text-[#36565F] uppercase tracking-wider mb-4">Residential Address</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                          label="Street Address" 
                          value={form.address.street} 
                          onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} 
                        />
                        <Input 
                          label="City" 
                          value={form.address.city} 
                          onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} 
                        />
                        <Input 
                          label="State" 
                          value={form.address.state} 
                          onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} 
                        />
                        <Input 
                          label="Zip Code" 
                          value={form.address.zipCode} 
                          onChange={(e) => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} 
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#E8E5DE]/45 pt-5">
                      <h5 className="text-[12px] font-bold text-[#36565F] uppercase tracking-wider mb-4">Emergency Contact</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input 
                          label="Contact Name" 
                          value={form.emergencyContact.name} 
                          onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} 
                        />
                        <Input 
                          label="Contact Phone" 
                          value={form.emergencyContact.phone} 
                          onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} 
                        />
                        <Input 
                          label="Relation" 
                          value={form.emergencyContact.relation} 
                          onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relation: e.target.value } })} 
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#E8E5DE]/45 pt-5">
                      <h5 className="text-[12px] font-bold text-[#36565F] uppercase tracking-wider mb-4">Vitals Logger</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Input 
                          label="Blood Pressure" 
                          value={vitalsForm.bloodPressure} 
                          onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })} 
                        />
                        <Input 
                          label="Heart Rate" 
                          value={vitalsForm.heartRate} 
                          onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })} 
                        />
                        <Input 
                          label="Glucose" 
                          value={vitalsForm.glucose} 
                          onChange={(e) => setVitalsForm({ ...vitalsForm, glucose: e.target.value })} 
                        />
                        <Input 
                          label="Cholesterol" 
                          value={vitalsForm.cholesterol} 
                          onChange={(e) => setVitalsForm({ ...vitalsForm, cholesterol: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#E8E5DE]/45 pt-5">
                      <h5 className="text-[12px] font-bold text-[#36565F] uppercase tracking-wider mb-4">Medical Notes</h5>
                      <Input 
                        label="Allergies (comma-separated)" 
                        value={form.allergies} 
                        onChange={(e) => setForm({ ...form, allergies: e.target.value })} 
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-5 border-t border-[#E8E5DE]/45">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="border border-[#E8E5DE] hover:bg-[#F8F6F0] text-[#6B7C84] rounded-full px-6 py-2 transition-colors text-sm font-semibold focus:outline-none"
                      >
                        Cancel
                      </button>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="rounded-full px-8 py-2 bg-[#36565F] text-white hover:bg-[#253F47] text-sm font-semibold transition-colors focus:outline-none"
                      >
                        {saving ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Display Particulars (filled and unfilled left blank) */
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                    <div>
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Sex</p>
                      <p className={`text-sm font-semibold ${profileData?.gender ? 'text-[#253a5a]' : 'text-[#6B7C84]/40'}`}>
                        {profileData?.gender || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Age</p>
                      <p className={`text-sm font-semibold ${age !== null ? 'text-[#253a5a]' : 'text-[#6B7C84]/40'}`}>
                        {age !== null ? age : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Blood Group</p>
                      <p className={`text-sm font-semibold ${profileData?.bloodGroup ? 'text-[#253a5a]' : 'text-[#6B7C84]/40'}`}>
                        {profileData?.bloodGroup || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Status</p>
                      <p className="text-sm font-semibold text-[#2E7D32]">Active</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Emergency Contact</p>
                      <p className={`text-sm font-semibold ${profileData?.emergencyContact?.name ? 'text-[#253a5a]' : 'text-[#6B7C84]/40'}`}>
                        {profileData?.emergencyContact?.name 
                          ? `${profileData.emergencyContact.name} (${profileData.emergencyContact.relation || 'Relation'})` 
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Emergency Phone</p>
                      <p className={`text-sm font-semibold ${profileData?.emergencyContact?.phone ? 'text-[#253a5a]' : 'text-[#6B7C84]/40'}`}>
                        {profileData?.emergencyContact?.phone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Registered Date</p>
                      <p className="text-sm font-semibold text-[#253a5a]">{formatDate(profileData?.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Total Appointments</p>
                      <p className="text-sm font-semibold text-[#253a5a]">{appointments.length}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Date of Birth</p>
                      <p className={`text-sm font-semibold ${profileData?.dateOfBirth ? 'text-[#253a5a]' : 'text-[#6B7C84]/40'}`}>
                        {profileData?.dateOfBirth ? formatDate(profileData.dateOfBirth) : '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Allergies</p>
                      <p className={`text-sm font-semibold truncate ${profileData?.allergies?.length > 0 ? 'text-[#253a5a]' : 'text-[#6B7C84]/40'}`}>
                        {profileData?.allergies?.length > 0 ? profileData.allergies.join(', ') : '—'}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider mb-0.5">Residential Address</p>
                      <p className={`text-sm font-semibold ${formatAddress(profileData?.address) ? 'text-[#253a5a]' : 'text-[#6B7C84]/40'}`}>
                        {formatAddress(profileData?.address) || '—'}
                      </p>
                    </div>
                  </div>
                )}

              </div>



              {/* Prescriptions Section (replacing History) */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-lg font-bold text-[#253a5a]">
                    Prescriptions
                  </h3>
                  <p className="text-xs font-semibold text-[#6B7C84]">
                    Total {rxList.length} Prescriptions
                  </p>
                </div>

                <div className="bg-white rounded-[20px] border border-[#E8E5DE]/60 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F8F6F0]/90 border-b border-[#E8E5DE]/50">
                          <th className="py-3.5 px-6 text-[11px] font-semibold text-[#6B7C84] uppercase tracking-wider">Date Issued</th>
                          <th className="py-3.5 px-6 text-[11px] font-semibold text-[#6B7C84] uppercase tracking-wider">Doctor</th>
                          <th className="py-3.5 px-6 text-[11px] font-semibold text-[#6B7C84] uppercase tracking-wider">Medications</th>
                          <th className="py-3.5 px-6 text-[11px] font-semibold text-[#6B7C84] uppercase tracking-wider text-center">Status</th>
                          <th className="py-3.5 px-6 text-[11px] font-semibold text-[#6B7C84] uppercase tracking-wider text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E5DE]/40">
                        {rxList.map((rx, idx) => (
                          <tr 
                            key={rx._id || idx} 
                            onClick={() => handlePrescriptionClick(rx)}
                            className="hover:bg-[#F8F6F0]/30 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-6 text-sm font-medium text-[#253a5a]">
                              {rx.date ? (typeof rx.date === 'string' ? rx.date : formatDate(rx.date)) : ''}
                            </td>
                            <td className="py-3.5 px-6 text-sm font-bold text-[#253a5a]">
                              {rx.doctor || rx.doctorId?.name || 'Doctor'}
                            </td>
                            <td className="py-3.5 px-6 text-sm text-[#6B7C84] truncate max-w-xs">
                              {rx.medications || rx.medicines?.map((med) => `${med.name} (${med.dosage})`).join(', ') || 'N/A'}
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${rx.status === 'Active' ? 'bg-[#FFF7ED] text-[#E65100] border-[#FED7AA]' : 'bg-[#ECFDF5] text-[#2E7D32] border-[#A7F3D0]'}`}>
                                {rx.status || 'Active'}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => rx._id.startsWith('mock-') ? toast.success(`Mock download for ${rx.doctor} prescription PDF`) : downloadPdf(rx._id)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#253a5a] hover:text-[#36565F] transition-colors focus:outline-none"
                              >
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: SCHEDULE (APPOINTMENTS LIST) */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-[24px] border border-[#E8E5DE]/60 p-8 shadow-[0_4px_20px_rgba(54,86,95,0.03)] flex flex-col gap-6">
              <div>
                <h3 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-xl font-bold text-[#253a5a] mb-1">
                  My Appointment Schedule
                </h3>
                <p className="text-sm text-[#6B7C84]">View and manage all your scheduled appointments and clinical visits.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {apptList.map((appt, idx) => {
                  let formattedDate = appt.date;
                  let formattedTime = appt.time;
                  let docName = appt.doctor;
                  let docNotes = appt.notes;
                  
                  if (!appt._id.startsWith('mock-')) {
                    const apptDate = new Date(appt.dateTime);
                    formattedDate = apptDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    formattedTime = apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    docName = appt.doctorId?.name || 'General Doctor';
                    docNotes = appt.notes || appt.type || 'General Consultation';
                  }
                  
                  const statusConfig = {
                    scheduled: 'bg-[#EEF6FF] text-[#1565C0] border-[#BFDBFE]',
                    completed: 'bg-[#ECFDF5] text-[#2E7D32] border-[#A7F3D0]',
                    cancelled: 'bg-[#FEF2F2] text-[#C62828] border-[#FECACA]',
                    no_show: 'bg-[#FFF7ED] text-[#E65100] border-[#FED7AA]'
                  };

                  return (
                    <div 
                      key={appt._id || idx} 
                      onClick={() => handleAppointmentClick(appt)}
                      className="p-5 border border-[#E8E5DE]/60 hover:border-[#36565F]/35 rounded-[18px] bg-[#F8FAF6]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-xs cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#E2F0F0] flex items-center justify-center text-xl text-[#36565F] flex-shrink-0">
                          📅
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#253a5a]">{formattedDate} {formattedTime ? `at ${formattedTime}` : ''}</p>
                          <p className="text-xs font-semibold text-[#6B7C84] mt-0.5">Doctor: {docName}</p>
                          <p className="text-xs text-[#6B7C84]/80 mt-1">Reason: {docNotes}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusConfig[appt.status] || 'bg-[#F8F6F0]'}`}>
                          {appt.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PRESCRIPTIONS LIST TAB */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white rounded-[24px] border border-[#E8E5DE]/60 p-8 shadow-[0_4px_20px_rgba(54,86,95,0.03)] flex flex-col gap-6">
              <div>
                <h3 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-xl font-bold text-[#253a5a] mb-1">
                  My Medical Prescriptions
                </h3>
                <p className="text-sm text-[#6B7C84]">Detailed record of all active, past, and pending medications prescribed by doctors.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {rxList.map((rx, idx) => {
                  let issuedDate = rx.date ? (typeof rx.date === 'string' ? rx.date : formatDate(rx.date)) : '';
                  let doctorName = rx.doctor || rx.doctorId?.name || 'Primary Care';
                  let notesVal = rx.notes;
                  
                  return (
                    <div 
                      key={rx._id || idx} 
                      onClick={() => handlePrescriptionClick(rx)}
                      className="p-6 border border-[#E8E5DE]/60 hover:border-[#36565F]/35 rounded-[20px] bg-[#F8FAF6]/40 flex flex-col gap-4 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-[#253a5a]">Prescribed on {issuedDate}</p>
                          <p className="text-xs font-semibold text-[#6B7C84] mt-0.5">By {doctorName}</p>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            rx._id.startsWith('mock-') ? toast.success(`Mock download for ${doctorName} prescription PDF`) : downloadPdf(rx._id); 
                          }}
                          className="bg-[#36565F] hover:bg-[#253F47] text-white text-xs font-semibold rounded-full px-5 py-2 transition-colors focus:outline-none"
                        >
                          Download PDF
                        </button>
                      </div>

                      {notesVal && (
                        <div className="bg-[#E2F0F0]/40 p-3 rounded-lg border border-[#36565F]/10">
                          <p className="text-xs font-semibold text-[#36565F] uppercase mb-0.5">Clinical Notes</p>
                          <p className="text-xs text-[#253a5a]">{notesVal}</p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <p className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider">Medicines Dosage Detail</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {rx.medicines ? (
                            rx.medicines.map((med, medIdx) => (
                              <div key={medIdx} className="bg-white border border-[#E8E5DE]/60 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-[#253a5a]">{med.name}</p>
                                  <p className="text-xs text-[#6B7C84] mt-0.5">Dosage: {med.dosage} | Freq: {med.frequency?.replace('_', ' ')}</p>
                                </div>
                                <span className="text-[11px] font-bold text-[#36565F] bg-[#E2F0F0] px-2.5 py-1 rounded-md">
                                  {med.duration}
                                </span>
                              </div>
                            ))
                          ) : (
                            /* Split medications string for mock items */
                            rx.medications.split(',').map((medStr, medIdx) => (
                              <div key={medIdx} className="bg-white border border-[#E8E5DE]/60 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-[#253a5a]">{medStr.trim().split(' ')[0]}</p>
                                  <p className="text-xs text-[#6B7C84] mt-0.5">{medStr.trim()}</p>
                                </div>
                                <span className="text-[11px] font-bold text-[#36565F] bg-[#E2F0F0] px-2.5 py-1 rounded-md">
                                  30 days
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: REDESIGNED CHAT VIEW SYSTEM */}
          {activeTab === 'chat' && (
            <div className="bg-white rounded-[24px] border border-[#E8E5DE]/60 overflow-hidden shadow-[0_4px_20px_rgba(54,86,95,0.03)] flex h-[calc(100vh-240px)] min-h-[680px]">
              
              {/* Messages Sidebar (History List) */}
              <div className="w-72 border-r border-[#E8E5DE]/70 flex flex-col flex-shrink-0 bg-white">
                <div className="p-5 border-b border-[#E8E5DE]/60">
                  <div className="flex justify-between items-center mb-3">
                    <h4 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-base font-bold text-[#253a5a]">
                      Messages
                    </h4>
                    <button className="text-[#6B7C84] hover:text-[#36565F] transition-colors focus:outline-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                  {/* Doctor Selector Dropdown */}
                  <select 
                    onChange={(e) => e.target.value && startConversation(e.target.value)} 
                    className="w-full text-xs font-semibold px-3 py-2 border border-[#E8E5DE] rounded-xl text-[#253a5a] bg-[#F8F6F0]/20 hover:border-[#36565F]/40 focus:outline-none transition-all"
                    defaultValue=""
                  >
                    <option value="">+ Start Chat with Doctor...</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-[#E8E5DE]/30">
                  {conversations.map((c) => {
                    const isSelected = activeId === c._id;
                    const docInitials = c.doctorId?.name
                      ? c.doctorId.name.split(' ').map((n) => n[0]).join('').toUpperCase()
                      : 'DR';
                    return (
                      <div 
                        key={c._id} 
                        onClick={() => selectConversation(c)}
                        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors relative hover:bg-[#F8F6F0]/20 ${
                          isSelected ? 'bg-[#F8F6F0]/50' : ''
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E56B55]" />
                        )}
                        <div className="w-10 h-10 rounded-full bg-[#E2F0F0] flex items-center justify-center text-xs font-bold text-[#36565F] border border-white shadow-xs flex-shrink-0">
                          {docInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-[#253a5a] truncate">{c.doctorId?.name || 'Doctor'}</p>
                            <span className="text-[9px] text-[#6B7C84]">1 min ago</span>
                          </div>
                          <p className="text-[11px] text-[#6B7C84] truncate mt-0.5">
                            {c.lastMessagePreview || 'No messages yet...'}
                          </p>
                        </div>
                        {c.unreadByPatient > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#E56B55] text-white text-[9px] font-bold flex items-center justify-center">
                            {c.unreadByPatient}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {conversations.length === 0 && (
                    <div className="p-8 text-center text-xs text-[#6B7C84]">
                      No chat logs yet. Choose a doctor from the selector dropdown to start!
                    </div>
                  )}
                </div>
              </div>

              {/* Active Messaging Thread */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAF6]/10">
                {!activeConv ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <span className="text-4xl mb-3">💬</span>
                    <h4 className="text-sm font-bold text-[#253a5a] mb-1">My Secure Conversations</h4>
                    <p className="text-xs text-[#6B7C84] max-w-xs">Select a conversation or start a new chat with a doctor above.</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-[#E8E5DE]/60 bg-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E2F0F0] flex items-center justify-center text-xs font-bold text-[#36565F] border border-white shadow-xs">
                          {activeConv.doctorId?.name ? activeConv.doctorId.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'DR'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#253a5a]">{activeConv.doctorId?.name}</p>
                          <p className="text-[10px] text-[#2E7D32] font-semibold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] inline-block" /> Online
                          </p>
                        </div>
                      </div>

                      {/* Mock header icons */}
                      <div className="flex items-center gap-3 text-[#6B7C84]">
                        <button className="hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-sm">📹</span></button>
                        <button className="hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-sm">📞</span></button>
                        <button className="hover:text-[#36565F] transition-colors focus:outline-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                        <button className="hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-xs">⋮</span></button>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                      {messages.map((m) => {
                        const isMine = (m.senderId?._id || m.senderId) === (user?._id || user?.id);
                        const senderInitials = isMine ? formattedInitials : (activeConv.doctorId?.name ? activeConv.doctorId.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'DR');
                        
                        return (
                          <div key={m._id} className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {!isMine && (
                              <div className="w-7 h-7 rounded-full bg-[#E2F0F0] text-[10px] font-bold text-[#36565F] border border-white flex items-center justify-center flex-shrink-0">
                                {senderInitials}
                              </div>
                            )}

                            <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                              <div className={`px-4 py-2.5 rounded-[18px] text-sm shadow-xs ${
                                isMine 
                                  ? 'bg-[#E2F0F0] text-[#36565F] rounded-br-none border border-[#36565F]/10' 
                                  : 'bg-white text-[#253a5a] rounded-bl-none border border-[#E8E5DE]'
                              }`}>
                                <p className="leading-relaxed text-[13px]">{m.body}</p>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 px-1">
                                <span className="text-[9px] text-[#6B7C84]">
                                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMine && (
                                  <span className={`text-[9px] font-bold ${m.readAt ? 'text-[#36565F]' : 'text-[#6B7C84]/65'}`}>
                                    {m.readAt ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isMine && (
                              <div className="w-7 h-7 rounded-full bg-[#36565F]/10 text-[10px] font-bold text-[#36565F] border border-white flex items-center justify-center flex-shrink-0">
                                {senderInitials}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {typing && <p className="text-[11px] text-[#6B7C84] italic">Doctor is typing...</p>}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Messages Input Footer */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-[#E8E5DE]/60 bg-white flex gap-3 items-center">
                      <button type="button" className="text-[#6B7C84] hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-base">😊</span></button>
                      <button type="button" className="text-[#6B7C84] hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-base">📎</span></button>
                      
                      <input 
                        value={input} 
                        onChange={handleTyping} 
                        placeholder="Type your message..." 
                        className="flex-1 px-4 py-2 border border-[#E8E5DE]/70 rounded-full text-xs focus:outline-none focus:border-[#36565F] placeholder:text-[#6B7C84]/50" 
                      />
                      
                      <button type="button" className="text-[#6B7C84] hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-base">🎤</span></button>
                      <button 
                        type="submit"
                        className="bg-[#36565F] hover:bg-[#253F47] text-white text-xs font-bold rounded-full px-5 py-2.5 flex items-center gap-1.5 transition-colors focus:outline-none shadow-xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        Send
                      </button>
                    </form>
                  </>
                )}
              </div>

            </div>
          )}

          {/* TAB 5.5: REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="w-full animate-in fade-in duration-300">
              <MyReminders />
            </div>
          )}

          {/* TAB 6: VIP MEMBERSHIP */}
          {activeTab === 'vip' && (
            <div className="w-full animate-in fade-in duration-300">
              <VIPPage />
            </div>
          )}

          {/* TAB 7: PAYMENTS & BILLING */}
          {activeTab === 'billing' && (
            <div className="w-full animate-in fade-in duration-300">
              <PaymentsPage />
            </div>
          )}

        </div>
        
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* DETAILS MODAL: MOCK PRESCRIPTION DETAILS        */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedMockPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] border border-[#E8E5DE] shadow-2xl max-w-lg w-full relative animate-in fade-in duration-200 p-8">
            <button 
              onClick={() => setSelectedMockPrescription(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#E8E5DE]/80 hover:bg-[#F8F6F0] flex items-center justify-center text-[#6B7C84] transition-colors"
            >
              ✕
            </button>
            <h3 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-xl font-bold text-[#253a5a] mb-2">
              Prescription Details (Sample)
            </h3>
            <p className="text-xs text-[#6B7C84] mb-6">Issued on {selectedMockPrescription.date}</p>
            
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider">Prescribing Doctor</span>
                <p className="text-sm font-bold text-[#253a5a] mt-0.5">{selectedMockPrescription.doctor} ({selectedMockPrescription.specialty})</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider">Medications Prescribed</span>
                <p className="text-sm font-semibold text-[#253a5a] mt-0.5">{selectedMockPrescription.medications}</p>
              </div>
              <div className="bg-[#E2F0F0]/40 p-4 rounded-xl border border-[#36565F]/10">
                <span className="text-[11px] font-bold text-[#36565F] uppercase tracking-wider">Dosage Instructions</span>
                <p className="text-xs text-[#253a5a] mt-1 leading-relaxed">{selectedMockPrescription.notes}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider">Prescription Status</span>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${selectedMockPrescription.statusClass}`}>
                    {selectedMockPrescription.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* DETAILS MODAL: MOCK APPOINTMENT DETAILS         */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedMockAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] border border-[#E8E5DE] shadow-2xl max-w-lg w-full relative animate-in fade-in duration-200 p-8">
            <button 
              onClick={() => setSelectedMockAppointment(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#E8E5DE]/80 hover:bg-[#F8F6F0] flex items-center justify-center text-[#6B7C84] transition-colors"
            >
              ✕
            </button>
            <h3 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-xl font-bold text-[#253a5a] mb-2">
              Appointment Details (Sample)
            </h3>
            <p className="text-xs text-[#6B7C84] mb-6">Scheduled Date & Time</p>
            
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider">Appointment Date & Time</span>
                <p className="text-sm font-bold text-[#253a5a] mt-0.5">{selectedMockAppointment.date} at {selectedMockAppointment.time}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider">Assigned Doctor</span>
                <p className="text-sm font-bold text-[#253a5a] mt-0.5">{selectedMockAppointment.doctor} ({selectedMockAppointment.specialty})</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider">Consultation Details & Notes</span>
                <p className="text-xs text-[#253a5a] mt-1 leading-relaxed">{selectedMockAppointment.notes}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#6B7C84] uppercase tracking-wider">Appointment Status</span>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border uppercase ${selectedMockAppointment.statusClass}`}>
                    {selectedMockAppointment.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
