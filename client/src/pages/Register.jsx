import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register } from '../api/endpoints/auth';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

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
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, role: 'patient' });
      toast.success('Account created! Please verify your email.');
      navigate('/verify-otp', { state: { email: form.email, password: form.password } });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#253a5a] via-[#36565F] to-[#2a4f5a] relative overflow-hidden">
        <MedicalVisual />

        <div className="absolute bottom-0 right-0 w-[85%] h-[75%] pointer-events-none">
          <img src="/dr.srinath final.png" alt="Dr. Srinath" className="absolute bottom-0 right-[-5%] h-full w-auto object-contain object-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.3)]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-white/15 backdrop-blur-sm border border-white/10 flex items-center justify-center font-bold text-sm">Dr.</div>
            <span className="font-bold text-[18px] tracking-tight">Srinath Healthcare</span>
          </div>

          <div className="max-w-[240px]">
            <h2 className="text-[32px] font-semibold leading-[1.2] mb-4 tracking-tight">Start your health<br />journey today.</h2>
            <p className="text-white/55 text-[15px] leading-relaxed">Create an account to manage appointments and connect with top surgeons.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]">
              <span className="text-xs text-white/60 font-medium">✨ Free</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]">
              <span className="text-xs text-white/60 font-medium">🏥 Premium care</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]">
              <span className="text-xs text-white/60 font-medium">🔒 Private</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f0f4f8] px-6">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[12px] bg-[#253a5a] text-white flex items-center justify-center text-sm font-bold">Dr.</div>
              <span className="font-bold text-[18px] text-[#253a5a] tracking-tight">Srinath Healthcare</span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-[rgba(54,86,95,0.1)] shadow-[0_4px_24px_rgba(54,86,95,0.06)] p-8">
            <div className="mb-6">
              <h1 className="text-[24px] font-semibold text-[#253a5a] tracking-tight">Create your account</h1>
              <p className="text-[14px] text-[#6B7C84] mt-1.5">Join thousands managing their health with ease</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
              <Input label="Email address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required />
              <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
              <Input label="Phone (optional)" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/></svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-[13px] text-[#6B7C84] mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#36565F] font-semibold hover:text-[#253a5a] transition-colors">Sign In</Link>
            </p>
          </div>

          <p className="text-center text-[12px] text-[#6B7C84]/60 mt-6">
            Protected by industry-standard encryption
          </p>
        </div>
      </div>

      <style>{`@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }`}</style>
    </div>
  );
}
