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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#273d71] relative justify-center items-center">
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white max-w-lg w-full">
          <div className="relative w-full max-w-md mb-8" style={{ height: '520px', overflow: 'hidden' }}>
            <img src="/dr.srinath final.png" alt="Dr. Srinath" className="w-full object-cover object-top h-full" />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to top, #273d71, transparent)', pointerEvents: 'none' }}></div>
          </div>
          <div className="w-full max-w-md mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: '"Figtree", sans-serif' }}>Welcome Super Admin</h2>
            <p className="text-white/80 text-base leading-relaxed">
              Manage the entire system, oversee doctors, and configure platform settings securely.
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1e293b] mb-2" style={{ fontFamily: '"Figtree", sans-serif' }}>Login</h1>
            <p className="text-sm text-[#64748b] mt-2">Enter your super admin credentials to access the portal</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1e293b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1e293b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] transition-all" 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 mt-6 bg-[#273d71] text-white rounded-xl text-sm font-semibold hover:bg-[#1e2f58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
