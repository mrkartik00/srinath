import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';

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
      const res = await api.post('/api/v1/auth/login', { email, password });
      if (res.data.user.role !== 'super_admin') { toast.error('Access denied. Super Admin only.'); return; }
      login(res.data.accessToken, res.data.user);
      navigate('/');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-sm p-8 bg-[#1e293b] rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#6366f1] flex items-center justify-center font-bold text-white text-sm">S+</div>
          <span className="text-lg font-bold text-white">Super Admin</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" placeholder="admin@srplus.com" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#5558e6] disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
