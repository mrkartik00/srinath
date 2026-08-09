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
    // Auto-send OTP on mount
    sendOtp(email).catch(() => {});
  }, [email, navigate]);

  useEffect(() => {
    if (!email) return;
    const timer = countdown > 0 && setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, email]);

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
        const res = await loginApi(email, password);
        login(res.data.accessToken, res.data.user, res.data.refreshToken);
        toast.success('Email verified! Welcome!');
        navigate('/appointments');
      } else {
        toast.success('Email verified! Please sign in.');
        navigate('/login');
      }
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
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4" style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}>
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#253a5a] text-white flex items-center justify-center text-sm font-bold">JC</div>
            <span className="font-bold text-[18px] text-[#253a5a] tracking-tight">Janki Care</span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-[rgba(54,86,95,0.1)] shadow-[0_4px_24px_rgba(54,86,95,0.06)] p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-[16px] bg-[#E2F0F0] flex items-center justify-center">
              <svg width="28" height="28" fill="none" stroke="#36565F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 className="text-[24px] font-semibold text-[#253a5a] tracking-tight">Verify Your Email</h1>
            <p className="text-[14px] text-[#6B7C84] mt-2">
              We sent a 6-digit code to <span className="font-semibold text-[#253a5a]">{email}</span>
            </p>
          </div>

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
                  className="w-12 h-14 text-center text-xl font-semibold text-[#253a5a] border-2 border-[rgba(54,86,95,0.18)] rounded-[12px] focus:border-[#36565F] focus:ring-2 focus:ring-[#36565F]/15 outline-none transition-all"
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-[14px] bg-[#253a5a] text-white rounded-[16px] font-semibold text-[15px] shadow-[0_8px_20px_rgba(37,58,90,0.25)] hover:bg-[#36565F] hover:shadow-[0_12px_28px_rgba(37,58,90,0.32)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#6B7C84] mt-6">
            {countdown > 0 ? (
              <>Resend code in <span className="font-semibold text-[#253a5a]">{countdown}s</span></>
            ) : (
              <button onClick={handleResend} className="text-[#36565F] font-semibold hover:text-[#253a5a] transition-colors">Resend Code</button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
