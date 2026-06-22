export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-[3px]' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} animate-spin rounded-full border-[#E8E5DE] border-t-[#255946]`} />
    </div>
  );
}
