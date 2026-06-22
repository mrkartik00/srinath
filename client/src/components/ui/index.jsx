export function Button({ children, variant = 'primary', size = 'md', className = '', disabled = false, ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-[10px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';
  const variants = {
    primary: 'bg-[#36565F] text-white hover:bg-[#253F47] shadow-[0_2px_8px_rgba(37,89,70,0.2)] hover:shadow-[0_4px_12px_rgba(37,89,70,0.3)] focus:ring-[#36565F]/40',
    secondary: 'bg-white text-[#1e293b] border border-[#E8E5DE] hover:bg-[#F8F6F0] hover:border-[#36565F]/30 focus:ring-[#36565F]/20',
    danger: 'bg-[#C62828] text-white hover:bg-[#B71C1C] shadow-[0_2px_8px_rgba(198,40,40,0.2)] focus:ring-[#C62828]/40',
    ghost: 'text-[#64748b] hover:text-[#1e293b] hover:bg-[#F8F6F0]',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs gap-1.5', md: 'px-4 py-2.5 text-sm gap-2', lg: 'px-6 py-3 text-base gap-2' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-[#1e293b] mb-1.5">{label}</label>}
      <input
        className={`w-full px-3.5 py-2.5 bg-white border rounded-[10px] text-sm transition-all duration-200 placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#36565F]/20 focus:border-[#36565F] ${error ? 'border-[#C62828]' : 'border-[#E8E5DE] hover:border-[#36565F]/30'}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-[#C62828]">{error}</p>}
    </div>
  );
}

export function Card({ children, className = '', hover = false }) {
  return (
    <div className={`bg-white rounded-xl shadow-[0_1px_3px_rgba(37,89,70,0.06)] border border-[#E8E5DE]/50 ${hover ? 'transition-all duration-200 hover:shadow-[0_8px_25px_rgba(37,89,70,0.08)] hover:-translate-y-0.5' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}

export function Badge({ children, variant = 'default', dot = false }) {
  const variants = {
    default: 'bg-[#F8F6F0] text-[#64748b] border-[#E8E5DE]',
    info: 'bg-[#EEF6FF] text-[#1565C0] border-[#BFDBFE]',
    scheduled: 'bg-[#EEF6FF] text-[#1565C0] border-[#BFDBFE]',
    completed: 'bg-[#ECFDF5] text-[#2E7D32] border-[#A7F3D0]',
    success: 'bg-[#ECFDF5] text-[#2E7D32] border-[#A7F3D0]',
    cancelled: 'bg-[#FEF2F2] text-[#C62828] border-[#FECACA]',
    danger: 'bg-[#FEF2F2] text-[#C62828] border-[#FECACA]',
    pending: 'bg-[#FFF7ED] text-[#E65100] border-[#FED7AA]',
    warning: 'bg-[#FFF7ED] text-[#E65100] border-[#FED7AA]',
  };
  const dotColors = {
    default: 'bg-[#64748b]', info: 'bg-[#1565C0]', scheduled: 'bg-[#1565C0]',
    completed: 'bg-[#2E7D32]', success: 'bg-[#2E7D32]',
    cancelled: 'bg-[#C62828]', danger: 'bg-[#C62828]',
    pending: 'bg-[#E65100]', warning: 'bg-[#E65100]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant] || variants.default}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} />}
      {children}
    </span>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-[3px]' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} animate-spin rounded-full border-[#E8E5DE] border-t-[#36565F]`} />
    </div>
  );
}
