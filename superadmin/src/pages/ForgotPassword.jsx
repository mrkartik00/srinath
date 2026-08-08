import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await api.resetPassword(email.trim(), otp.trim(), newPassword);
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#273d71] relative justify-center items-center">
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white max-w-lg w-full">
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-8">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 15v2a8 8 0 0016 0v-2M20 7a4 4 0 11-8 0 4 4 0 018 0z" />
              <path d="M24 24l4 4M24 28l4-4" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: '"Figtree", sans-serif' }}>Reset Password</h2>
          <p className="text-white/80 text-base leading-relaxed text-center">
            Enter your email to receive a one-time password, then set your new credentials.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1e293b] mb-2" style={{ fontFamily: '"Figtree", sans-serif' }}>
              {step === 1 ? 'Forgot Password' : 'Reset Password'}
            </h1>
            <p className="text-sm text-[#64748b] mt-2">
              {step === 1 ? 'Enter your email to receive a 6-digit OTP' : 'Enter the OTP sent to your email and set a new password'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1e293b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-6 bg-[#273d71] text-white rounded-xl text-sm font-semibold hover:bg-[#1e2f58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1e293b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] transition-all"
                  placeholder="6-digit OTP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1e293b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] transition-all"
                  placeholder="Enter new password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-6 bg-[#273d71] text-white rounded-xl text-sm font-semibold hover:bg-[#1e2f58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                ← Back to email
              </button>
            </form>
          )}

          <p className="text-center text-sm text-[#64748b] mt-6">
            <Link to="/login" className="text-[#273d71] font-medium hover:underline">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
