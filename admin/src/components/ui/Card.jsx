export function Card({ children, className = '', hover = false }) {
  return (
    <div className={`bg-surface rounded-xl shadow-[0_1px_3px_rgba(37,89,70,0.06)] border border-border/50 ${hover ? 'transition-all duration-200 hover:shadow-[0_8px_25px_rgba(37,89,70,0.08)] hover:-translate-y-0.5' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`px-6 py-4 border-b border-border/50 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
