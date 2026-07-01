import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login as loginApi } from '../api/endpoints/auth';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

function MedicalVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-[12%] left-[15%] w-16 h-16 rounded-[20px] bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center animate-[float_6s_ease-in-out_infinite]">
        <svg width="28" height="28" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
          <path d="M12 4v16m-8-8h16"/>
        </svg>
      </div>
      <div className="absolute top-[35%] right-[12%] w-14 h-14 rounded-[18px] bg-white/[0.05] backdrop-blur-sm border border-white/[0.07] flex items-center justify-center animate-[float_7s_ease-in-out_infinite_1s]">
        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>
      <div className="absolute bottom-[25%] left-[20%] w-12 h-12 rounded-[16px] bg-[#8db5c4]/[0.15] border border-[#8db5c4]/[0.2] flex items-center justify-center animate-[float_8s_ease-in-out_infinite_2s]">
        <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <circle cx="10" cy="10" r="7"/>
          <path d="M10 7v6m-3-3h6"/>
        </svg>
      </div>
      <div className="absolute top-[10%] right-[10%] w-[200px] h-[200px] rounded-full bg-[#8db5c4]/[0.08] blur-[80px]" />
      <div className="absolute bottom-[15%] left-[5%] w-[180px] h-[180px] rounded-full bg-white/[0.04] blur-[60px]" />
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('sessionExpired')) {
      localStorage.removeItem('sessionExpired');
      toast.error('Session expired. Please sign in again.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      if (res.data.user.role === 'super_admin') { toast.error('Super Admins must use the Super Admin portal.'); return; }
      if (res.data.user.role !== 'doctor') { toast.error('This portal is for doctors only.'); return; }
      login(res.data.accessToken, res.data.user, res.data.refreshToken);
      const status = res.data.user.approvalStatus;
      if (status && status !== 'approved' && status !== 'not_applicable') {
        navigate('/pending-approval');
      } else {
        toast.success('Welcome, Doctor!');
        navigate('/');
      }
    } catch (err) {
      const data = err?.response?.data;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email first');
        navigate('/verify-otp', { state: { email: data.email || email, password } });
      } else {
        toast.error(data?.message || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#253a5a] via-[#36565F] to-[#2a4f5a] relative overflow-hidden">
        <MedicalVisual />

        {/* Doctor Image */}
        <div className="absolute bottom-0 right-0 w-[85%] h-[75%] pointer-events-none">
          <img
            src="/dr.srinath final.png"
            alt="Dr. Srinath"
            className="absolute bottom-0 right-[-5%] h-full w-auto object-contain object-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-white/15 backdrop-blur-sm border border-white/10 flex items-center justify-center font-bold text-sm">
              Dr.
            </div>
            <span className="font-bold text-[18px] tracking-tight">Janki Care</span>
          </div>

          {/* Main text */}
          <div className="max-w-[240px]">
            <h2 className="text-[32px] font-semibold leading-[1.2] mb-4 tracking-tight">
              Doctor<br />Portal
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed">
              Manage appointments, prescriptions, and patient records from one dashboard.
            </p>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8db5c4]"><rect x="3" y="3" width="8" height="10" rx="1"/><path d="M7 7v2"/><circle cx="7" cy="5" r="1"/></svg>
              <span className="text-xs text-white/60 font-medium">HIPAA Secure</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8db5c4]"><circle cx="7" cy="7" r="5"/><path d="M7 5v4l2 1"/></svg>
              <span className="text-xs text-white/60 font-medium">Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f0f4f8] px-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[12px] bg-[#253a5a] text-white flex items-center justify-center text-sm font-bold">JC</div>
              <span className="font-bold text-[18px] text-[#253a5a] tracking-tight">Janki Care</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[24px] border border-[rgba(54,86,95,0.1)] shadow-[0_4px_24px_rgba(54,86,95,0.06)] p-8">
            <div className="mb-7">
              <h1 className="text-[24px] font-semibold text-[#253a5a] tracking-tight">Doctor Login</h1>
              <p className="text-[14px] text-[#6B7C84] mt-1.5">Sign in to access your practice dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@email.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-[13px] text-[#5F8190] font-medium hover:text-[#36565F] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" className="w-full !bg-[#253a5a] hover:!bg-[#36565F] !text-white !rounded-[16px] !shadow-[0_8px_20px_rgba(37,58,90,0.25)]" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-[13px] text-[#6B7C84] mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#36565F] font-semibold hover:text-[#253a5a] transition-colors">
                Register
              </Link>
            </p>
          </div>

          <p className="text-center text-[12px] text-[#6B7C84]/60 mt-6">
            Protected by industry-standard encryption
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
