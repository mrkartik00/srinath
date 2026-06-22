export default function ComingSoon({ title, icon, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <span className="text-5xl mb-4">{icon || '🚧'}</span>
      <h2 className="text-xl font-bold text-white">{title || 'Coming Soon'}</h2>
      <p className="text-sm text-white/40 mt-2 max-w-sm text-center">{description || 'This feature is under development and will be available soon.'}</p>
    </div>
  );
}
