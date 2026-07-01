import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword, resetPassword } from '../api/endpoints/auth';
import { Button, Input } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      toast.success('Password reset successful');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-6" style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}>
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#253a5a] text-white flex items-center justify-center text-sm font-bold">JC</div>
            <span className="font-bold text-[18px] text-[#253a5a] tracking-tight">Janki Care</span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-[rgba(54,86,95,0.1)] shadow-[0_4px_24px_rgba(54,86,95,0.06)] p-8">
          <div className="mb-7">
            <h1 className="text-[24px] font-semibold text-[#253a5a] tracking-tight">Reset Password</h1>
            <p className="text-[14px] text-[#6B7C84] mt-1.5">
              {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the OTP and your new password'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSend} className="space-y-5">
              <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <Input label="OTP Code" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" required />
              <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          <p className="text-center text-[13px] text-[#6B7C84] mt-6">
            <Link to="/login" className="text-[#36565F] font-semibold hover:text-[#253a5a] transition-colors">← Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
