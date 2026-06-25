export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-[10px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';

  const variants = {
    primary: 'bg-[#273d71] text-white hover:bg-[#1e2f58] shadow-[0_2px_8px_rgba(39,61,113,0.2)] hover:shadow-[0_4px_12px_rgba(39,61,113,0.3)] focus:ring-[#273d71]/40',
    secondary: 'bg-white text-[#1e293b] border border-[#E8E5DE] hover:bg-[#F8F6F0] hover:border-[#273d71]/30 focus:ring-[#273d71]/20',
    danger: 'bg-[#C62828] text-white hover:bg-[#B71C1C] shadow-[0_2px_8px_rgba(198,40,40,0.2)] focus:ring-[#C62828]/40',
    ghost: 'text-[#64748b] hover:text-[#1e293b] hover:bg-[#F8F6F0]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
