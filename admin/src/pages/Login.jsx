import { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      if (res.data.user.role === 'super_admin') { toast.error('Super Admins must use the Super Admin portal.'); return; }
      if (res.data.user.role !== 'doctor') { toast.error('This portal is for doctors only.'); return; }
      login(res.data.accessToken, res.data.user);
      const status = res.data.user.approvalStatus;
      if (status && status !== 'approved' && status !== 'not_applicable') {
        navigate('/pending-approval');
      } else {
        toast.success('Welcome, Doctor!');
        navigate('/');
      }
    } catch (err) { toast.error(err?.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#255946] via-[#1e4d3d] to-[#0f2a20] relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-bold text-sm">S+</div>
            <span className="text-xl font-serif font-bold">SurgiRise</span>
          </div>
          <div>
            <h2 className="text-4xl font-serif font-semibold leading-tight mb-4">Doctor Portal</h2>
            <p className="text-white/60 text-base max-w-sm">Manage your patients, appointments, and prescriptions in one place.</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <span>🔒 Secure</span><span>•</span><span>⚡ Fast</span><span>•</span><span>🏥 Clinical</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-[#F8F6F0] px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-serif font-semibold text-[#1e293b]">Welcome back, Doctor</h1>
            <p className="text-sm text-[#64748b] mt-1">Sign in to your practice dashboard</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@clinic.com" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
          </form>
          <p className="text-center text-sm text-[#64748b] mt-6">Don't have an account? <Link to="/register" className="text-[#255946] font-medium hover:underline">Register</Link></p>
        </div>
      </div>
    </div>
  );
}
