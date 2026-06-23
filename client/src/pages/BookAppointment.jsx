import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookAppointment } from '../api/endpoints/appointment';
import { getDoctors } from '../api/endpoints/auth';
import { getMyProfile, createProfile } from '../api/endpoints/patient';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import Navbar from '../components/home/Navbar';
import Footer from '../components/home/Footer';
import HealthcareDepartments from '../components/home/HealthcareDepartments';
import QuickFindSection from '../components/home/QuickFindSection';

function DNAPattern() {
  const points = [];
  const amplitude = 28;
  const frequency = 0.03;
  for (let y = 0; y <= 400; y += 20) {
    const x1 = 150 + Math.sin(y * frequency) * amplitude;
    const x2 = 150 - Math.sin(y * frequency) * amplitude;
    points.push({ y, x1, x2 });
  }

  return (
    <svg 
      className="absolute right-0 top-0 h-full w-[40%] opacity-[0.25] pointer-events-none text-white hidden lg:block"
      viewBox="0 0 300 400"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="dna-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {points.map((pt, i) => (
        <line 
          key={`l-${i}`}
          x1={pt.x1} 
          y1={pt.y} 
          x2={pt.x2} 
          y2={pt.y} 
          stroke="url(#dna-grad)" 
          strokeWidth="1.5" 
          opacity={0.5}
        />
      ))}
      <path 
        d={`M ${points[0].x1} ${points[0].y} ${points.slice(1).map(pt => `L ${pt.x1} ${pt.y}`).join(' ')}`} 
        fill="none" 
        stroke="url(#dna-grad)" 
        strokeWidth="3" 
      />
      <path 
        d={`M ${points[0].x2} ${points[0].y} ${points.slice(1).map(pt => `L ${pt.x2} ${pt.y}`).join(' ')}`} 
        fill="none" 
        stroke="url(#dna-grad)" 
        strokeWidth="3" 
      />
      {points.map((pt, i) => (
        <g key={`n-${i}`}>
          <circle cx={pt.x1} cy={pt.y} r="4" fill="#ffffff" />
          <circle cx={pt.x2} cy={pt.y} r="4" fill="#ffffff" />
        </g>
      ))}
    </svg>
  );
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [surgeonsLoading, setSurgeonsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  
  const marqueeRef = useRef(null);

  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    let animId;
    let pos = 0;
    const speed = 0.5;
    const animate = () => {
      pos -= speed;
      if (Math.abs(pos) >= el.scrollWidth / 3) {
        pos = 0;
      }
      el.style.transform = `translateX(${pos}px)`;
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    doctorId: '',
    dateTime: '',
    duration: 30,
    type: '',
    notes: ''
  });

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
      getDoctors().then((res) => setDoctors(res.data || [])),
      api.get('/api/v1/config/constants').then((res) => {
        const types = res.data?.appointmentTypes || [];
        setAppointmentTypes(types);
        if (types.length) setForm((f) => ({ ...f, type: types[0].value }));
      }),
      getMyProfile()
        .then(() => setHasProfile(true))
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

  return (
    <div className="w-full relative overflow-visible">
      
      {/* Upper Banner Section */}
      <div className="w-full bg-[#e1eff2] pt-32 pb-16 lg:pb-24 relative overflow-visible">
        <DNAPattern />
        <div className="max-w-[960px] mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          {/* Left Column - Slogan */}
          <div className="lg:col-span-7 pt-8 lg:pt-20 space-y-4">
            <h1 
              style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600 }}
              className="text-[40px] md:text-[54px] text-[#253a5a] leading-[1.1] tracking-tight"
            >
              Advanced Medicine, <br />
              Personalized Care
            </h1>
            <p 
              style={{ fontFamily: "'Figtree', sans-serif" }}
              className="text-[#556b73] text-[15px] md:text-[16px] leading-relaxed max-w-sm font-medium"
            >
              Experience the future of healthcare with us—because you deserve the best.
            </p>
          </div>

          {/* Right Column - Booking Form Card */}
          <div className="lg:col-span-5 relative z-20 lg:h-[320px]">
            <div className="bg-white rounded-[24px] shadow-[0_35px_70px_rgba(54,86,95,0.12)] border border-[#e8e5de]/30 p-8 lg:absolute lg:top-8 lg:left-0 lg:w-full z-20">
              <h2 
                style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600 }}
                className="text-2xl md:text-3xl text-[#1a2b30] mb-2"
              >
                Make an Appointment
              </h2>
              <p 
                style={{ fontFamily: "'Figtree', sans-serif" }}
                className="text-xs text-[#809196] mb-8 font-medium leading-relaxed"
              >
                Your email address will not be published. Required fields are marked *
              </p>

              {surgeonsLoading ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Your Name */}
                  <div>
                    <label className={labelClass}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  {/* Your Email */}
                  <div>
                    <label className={labelClass}>
                      Your Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  {/* Your Phone */}
                  <div>
                    <label className={labelClass}>
                      Your Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter your phone"
                    />
                  </div>

                  {/* Doctor Selection */}
                  <div>
                    <label className={labelClass}>
                      Select Doctor *
                    </label>
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
                        <option key={s._id} value={s._id}>
                          {s.name} — {s.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <label className={labelClass}>
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="dateTime"
                      value={form.dateTime}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  {/* Type and Duration Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>
                        Type *
                      </label>
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
                      <label className={labelClass}>
                        Duration *
                      </label>
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

                  {/* Your Comment (Notes) */}
                  <div>
                    <label className={labelClass}>
                      Your Comment
                    </label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      className={`${inputClass} resize-none`}
                      rows={3}
                      placeholder="Add comments or medical notes..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600 }}
                    className="w-full bg-[#1f3a60] hover:bg-[#162a47] text-white py-3.5 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4 text-[15px] tracking-wide"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending Request...
                      </>
                    ) : (
                      'Send a Request'
                    )}
                  </button>

                </form>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Lobby Image */}
      <div className="w-full h-[480px] lg:h-[620px] overflow-hidden relative z-10 lg:-mt-24 -mt-8">
        <img 
          src="/appointment-hero.png?v=2" 
          alt="Medical Center Lobby" 
          className="w-full h-full object-cover" 
        />
      </div>

      {/* --- Marquee & Working Hours Section --- */}
      <div className="w-full bg-white relative z-20 pt-16 pb-24">
        
        {/* Marquee Row */}
        <div className="about-section__marquee" style={{ paddingTop: '0px', paddingBottom: '60px' }}>
          <div className="about-section__marquee-track" ref={marqueeRef}>
            {[0, 1, 2].map((block) =>
              ["Cardiology", "+", "Neurology", "+", "Pediatrics", "+", "Dermatology", "+"].map((item, i) => (
                <span
                  key={`${block}-${i}`}
                  className={
                    item === '+'
                      ? 'about-section__marquee-sep'
                      : 'about-section__marquee-item'
                  }
                >
                  {item}
                </span>
              ))
            )}
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="max-w-[960px] mx-auto px-4 w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Left: Working Hours Card */}
          <div className="bg-[#8db5c4] rounded-[24px] p-8 lg:p-10 relative overflow-hidden text-white shadow-lg">
            {/* Background Plus Icon */}
            <svg 
              className="absolute -top-6 -right-6 w-48 h-48 text-white opacity-20 pointer-events-none" 
              viewBox="0 0 24 24" fill="currentColor"
            >
              <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
            </svg>
            
            <h3 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-2xl md:text-3xl font-semibold mb-8 relative z-10">
              Working Hours
            </h3>
            
            <div className="space-y-4 relative z-10 text-[15px] font-medium">
              <div className="flex justify-between items-center">
                <span>Monday</span>
                <span>7.00am - 19.00pm</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tuesday</span>
                <span>7.00am - 19.00pm</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Wednesday</span>
                <span>7.00am - 19.00pm</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Thursday</span>
                <span>7.00am - 19.00pm</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Friday</span>
                <span>7.00am - 19.00pm</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Saturday</span>
                <span>9.00am - 17.00pm</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Sunday</span>
                <span>Close</span>
              </div>
            </div>

            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full mt-10 bg-white text-[#1a2b30] py-3.5 px-6 rounded-full font-bold transition-transform hover:scale-[1.02] text-[14px]"
            >
              Book Online
            </button>
          </div>

          {/* Right: Why Choose Us Content */}
          <div className="pt-4 lg:pt-8">
            {/* Tagline */}
            <div className="flex items-center gap-2 text-[#8db5c4] font-semibold text-[15px] mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z"/>
                <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z"/>
                <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z"/>
                <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z"/>
                <path d="M12 9v6M9 12h6"/>
              </svg>
              why choose our medical center
            </div>

            {/* Headline */}
            <h2 
              style={{ fontFamily: "'Figtree', sans-serif" }} 
              className="text-[32px] md:text-[40px] font-semibold text-[#1a2b30] leading-[1.15] mb-10 tracking-tight"
            >
              Innovation in Medicine,<br/>Care for Life
            </h2>

            {/* Feature List (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 mb-10">
              {[
                'Comprehensive Medical Care',
                'Modern & Comfortable Facilities',
                'Expert Healthcare Team',
                'Preventive & Wellness Programs',
                'Personalized Treatment Plans',
                '24/7 Emergency Services'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-[#556b73] text-[13px] font-semibold">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <hr className="border-t border-[#e8e5de] mb-8" />

            <p className="text-[#556b73] text-[15px] font-medium leading-relaxed">
              We offer comprehensive medical care, ensuring a full spectrum of diagnostic, preventive, and treatment services tailored to individual needs.
            </p>
          </div>

        </div>
      </div>

      {/* --- Healthcare Departments Section --- */}
      <HealthcareDepartments />

      {/* Quick Find & Testimonials Section */}
      <QuickFindSection />

      <Footer />
    </div>
  );
}
