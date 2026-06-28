import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login as loginApi } from '../api/endpoints/auth';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

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
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#273d71] relative justify-center items-center">
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white max-w-lg w-full">
          <img src="/doctors.png" alt="Doctors" className="w-full max-w-md object-contain mb-8" />
          <div className="w-full max-w-md mx-auto">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: '"Figtree", sans-serif' }}>Welcome Doctor</h2>
            <p className="text-white/80 text-base leading-relaxed">
              Access your patient records, view book appointments, and manage your patients prescription history in one place.
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1e293b] mb-2">Login</h1>
            <p className="text-sm text-[#64748b] mt-2">Enter your credentials to access your account and explore<br />more</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="User ID" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" required />
            <div className="text-right"><Link to="/forgot-password" className="text-sm text-[#273d71] font-medium hover:underline">Forgot Password?</Link></div>

            <Button type="submit" className="w-full !bg-[#273d71] hover:!bg-[#1e2f58] !text-white !py-3 mt-6" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="text-center text-sm text-[#64748b] mt-8">
            Don't have an account? <Link to="/register" className="text-[#273d71] font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
