/* ─────────────────────────────────────────────────────────────
   UI Primitives — Dr. Srinath Healthcare Design System
   All colors are aligned to the teal palette:
     Primary dark: #253a5a
     Primary:      #36565F
     Secondary:    #5F8190
     Accent:       #8db5c4
     Background:   #E2F0F0 / #f0f4f8
   ───────────────────────────────────────────────────────────── */

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-semibold transition-all duration-250',
    'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'active:scale-[0.97]',
  ].join(' ');

  const variants = {
    primary: [
      'bg-[#253a5a] text-white',
      'rounded-[16px]',
      'shadow-[0_8px_20px_rgba(37,58,90,0.25)]',
      'hover:bg-[#36565F] hover:shadow-[0_12px_28px_rgba(37,58,90,0.32)] hover:-translate-y-0.5',
      'focus-visible:ring-[#36565F]/40',
    ].join(' '),

    secondary: [
      'bg-white text-[#253a5a]',
      'border border-[rgba(54,86,95,0.2)]',
      'rounded-[16px]',
      'hover:bg-[#E2F0F0] hover:border-[#5F8190]/40 hover:-translate-y-0.5',
      'focus-visible:ring-[#36565F]/20',
    ].join(' '),

    accent: [
      'bg-[#8db5c4] text-white',
      'rounded-[16px]',
      'shadow-[0_8px_20px_rgba(141,181,196,0.35)]',
      'hover:bg-[#7aa5b5] hover:shadow-[0_12px_28px_rgba(141,181,196,0.4)] hover:-translate-y-0.5',
      'focus-visible:ring-[#8db5c4]/40',
    ].join(' '),

    outline: [
      'bg-transparent text-[#253a5a]',
      'border-[1.5px] border-[#253a5a]',
      'rounded-[16px]',
      'hover:bg-[#253a5a] hover:text-white hover:-translate-y-0.5',
      'focus-visible:ring-[#36565F]/40',
    ].join(' '),

    danger: [
      'bg-[#C62828] text-white',
      'rounded-[16px]',
      'shadow-[0_4px_12px_rgba(198,40,40,0.2)]',
      'hover:bg-[#B71C1C] hover:shadow-[0_8px_20px_rgba(198,40,40,0.3)] hover:-translate-y-0.5',
      'focus-visible:ring-[#C62828]/40',
    ].join(' '),

    ghost: [
      'bg-transparent text-[#5F8190]',
      'rounded-[16px]',
      'hover:text-[#253a5a] hover:bg-[#E2F0F0]',
      'focus-visible:ring-[#36565F]/20',
    ].join(' '),
  };

  const sizes = {
    sm: 'px-4 py-2 text-[13px] gap-1.5',
    md: 'px-6 py-3 text-[14px]',
    lg: 'px-8 py-[14px] text-[15px]',
    xl: 'px-12 py-[18px] text-[16px]',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-[#253a5a]">{label}</label>
      )}
      <input
        className={[
          'w-full px-4 py-3 rounded-[16px] text-sm font-medium',
          'bg-white text-[#253a5a] placeholder:text-[#6B7C84]/60',
          'border transition-all duration-200 outline-none',
          error
            ? 'border-[#C62828] ring-2 ring-[#C62828]/20'
            : 'border-[rgba(54,86,95,0.18)] hover:border-[#5F8190]/40 focus:border-[#36565F] focus:ring-2 focus:ring-[#36565F]/15',
        ].join(' ')}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[#6B7C84]">{hint}</p>}
      {error && <p className="text-xs text-[#C62828] font-medium">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-[#253a5a]">{label}</label>
      )}
      <textarea
        className={[
          'w-full px-4 py-3 rounded-[16px] text-sm font-medium resize-none',
          'bg-white text-[#253a5a] placeholder:text-[#6B7C84]/60',
          'border transition-all duration-200 outline-none',
          error
            ? 'border-[#C62828] ring-2 ring-[#C62828]/20'
            : 'border-[rgba(54,86,95,0.18)] hover:border-[#5F8190]/40 focus:border-[#36565F] focus:ring-2 focus:ring-[#36565F]/15',
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-[#C62828] font-medium">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className = '', children, ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-[#253a5a]">{label}</label>
      )}
      <select
        className={[
          'w-full px-4 py-3 rounded-[16px] text-sm font-medium',
          'bg-white text-[#253a5a]',
          'border transition-all duration-200 outline-none appearance-none cursor-pointer',
          error
            ? 'border-[#C62828] ring-2 ring-[#C62828]/20'
            : 'border-[rgba(54,86,95,0.18)] hover:border-[#5F8190]/40 focus:border-[#36565F] focus:ring-2 focus:ring-[#36565F]/15',
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[#C62828] font-medium">{error}</p>}
    </div>
  );
}

export function Card({ children, className = '', hover = false, style = {} }) {
  return (
    <div
      style={style}
      className={[
        'bg-white rounded-[24px]',
        'border border-[rgba(54,86,95,0.12)]',
        'shadow-[0_1px_4px_rgba(54,86,95,0.06)]',
        hover
          ? 'transition-all duration-300 hover:shadow-[0_12px_40px_rgba(54,86,95,0.12)] hover:-translate-y-1 cursor-pointer'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 ${className}`}>{children}</div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 pt-6 pb-0 ${className}`}>{children}</div>
  );
}

export function Badge({ children, variant = 'default', dot = false }) {
  const variants = {
    default:     'bg-[#E2F0F0] text-[#36565F] border-[rgba(54,86,95,0.2)]',
    info:        'bg-[rgba(50,83,166,0.08)] text-[#3253A6] border-[rgba(50,83,166,0.2)]',
    scheduled:   'bg-[rgba(50,83,166,0.08)] text-[#3253A6] border-[rgba(50,83,166,0.2)]',
    completed:   'bg-[rgba(46,125,50,0.08)] text-[#2E7D32] border-[rgba(46,125,50,0.2)]',
    success:     'bg-[rgba(46,125,50,0.08)] text-[#2E7D32] border-[rgba(46,125,50,0.2)]',
    cancelled:   'bg-[rgba(198,40,40,0.08)] text-[#C62828] border-[rgba(198,40,40,0.2)]',
    danger:      'bg-[rgba(198,40,40,0.08)] text-[#C62828] border-[rgba(198,40,40,0.2)]',
    pending:     'bg-[rgba(230,81,0,0.08)] text-[#E65100] border-[rgba(230,81,0,0.2)]',
    warning:     'bg-[rgba(230,81,0,0.08)] text-[#E65100] border-[rgba(230,81,0,0.2)]',
    accent:      'bg-[rgba(141,181,196,0.15)] text-[#36565F] border-[rgba(141,181,196,0.3)]',
    no_show:     'bg-[rgba(230,81,0,0.08)] text-[#E65100] border-[rgba(230,81,0,0.2)]',
    rescheduled: 'bg-[rgba(50,83,166,0.08)] text-[#3253A6] border-[rgba(50,83,166,0.2)]',
    in_progress: 'bg-[rgba(141,181,196,0.2)] text-[#253a5a] border-[rgba(141,181,196,0.35)]',
  };

  const dotColors = {
    default:     'bg-[#36565F]',    info: 'bg-[#3253A6]',      scheduled: 'bg-[#3253A6]',
    completed:   'bg-[#2E7D32]',    success: 'bg-[#2E7D32]',   cancelled: 'bg-[#C62828]',
    danger:      'bg-[#C62828]',    pending: 'bg-[#E65100]',   warning: 'bg-[#E65100]',
    accent:      'bg-[#8db5c4]',    no_show: 'bg-[#E65100]',   rescheduled: 'bg-[#3253A6]',
    in_progress: 'bg-[#253a5a]',
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5',
        'rounded-full text-xs font-semibold border',
        'font-[Figtree,system-ui,sans-serif]',
        variants[variant] || variants.default,
      ].join(' ')}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant] || dotColors.default}`}
        />
      )}
      {children}
    </span>
  );
}

export function Spinner({ size = 'md', light = false }) {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-[3px]',
    xl: 'h-16 w-16 border-4',
  };

  const trackColor  = light ? 'border-white/20' : 'border-[rgba(54,86,95,0.12)]';
  const spinColor   = light ? 'border-t-white'  : 'border-t-[#36565F]';

  return (
    <div className="flex items-center justify-center p-6">
      <div className={`${sizes[size]} animate-spin rounded-full ${trackColor} ${spinColor}`} />
    </div>
  );
}

export function PageSpinner() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#8fbec8',
        fontFamily: "'Figtree', sans-serif",
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.25)',
          borderTopColor: '#ffffff',
          borderRadius: '50%',
          animation: 'ds-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes ds-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
