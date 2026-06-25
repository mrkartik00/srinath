export default function ComingSoon({ title, description, phase, icon = '🚀' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#255946]/10 to-[#255946]/5 border border-[#255946]/10 flex items-center justify-center text-3xl mb-6">
        {icon}
      </div>
      {/* Heading removed to prevent duplicate headers */}
      <p className="text-sm text-[#64748b] max-w-md text-center mb-4">{description}</p>
      {phase && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#FFF7ED] text-[#E65100] border border-[#FED7AA]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E65100]" />
          Phase {phase}
        </span>
      )}
    </div>
  );
}
