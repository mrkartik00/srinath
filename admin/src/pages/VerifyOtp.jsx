import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sendOtp, verifyOtp, login as loginApi } from '../api/endpoints/auth';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email;
  const password = location.state?.password;

  useEffect(() => {
    if (!email) { navigate('/login'); return; }
    const timer = countdown > 0 && setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, email, navigate]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = text.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      await verifyOtp(email, code);
      if (password) {
        try {
          const res = await loginApi(email, password);
          login(res.data.accessToken, res.data.user, res.data.refreshToken);
          toast.success('Email verified! Welcome, Doctor!');
          navigate('/');
          return;
        } catch (_) { /* fall through to login page */ }
      }
      toast.success('Email verified! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await sendOtp(email);
      setCountdown(60);
      toast.success('New code sent!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md border border-gray-100 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center text-[#1e293b] mb-2">Verify Your Email</h1>
        <p className="text-sm text-center text-[#64748b] mb-8">
          We sent a 6-digit code to <span className="font-medium text-[#1e293b]">{email}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-200 rounded-lg focus:border-[#273d71] focus:outline-none transition-colors"
              />
            ))}
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#273d71] text-white rounded-lg font-medium hover:bg-[#1e2f58] transition-colors disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>
        <p className="text-center text-sm text-[#64748b] mt-6">
          {countdown > 0 ? (
            <>Resend code in <span className="font-medium">{countdown}s</span></>
          ) : (
            <button onClick={handleResend} className="text-[#273d71] font-medium hover:underline">Resend Code</button>
          )}
        </p>
      </div>
    </div>
  );
}
