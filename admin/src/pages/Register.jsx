import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register as registerApi } from '../api/endpoints/auth';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

function MedicalVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-[12%] left-[15%] w-16 h-16 rounded-[20px] bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center animate-[float_6s_ease-in-out_infinite]">
        <svg width="28" height="28" fill="none" stroke="white" strokeWidth="1.5" className="opacity-60"><path d="M12 4v16m-8-8h16"/></svg>
      </div>
      <div className="absolute top-[35%] right-[12%] w-14 h-14 rounded-[18px] bg-white/[0.05] backdrop-blur-sm border border-white/[0.07] flex items-center justify-center animate-[float_7s_ease-in-out_infinite_1s]">
        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-50"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <div className="absolute bottom-[25%] left-[20%] w-12 h-12 rounded-[16px] bg-[#8db5c4]/[0.15] border border-[#8db5c4]/[0.2] flex items-center justify-center animate-[float_8s_ease-in-out_infinite_2s]">
        <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.5" className="opacity-50"><circle cx="10" cy="10" r="7"/><path d="M10 7v6m-3-3h6"/></svg>
      </div>
      <div className="absolute top-[10%] right-[10%] w-[200px] h-[200px] rounded-full bg-[#8db5c4]/[0.08] blur-[80px]" />
      <div className="absolute bottom-[15%] left-[5%] w-[180px] h-[180px] rounded-full bg-white/[0.04] blur-[60px]" />
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', specialization: '', qualification: '', licenseNumber: '', experience: '', clinicName: '', clinicAddress: '', aboutMe: '', consultationFee: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerApi({ ...form, experience: +form.experience, consultationFee: +form.consultationFee || 0 });
      toast.success('Registration submitted! Please verify your email.');
      navigate('/verify-otp', { state: { email: form.email, password: form.password } });
    } catch (err) { toast.error(err?.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#253a5a] via-[#36565F] to-[#2a4f5a] relative overflow-hidden">
        <MedicalVisual />

        <div className="absolute bottom-0 right-0 w-[85%] h-[75%] pointer-events-none">
          <img src="/dr.srinath final.png" alt="Dr. Srinath" className="absolute bottom-0 right-[-5%] h-full w-auto object-contain object-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.3)]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-white/15 backdrop-blur-sm border border-white/10 flex items-center justify-center font-bold text-sm">JC</div>
            <span className="font-bold text-[18px] tracking-tight">Janki Care</span>
          </div>

          <div className="max-w-[220px]">
            <h2 className="text-[28px] font-semibold leading-[1.2] mb-3 tracking-tight">Join our<br />medical team.</h2>
            <p className="text-white/55 text-[14px] leading-relaxed">Register to manage patients, prescriptions, and grow your practice.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]">
              <span className="text-xs text-white/60 font-medium">✓ Admin reviews</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]">
              <span className="text-xs text-white/60 font-medium">🔒 Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f0f4f8] px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-[520px]">
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[12px] bg-[#253a5a] text-white flex items-center justify-center text-sm font-bold">JC</div>
              <span className="font-bold text-[18px] text-[#253a5a] tracking-tight">Janki Care</span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-[rgba(54,86,95,0.1)] shadow-[0_4px_24px_rgba(54,86,95,0.06)] p-7">
            <div className="mb-5">
              <h1 className="text-[22px] font-semibold text-[#253a5a] tracking-tight">Doctor Registration</h1>
              <p className="text-[13px] text-[#6B7C84] mt-1">Fill your details. Admin will review and approve.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="Dr. John Smith" required />
                <Input label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="doctor@example.com" required />
                <Input label="Password *" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required />
                <Input label="Phone *" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" required />
                <Input label="Specialization *" value={form.specialization} onChange={set('specialization')} placeholder="Orthopedics" required />
                <Input label="Qualification *" value={form.qualification} onChange={set('qualification')} placeholder="MBBS, MS" required />
                <Input label="License Number *" value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="MCI-12345" required />
                <Input label="Experience (yrs) *" type="number" value={form.experience} onChange={set('experience')} placeholder="5" required />
                <Input label="Clinic Name" value={form.clinicName} onChange={set('clinicName')} placeholder="City Hospital" />
                <Input label="Fee (₹)" type="number" value={form.consultationFee} onChange={set('consultationFee')} placeholder="500" />
              </div>
              <Input label="Clinic Address" value={form.clinicAddress} onChange={set('clinicAddress')} placeholder="123 Main St, City" />
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">About Me</label>
                <textarea value={form.aboutMe} onChange={set('aboutMe')} placeholder="Brief description about your practice..." rows={2} className="w-full px-3.5 py-2.5 bg-white border border-[rgba(54,86,95,0.18)] rounded-[10px] text-sm placeholder:text-[#6B7C84]/60 focus:outline-none focus:ring-2 focus:ring-[#36565F]/15 focus:border-[#36565F] hover:border-[#5F8190]/40 transition-all" />
              </div>

              <Button type="submit" className="w-full !bg-[#253a5a] hover:!bg-[#36565F] !text-white !rounded-[16px] !shadow-[0_8px_20px_rgba(37,58,90,0.25)] !py-3 mt-2" size="lg" disabled={loading}>
                {loading ? 'Submitting...' : 'Register'}
              </Button>

              <p className="text-center text-[13px] text-[#6B7C84] mt-4">
                Already have an account? <Link to="/login" className="text-[#36565F] font-semibold hover:text-[#253a5a] transition-colors">Sign In</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style>{`@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }`}</style>
    </div>
  );
}
