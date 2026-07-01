import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Leaf,
  Dumbbell,
  Pill,
  Moon,
  Lock,
  BookOpen,
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'Nutrition':   { icon: <Leaf size={16} />,     bg: '#ECFDF5', color: '#10B981' },
  'Exercise':    { icon: <Dumbbell size={16} />,  bg: '#EFF6FF', color: '#3B82F6' },
  'Medication':  { icon: <Pill size={16} />,      bg: '#FEF3C7', color: '#D97706' },
  'Lifestyle':   { icon: <Moon size={16} />,      bg: '#F5F3FF', color: '#8B5CF6' },
};

const tips = [
  {
    category: 'Nutrition',
    title: 'Stay Hydrated',
    body: 'Drink at least 8 glasses of water daily to maintain optimal body function and energy levels. Proper hydration supports digestion, skin health, and cognitive performance.',
    date: 'Today',
    featured: true,
  },
  {
    category: 'Exercise',
    title: 'Morning Walks',
    body: 'A 20-minute morning walk can boost your mood and improve cardiovascular health.',
    date: 'Yesterday',
  },
  {
    category: 'Medication',
    title: 'Consistent Timing',
    body: 'Take medications at the same time daily for best effectiveness and fewer missed doses.',
    date: 'Jun 20',
  },
  {
    category: 'Lifestyle',
    title: 'Sleep Hygiene',
    body: 'Maintain a consistent sleep schedule — aim for 7-8 hours every night.',
    date: 'Jun 19',
  },
];

export default function HealthFeed() {
  const { user } = useAuth();
  const isActive = user?.subscriptionStatus === 'active';

  const featured = tips.find(t => t.featured);
  const past = tips.filter(t => !t.featured);

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 bg-[#f8fafb] min-h-screen font-['Figtree'] w-full relative">

      {/* ── Paywall Overlay ── */}
      {!isActive && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#f8fafb]/80 backdrop-blur-sm">
          <div className="bg-white border border-[#eaedf1] rounded-[24px] p-10 shadow-xl flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-[#E6F2F5] flex items-center justify-center">
              <Lock size={28} className="text-[#253a5a]" />
            </div>
            <div>
              <h3 className="text-[17px] font-extrabold text-[#253a5a]">Premium Feature</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                Subscribe to a VIP plan to unlock personalized AI-powered health tips tailored to your medical profile.
              </p>
            </div>
            <a
              href="/vip"
              className="bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-xs px-6 py-3 rounded-full transition-all uppercase tracking-wider"
            >
              View Plans
            </a>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-5 border-b border-[#eaedf1]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#253a5a] tracking-tight">Health Feed</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Personalized health tips based on your medical profile.
          </p>
        </div>
        {/* AI badge */}
        <div className="flex items-center gap-1.5 bg-[#253a5a] text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
          <Sparkles size={12} /> Powered by AI
        </div>
      </div>

      {/* ── AI Coming Soon Banner ── */}
      <div className="bg-white border border-[#eaedf1] rounded-[24px] px-5 py-4 flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
        <div className="w-10 h-10 rounded-2xl bg-[#E6F2F5] flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-[#36565F]" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#253a5a]">AI Personalisation — Coming Soon</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Tips will be generated based on your prescriptions, vitals, and medical history.
          </p>
        </div>
      </div>

      {/* ── Today's Featured Tip ── */}
      {featured && (() => {
        const cfg = CATEGORY_CONFIG[featured.category] || { icon: <BookOpen size={16}/>, bg: '#EFF6FF', color: '#3B82F6' };
        return (
          <div className="bg-white border border-[#eaedf1] rounded-[24px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.icon}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                  {featured.category}
                </span>
              </div>
              <span className="bg-[#ECFDF5] text-[#10B981] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Today's Tip
              </span>
            </div>
            <div>
              <h2 className="text-[18px] font-extrabold text-[#253a5a] leading-snug">{featured.title}</h2>
              <p className="text-[13px] text-slate-500 font-medium mt-2 leading-relaxed">{featured.body}</p>
            </div>
          </div>
        );
      })()}

      {/* ── Past Tips ── */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold text-[#8db5c4] uppercase tracking-wider">Past Tips</p>
        <div className="bg-white border border-[#eaedf1] rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.01)] overflow-hidden">
          {past.map((tip, i) => {
            const cfg = CATEGORY_CONFIG[tip.category] || { icon: <BookOpen size={14}/>, bg: '#EFF6FF', color: '#3B82F6' };
            return (
              <div
                key={i}
                className={`flex items-start gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors ${i !== 0 ? 'border-t border-[#eaedf1]' : ''}`}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                      {tip.category}
                    </span>
                  </div>
                  <p className="text-[14px] font-bold text-[#253a5a]">{tip.title}</p>
                  <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed">{tip.body}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold flex-shrink-0 mt-1">{tip.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
