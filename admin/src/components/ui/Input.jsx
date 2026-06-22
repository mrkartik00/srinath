export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-[#1e293b] mb-1.5">{label}</label>}
      <input
        className={`w-full px-3.5 py-2.5 bg-white border rounded-[10px] text-sm transition-all duration-200 placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#255946]/20 focus:border-[#255946] ${error ? 'border-[#C62828] focus:ring-[#C62828]/20' : 'border-[#E8E5DE] hover:border-[#255946]/30'}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-[#C62828]">{error}</p>}
    </div>
  );
}
