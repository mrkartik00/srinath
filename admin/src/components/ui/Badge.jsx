export function Badge({ children, variant = 'default', dot = false }) {
  const variants = {
    default: 'bg-[#F8F6F0] text-[#64748b] border-[#E8E5DE]',
    info: 'bg-[#EEF6FF] text-[#1565C0] border-[#BFDBFE]',
    scheduled: 'bg-[#EEF6FF] text-[#1565C0] border-[#BFDBFE]',
    completed: 'bg-[#ECFDF5] text-[#2E7D32] border-[#A7F3D0]',
    success: 'bg-[#ECFDF5] text-[#2E7D32] border-[#A7F3D0]',
    cancelled: 'bg-[#FEF2F2] text-[#C62828] border-[#FECACA]',
    danger: 'bg-[#FEF2F2] text-[#C62828] border-[#FECACA]',
    no_show: 'bg-[#FFF7ED] text-[#E65100] border-[#FED7AA]',
    warning: 'bg-[#FFF7ED] text-[#E65100] border-[#FED7AA]',
    pending: 'bg-[#FFF7ED] text-[#E65100] border-[#FED7AA]',
  };

  const dotColors = {
    default: 'bg-[#64748b]',
    info: 'bg-[#1565C0]', scheduled: 'bg-[#1565C0]',
    completed: 'bg-[#2E7D32]', success: 'bg-[#2E7D32]',
    cancelled: 'bg-[#C62828]', danger: 'bg-[#C62828]',
    no_show: 'bg-[#E65100]', warning: 'bg-[#E65100]', pending: 'bg-[#E65100]',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant] || variants.default}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} />}
      {children}
    </span>
  );
}
