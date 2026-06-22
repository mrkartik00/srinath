import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login as loginApi } from '../api/endpoints/auth';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

function DnaVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="relative w-[300px] h-[500px]">
        {[0,1,2,3,4,5,6,7,8,9,10].map((i) => (
          <div key={`a${i}`} className="absolute" style={{ top: `${i*9}%`, left: `${50 + Math.sin(i*0.6)*35}%`, transform: 'translate(-50%,-50%)' }}>
            <div className={`rounded-full ${i%3===0?'w-6 h-6 bg-white/30':i%3===1?'w-5 h-5 bg-white/20':'w-4 h-4 bg-[#E5B94E]/50'}`} />
          </div>
        ))}
        {[0,1,2,3,4,5,6,7,8,9,10].map((i) => (
          <div key={`b${i}`} className="absolute" style={{ top: `${i*9+4}%`, left: `${50 - Math.sin(i*0.6)*35}%`, transform: 'translate(-50%,-50%)' }}>
            <div className={`rounded-full ${i%3===0?'w-5 h-5 bg-white/25':i%3===1?'w-4 h-4 bg-white/15':'w-3 h-3 bg-[#E5B94E]/40'}`} />
          </div>
        ))}
        {[0,1,2,3,4,5].map((i) => (
          <div key={`c${i}`} className="absolute h-[1px] bg-gradient-to-r from-white/10 via-white/20 to-white/10" style={{ top: `${i*18+5}%`, left: '20%', width: '60%', transform: `rotate(${Math.sin(i)*10}deg)` }} />
        ))}
        <div className="absolute top-[15%] left-[25%] w-20 h-20 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-[50%] right-[20%] w-24 h-24 rounded-full bg-[#E5B94E]/8 blur-2xl" />
        <div className="absolute bottom-[20%] left-[30%] w-16 h-16 rounded-full bg-white/5 blur-xl" />
      </div>
    </div>
  );
}

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
      login(res.data.accessToken, res.data.user);
      toast.success('Welcome back!');
      navigate('/appointments');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Hero with DNA */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#36565F] via-[#1e4d3d] to-[#0f2a20] relative overflow-hidden">
        <DnaVisual />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-bold text-sm">S+</div>
            <span className="text-lg font-serif font-bold">SurgiRise</span>
          </div>
          <div>
            <h2 className="text-3xl font-serif font-semibold leading-tight mb-4">
              Your health,<br />simplified.
            </h2>
            <p className="text-white/60 text-sm max-w-xs">
              Book appointments, track your care journey, and connect with your medical team seamlessly.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>🔒 Secure</span><span>•</span><span>📱 Easy access</span><span>•</span><span>💊 Track care</span>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center bg-[#F8F6F0] px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#36565F] text-white flex items-center justify-center text-sm font-bold">S+</div>
              <span className="text-lg font-serif font-bold text-[#36565F]">SurgiRise</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-serif font-semibold text-[#1e293b]">Welcome back</h1>
            <p className="text-sm text-[#64748b] mt-1">Sign in to access your health portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-[#64748b] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#36565F] font-medium hover:text-[#253F47] transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
