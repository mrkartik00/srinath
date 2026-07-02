import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookAppointment } from '../api/endpoints/appointment';
import { getMyProfile, createProfile, updateMyProfile } from '../api/endpoints/patient';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

const doctorImages = {
  'Dr. Arun Sharma': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&fit=crop',
  'Dr. Priya Mehta': 'https://images.unsplash.com/photo-1594824432258-f4633b4d4554?w=600&fit=crop',
};

const getFormattedTimings = (slots) => {
  if (!slots || slots.length === 0) return ['By Appointment Only'];
  const dayNamesMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Sort slots by day number
  const sorted = [...slots].sort((a, b) => a.day - b.day);

  // Group slots with the same timings
  const groups = {};
  sorted.forEach(s => {
    const key = `${s.startTime}-${s.endTime}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s.day);
  });

  const formattedLines = [];
  Object.entries(groups).forEach(([timeRange, days]) => {
    const [start, end] = timeRange.split('-');

    // Check if days form a continuous weekday range (Mon-Fri)
    const isMonFri = days.length === 5 && days.every(d => d >= 1 && d <= 5);
    if (isMonFri) {
      formattedLines.push(`Mon - Fri: ${start} - ${end}`);
    } else {
      const dayNames = days.map(d => dayNamesMap[d]).join(', ');
      formattedLines.push(`${dayNames}: ${start} - ${end}`);
    }
  });

  return formattedLines;
};

export default function BookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [surgeonsLoading, setSurgeonsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: '',
    gender: '',
    address: '',
    doctorId: location.state?.doctorId || '',
    dateTime: location.state?.dateTime || '',
    duration: 30,
    type: '',
    notes: ''
  });

  const handleNextStep = () => {
    if (!form.doctorId) return toast.error('Please select a doctor');
    if (!form.dateTime) return toast.error('Please select a date and time');
    setStep(2);
  };

  // Sync user info if user object loads late
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || '',
        email: f.email || user.email || '',
        phone: f.phone || user.phone || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/config/doctors').then((res) => {
        setDoctors(res.data || []);
      }),
      api.get('/api/v1/config/constants').then((res) => {
        const types = res.data?.appointmentTypes || [];
        setAppointmentTypes(types);
        if (types.length) setForm((f) => ({ ...f, type: types[0].value }));
      }),
      getMyProfile()
        .then((res) => {
          setHasProfile(true);
          if (res.data) {
            const profile = res.data;
            setForm((f) => ({
              ...f,
              dob: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : f.dob,
              gender: profile.gender || f.gender,
              address: profile.address?.street || f.address,
            }));
          }
        })
        .catch((err) => {
          if (err.response?.status === 404 || err.status === 404) {
            setHasProfile(false);
          }
        })
    ]).catch(() => toast.error('Could not load form data')).finally(() => setSurgeonsLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctorId) return toast.error('Please select a doctor');
    if (!form.dateTime) return toast.error('Please select a date and time');

    setLoading(true);
    try {
      if (!hasProfile) {
        // Auto-create profile if patient does not have one yet
        await createProfile({});
        setHasProfile(true);
      }

      // Sync patient profile details if provided
      if (form.dob || form.gender || form.address) {
        await updateMyProfile({
          dateOfBirth: form.dob || undefined,
          gender: form.gender || undefined,
          address: { street: form.address, city: '', state: '', zipCode: '' }
        }).catch(err => console.error("Profile sync failed", err));
      }

      // Format custom name/email/phone changes to append to doctor notes
      let notesToSend = form.notes;
      const changedName = form.name !== (user?.name || '');
      const changedEmail = form.email !== (user?.email || '');
      const changedPhone = form.phone !== (user?.phone || '');
      if (changedName || changedEmail || changedPhone) {
        notesToSend = `${notesToSend ? notesToSend + '\n\n' : ''}[Contact details provided in form]\n` +
          `Name: ${form.name}\n` +
          `Email: ${form.email}\n` +
          `Phone: ${form.phone}`;
      }

      await bookAppointment({
        doctorId: form.doctorId,
        dateTime: form.dateTime,
        duration: Number(form.duration),
        type: form.type,
        notes: notesToSend
      });

      toast.success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (err) {
      toast.error(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-transparent border-b border-[#E2E8F0] py-2 text-[15px] font-medium transition-all duration-200 focus:outline-none focus:border-[#36565F] placeholder:text-[#94a3b8] text-[#1e293b]";
  const selectClass = "w-full bg-transparent border-b border-[#E2E8F0] py-2 text-[15px] font-medium transition-all duration-200 focus:outline-none focus:border-[#36565F] text-[#1e293b] appearance-none cursor-pointer";
  const labelClass = "block text-[13px] font-semibold text-[#809196] mb-1 tracking-wide uppercase";

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23809196' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 4px center',
    backgroundSize: '16px',
    paddingRight: '24px'
  };

  const activeDoctor = doctors.find(d => d.id === form.doctorId);
  const doctorPhoto = activeDoctor ? (doctorImages[activeDoctor.name] || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&fit=crop') : null;

  return (
    <div className="w-full min-h-screen lg:h-screen lg:overflow-hidden flex flex-col justify-between bg-[#f0f4f8]">
      <div className="flex-grow flex items-center justify-center p-4 md:p-6 lg:px-8 lg:pb-8 pt-8 lg:pt-8 pb-4">
        {surgeonsLoading ? (
          <div className="py-12 flex justify-center w-full">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="max-w-[1280px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch h-full lg:max-h-[640px]">
            {/* Left Column: Doctor Profile & Contact Info */}
            <div className="hidden lg:flex lg:col-span-5 flex-col gap-4 lg:max-h-full lg:overflow-y-auto pr-1">
              {activeDoctor ? (
                <div className="bg-white rounded-3xl border border-[#eaedf1] shadow-sm p-6 flex flex-col justify-between gap-6 flex-grow">
                  <div className="space-y-5">
                    {/* Header info with photo */}
                    <div className="flex items-center gap-4">
                      <img
                        src={doctorPhoto}
                        alt={activeDoctor.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#e1eff2] shadow-sm shrink-0"
                      />
                      <div>
                        <h3 className="text-[17px] font-bold text-[#1a2b30] leading-snug">{activeDoctor.name}</h3>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#e1eff2] text-[#253a5a] text-[10px] font-bold mt-1">
                          {activeDoctor.specialty || 'General Physician'}
                        </span>
                        <p className="text-[11px] text-[#809196] mt-1 font-semibold">{activeDoctor.qualification}</p>
                      </div>
                    </div>

                    {/* Meta info grid */}
                    <div className="border-t border-[#eaedf1] pt-4 grid grid-cols-2 gap-y-3.5 gap-x-2 text-[13px] text-[#4a5568]">
                      <div>
                        <span className="block text-[10px] font-semibold text-[#809196] uppercase tracking-wide">Experience</span>
                        <span className="font-bold text-[#1e293b]">{activeDoctor.experience} years</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-[#809196] uppercase tracking-wide">Consultation Fee</span>
                        <span className="font-bold text-[#253a5a] text-[14px]">₹{activeDoctor.fee}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] font-semibold text-[#809196] uppercase tracking-wide">Clinic Location</span>
                        <span className="font-medium text-[#1e293b] block leading-tight">{activeDoctor.clinicName || 'SR+ Center'}</span>
                        <span className="text-[11px] text-[#809196] block mt-0.5">{activeDoctor.clinicAddress}</span>
                      </div>
                    </div>

                    {/* Available Timings */}
                    <div className="border-t border-[#eaedf1] pt-4">
                      <span className="block text-[10px] font-semibold text-[#809196] uppercase tracking-wide mb-2">Available Slots ({activeDoctor.timezone || 'Asia/Kolkata'})</span>
                      <div className="space-y-1.5">
                        {getFormattedTimings(activeDoctor.availableSlots).map((line, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[12px] text-[#4a5568] bg-[#f8fafc] border border-[#eaedf1] px-3 py-1.5 rounded-xl">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#809196" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span className="font-medium">{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* About paragraph at bottom */}
                  {activeDoctor.aboutMe && (
                    <div className="border-t border-[#eaedf1] pt-4">
                      <span className="block text-[10px] font-semibold text-[#809196] uppercase tracking-wide mb-1">About Doctor</span>
                      <p className="text-[12px] text-[#64748b] leading-relaxed italic">
                        "{activeDoctor.aboutMe}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#eaedf1] shadow-sm p-6 flex flex-col items-center justify-center text-center gap-4 py-12 flex-grow min-h-[300px]">
                  <div className="w-16 h-16 rounded-full bg-[#f0f4f8] flex items-center justify-center text-[#8db5c4]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1a2b30] mb-1">Select a Doctor</h3>
                    <p className="text-xs text-[#809196] max-w-[240px] mx-auto leading-relaxed">
                      Choose a specialist from the booking form to view their details, qualifications, experience, and consultation fee.
                    </p>
                  </div>
                </div>
              )}

              {/* Assistance helpline */}
              <div className="bg-[#253a5a] rounded-3xl p-6 text-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white mb-0.5">Need Booking Assistance?</h4>
                  <p className="text-[12px] text-[#94a3b8]">
                    Reach out to our support team through the <span className="text-white font-semibold">in-app Chat</span> for quick help.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Form Wizard */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#eaedf1] shadow-sm p-6 md:p-8 flex flex-col justify-between h-full lg:max-h-full lg:overflow-y-auto">
              <form onSubmit={handleSubmit} className="h-full flex flex-col justify-between gap-6">
                <div>
                  {/* Form Header & Step Tracker */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600 }} className="text-xl md:text-2xl text-[#1a2b30]">
                        Book Appointment
                      </h2>
                      <p style={{ fontFamily: "'Figtree', sans-serif" }} className="text-[11px] text-[#809196] font-medium leading-none mt-1">
                        Required fields are marked with *
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 1 ? 'bg-[#253a5a] text-white' : 'bg-[#e1eff2] text-[#253a5a]'}`}>1</div>
                      <div className="w-6 h-[2px] bg-[#eaedf1]" />
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 2 ? 'bg-[#253a5a] text-white' : 'bg-[#e1eff2] text-[#253a5a]'}`}>2</div>
                    </div>
                  </div>

                  {/* Step 1: Booking Details */}
                  {step === 1 && (
                    <div className="space-y-5 animate-fadeIn">
                      <div>
                        <label className={labelClass}>Select Doctor *</label>
                        <select
                          name="doctorId"
                          className={selectClass}
                          style={selectStyle}
                          value={form.doctorId}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Choose a doctor</option>
                          {doctors.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} — {s.specialty || s.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Date & Time *</label>
                        <input
                          type="datetime-local"
                          name="dateTime"
                          value={form.dateTime}
                          onChange={handleChange}
                          className={inputClass}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Type *</label>
                          <select
                            name="type"
                            className={selectClass}
                            style={selectStyle}
                            value={form.type}
                            onChange={handleChange}
                          >
                            {appointmentTypes.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Duration *</label>
                          <select
                            name="duration"
                            className={selectClass}
                            style={selectStyle}
                            value={form.duration}
                            onChange={handleChange}
                          >
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Patient Information */}
                  {step === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <label className={labelClass}>Full Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full bg-[#f8fafc] border border-[#eaedf1] rounded-xl px-4 py-2 text-[14px] font-medium transition-all focus:outline-none focus:border-[#36565F] placeholder:text-[#9ca3af] text-[#1e293b]"
                            placeholder="Enter your full name"
                            required
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Phone Number *</label>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="w-full bg-[#f8fafc] border border-[#eaedf1] rounded-xl px-4 py-2 text-[14px] font-medium transition-all focus:outline-none focus:border-[#36565F] placeholder:text-[#9ca3af] text-[#1e293b]"
                            placeholder="Enter your phone number"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className={labelClass}>Email Address *</label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full bg-[#f8fafc] border border-[#eaedf1] rounded-xl px-4 py-2 text-[14px] font-medium transition-all focus:outline-none focus:border-[#36565F] placeholder:text-[#9ca3af] text-[#1e293b]"
                            placeholder="Enter your email address"
                            required
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Date of Birth</label>
                          <input
                            type="date"
                            name="dob"
                            value={form.dob}
                            onChange={handleChange}
                            className="w-full bg-[#f8fafc] border border-[#eaedf1] rounded-xl px-4 py-2 text-[14px] font-medium transition-all focus:outline-none focus:border-[#36565F] placeholder:text-[#9ca3af] text-[#1e293b]"
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Gender</label>
                          <select
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                            className="w-full bg-[#f8fafc] border border-[#eaedf1] rounded-xl px-4 py-2 text-[14px] font-medium transition-all focus:outline-none focus:border-[#36565F] text-[#1e293b] appearance-none"
                            style={{ ...selectStyle, backgroundPosition: 'right 12px center' }}
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className={labelClass}>Address</label>
                          <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="w-full bg-[#f8fafc] border border-[#eaedf1] rounded-xl px-4 py-2 text-[14px] font-medium transition-all focus:outline-none focus:border-[#36565F] placeholder:text-[#9ca3af] text-[#1e293b]"
                            placeholder="Enter your address"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Additional Notes (Optional)</label>
                        <textarea
                          name="notes"
                          value={form.notes}
                          onChange={handleChange}
                          className="w-full bg-[#f8fafc] border border-[#eaedf1] rounded-xl px-4 py-2 text-[14px] font-medium transition-all focus:outline-none focus:border-[#36565F] placeholder:text-[#9ca3af] text-[#1e293b] resize-none"
                          rows={2}
                          placeholder="Write any notes for the doctor..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Wizard navigation buttons */}
                <div>
                  {step === 1 ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600 }}
                        className="w-full bg-[#253a5a] hover:bg-[#1e2e48] text-white py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm tracking-wide"
                      >
                        Continue to Patient Info
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600 }}
                        className="flex-1 bg-white hover:bg-gray-50 text-[#4a5568] border border-[#eaedf1] py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm tracking-wide"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="19" y1="12" x2="5" y2="12"></line>
                          <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Details
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600 }}
                        className="flex-1 bg-[#253a5a] hover:bg-[#1e2e48] text-white py-3.5 px-4 rounded-xl transition-all duration-200 transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Confirm Booking
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
