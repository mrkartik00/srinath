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
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[#1e293b] mb-2">Reset Password</h1>
        <p className="text-sm text-[#64748b] mb-6">{step === 1 ? 'Enter your email to receive a reset code' : 'Enter the OTP and your new password'}</p>
        {step === 1 ? (
          <form onSubmit={handleSend} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <Input label="OTP Code" value={otp} onChange={e => setOtp(e.target.value)} required />
            <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
          </form>
        )}
        <p className="text-center text-sm text-[#64748b] mt-6">
          <Link to="/login" className="text-[#36565F] font-medium hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
