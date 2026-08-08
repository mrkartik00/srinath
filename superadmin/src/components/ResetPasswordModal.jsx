import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

export default function ResetPasswordModal({ isOpen, onClose, user, onSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [done, setDone] = useState(false);

  if (!isOpen || !user) return null;

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await api.resetUserPassword(user._id, password || undefined);
      const newPass = res?.data?.newPassword || res?.data?.password || password || 'Auto-generated (check email)';
      setGeneratedPassword(newPass);
      setDone(true);
      toast.success('Password reset successfully');
      if (onSuccess) onSuccess(res);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success('Password copied to clipboard');
  };

  const handleClose = () => {
    setPassword('');
    setGeneratedPassword('');
    setDone(false);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1e293b]" style={{ fontFamily: '"Figtree", sans-serif' }}>
            Reset User Password
          </h2>
          <button onClick={handleClose} className="text-[#64748b] hover:text-[#1e293b] transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        <div className="mb-5 p-3 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-[#1e293b]">{user.name}</p>
          <p className="text-xs text-[#64748b]">{user.email}</p>
        </div>

        {!done ? (
          <>
            <div className="mb-5">
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
                New Password <span className="text-[#64748b] font-normal">(leave empty to auto-generate)</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1e293b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] transition-all"
                placeholder="Leave empty to auto-generate"
              />
            </div>
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-3 bg-[#273d71] text-white rounded-xl text-sm font-semibold hover:bg-[#1e2f58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">New Password</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedPassword}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1e293b] font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-3 bg-[#273d71] text-white rounded-xl text-sm font-semibold hover:bg-[#1e2f58] transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-xs text-[#64748b] mb-5 flex items-center gap-1.5">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 13A6 6 0 107 1a6 6 0 000 12zM7 4v3M7 10h.01" />
              </svg>
              User has been notified via email
            </p>
            <button
              onClick={handleClose}
              className="w-full py-3 bg-gray-100 text-[#1e293b] rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
