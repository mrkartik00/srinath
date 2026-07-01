import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getPatientPlans } from '../../api/endpoints/patient';
import {
  Award,
  Check,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  X,
} from 'lucide-react';

const faqs = [
  { q: "What's included?", a: "Unlimited doctor chat, medicine reminders, digital prescriptions, medical vault storage, and AI-powered health tips." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription anytime. You'll retain access until the end of your billing period." },
  { q: "Is it per-doctor?", a: "No, one subscription covers access to all doctors on the platform." },
];

const FEATURE_LABELS = {
  appointments:     'Appointments',
  prescriptions:    'Prescriptions',
  reminders:        'Reminders',
  chat:             'Doctor Chat',
  ai_chat:          'AI Chat',
  health_updates:   'Health Updates',
  vault:            'Medical Vault',
  analytics:        'Analytics',
  priority_support: 'Priority Support',
  virtual_consults: 'Virtual Consultations',
  whatsapp_delivery:'WhatsApp Delivery',
};

export default function VIPPage() {
  const { user } = useAuth();
  const status = user?.subscriptionStatus || 'none';
  const isActive = status === 'active';

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    getPatientPlans()
      .then(res => setPlans(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafb]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3B82F6]" />
      </div>
    );
  }

  return (
    <>
      {/* ── Main Page (no scroll) ── */}
      <div className="flex-1 flex flex-col gap-6 p-6 bg-[#f8fafb] h-screen overflow-hidden font-['Figtree'] w-full">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-5 border-b border-[#eaedf1] flex-shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-[#253a5a] tracking-tight">VIP Membership</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Unlock premium features and get the most out of your healthcare experience.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* FAQ trigger */}
            <button
              onClick={() => setFaqOpen(true)}
              className="flex items-center gap-1.5 border border-[#eaedf1] bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              <HelpCircle size={13} className="text-[#36565F]" /> FAQ
            </button>
            <div className={`flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full ${
              isActive ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#EFF6FF] text-[#3B82F6]'
            }`}>
              <ShieldCheck size={13} />
              {isActive ? 'Active Member' : 'No Active Plan'}
            </div>
          </div>
        </div>

        {/* ── Status Card ── */}
        <div className="bg-white border border-[#eaedf1] rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-[#ECFDF5]' : 'bg-[#E6F2F5]'}`}>
              <Award size={22} className={isActive ? 'text-[#10B981]' : 'text-[#36565F]'} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#253a5a]">Subscription Status</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isActive
                  ? 'Your VIP benefits are fully active. Enjoy unlimited access.'
                  : 'Subscribe to a plan below to unlock premium features.'}
              </p>
            </div>
          </div>
          <span
            className="text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider flex-shrink-0"
            style={isActive
              ? { background: '#ECFDF5', color: '#10B981' }
              : { background: '#f1f5f9', color: '#64748b' }}
          >
            {status === 'none' ? 'NONE' : status.toUpperCase()}
          </span>
        </div>

        {/* ── Plans Grid ── */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex justify-between items-center flex-shrink-0">
            <h2 className="text-[20px] font-semibold text-[#253a5a]">Available Plans</h2>
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#36565F]">
              <Sparkles size={13} /> Premium Features
            </span>
          </div>

          {plans.length === 0 ? (
            <div className="bg-white border border-[#eaedf1] rounded-[24px] p-12 text-center">
              <p className="text-sm text-slate-500 font-semibold">No subscription plans available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
              {plans.map((plan, idx) => {
                const isPopular = idx === plans.length - 1 && plans.length > 1;
                return (
                  <div
                    key={plan._id}
                    className={`relative bg-white border rounded-[24px] flex flex-col gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] ${
                      isPopular ? 'border-[#253a5a] pt-10 px-6 pb-6' : 'border-[#eaedf1] p-6'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-6">
                        <span className="bg-[#253a5a] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Sparkles size={10} /> Most Popular
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isPopular ? 'bg-[#253a5a]' : 'bg-[#E6F2F5]'}`}>
                          <CreditCard size={14} className={isPopular ? 'text-white' : 'text-[#36565F]'} />
                        </div>
                        <h3 className="text-[16px] font-extrabold text-[#253a5a]">{plan.name}</h3>
                      </div>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-extrabold text-[#253a5a]">₹{plan.price}</span>
                      <span className="text-[13px] text-slate-400 font-semibold mb-1">/{plan.interval}</span>
                    </div>

                    <ul className="flex flex-col gap-2 flex-1">
                      {plan.features?.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-[12px] text-[#253a5a] font-semibold">
                          <div className="w-4 h-4 rounded-full bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                            <Check size={10} className="text-[#10B981]" />
                          </div>
                          {FEATURE_LABELS[feature] || feature.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => { if (!isActive) toast('Contact the clinic to subscribe. Payment integration coming soon.'); }}
                      disabled={isActive}
                      className={`w-full py-3 rounded-xl font-bold text-[13px] transition-all uppercase tracking-wider mt-auto ${
                        isActive
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : isPopular
                            ? 'bg-[#253a5a] hover:bg-[#1a2c44] text-white shadow-sm'
                            : 'border border-[#253a5a] text-[#253a5a] hover:bg-slate-50'
                      }`}
                    >
                      {isActive ? 'Current Plan' : 'Subscribe Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── FAQ Slide-over Drawer ── */}
      {/* Backdrop */}
      <div
        onClick={() => { setFaqOpen(false); setOpenFaq(null); }}
        className={`fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 transition-opacity duration-300 ${faqOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${faqOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eaedf1] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E6F2F5] flex items-center justify-center">
              <HelpCircle size={15} className="text-[#36565F]" />
            </div>
            <h2 className="text-[15px] font-extrabold text-[#253a5a] font-['Figtree']">
              Frequently Asked Questions
            </h2>
          </div>
          <button
            onClick={() => { setFaqOpen(false); setOpenFaq(null); }}
            className="text-slate-400 hover:text-[#253a5a] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* FAQ List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 font-['Figtree']">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-[#eaedf1] rounded-[18px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/70 transition-colors"
              >
                <span className="text-[13px] font-bold text-[#253a5a] pr-3 leading-snug">{faq.q}</span>
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-48' : 'max-h-0'}`}>
                <p className="px-5 pb-4 text-[12px] text-slate-500 font-semibold leading-relaxed border-t border-[#eaedf1] pt-3">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-[#eaedf1] flex-shrink-0">
          <button
            onClick={() => { setFaqOpen(false); setOpenFaq(null); }}
            className="w-full bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-xs py-3 rounded-xl transition-all uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
