import { useState } from 'react';

export function Input({ label, error, className = '', type, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-[#1e293b] mb-1.5">{label}</label>}
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`w-full px-3.5 py-2.5 ${isPassword ? 'pr-10' : ''} bg-white border rounded-[10px] text-sm transition-all duration-200 placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] ${error ? 'border-[#C62828] focus:ring-[#C62828]/20' : 'border-[#E8E5DE] hover:border-[#273d71]/30'}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e293b] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 9s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z"/><circle cx="9" cy="9" r="2.5"/><path d="M3 15L15 3"/></svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 9s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z"/><circle cx="9" cy="9" r="2.5"/></svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-[#C62828]">{error}</p>}
    </div>
  );
}
