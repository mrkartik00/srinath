import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPatientPlans } from '../../api/endpoints/patient';
import { Spinner } from '../../components/ui';

const faqs = [
  { q: "What's included?", a: "Unlimited doctor chat, medicine reminders, digital prescriptions, medical vault storage, and AI-powered health tips." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription anytime. You'll retain access until the end of your billing period." },
  { q: "Is it per-doctor?", a: "No, one subscription covers access to all doctors on the platform." },
];

export default function VIPPage() {
  const { user } = useAuth();
  const status = user?.subscriptionStatus || 'none';
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    getPatientPlans()
      .then(res => setPlans(res.data))
      .catch(err => console.error("Failed to load plans", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="bg-[#f0f4f8] min-h-screen">
      <div className="max-w-4xl mx-auto w-full p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-[#36565F] mb-6">VIP Membership</h1>

        {/* Status Section */}
        <div className="bg-white border border-[#E8E5DE] rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#253a5a]">Current Status</h2>
            {status === 'active' ? (
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Active</span>
            ) : (
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">{status}</span>
            )}
          </div>
          {status === 'active' && (
            <p className="text-sm text-[#6B7C84] mt-2">Your VIP benefits are fully active.</p>
          )}
        </div>

        {/* Dynamic Plans */}
        <h2 className="text-xl font-bold text-[#36565F] mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-white border border-[#E8E5DE] rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#253a5a]">{plan.name}</h3>
                <p className="text-sm text-[#6B7C84] mt-1 min-h-[40px]">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-[#36565F] font-bold text-3xl">₹{plan.price}</span>
                <span className="text-[#6B7C84] font-medium">/{plan.interval}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#253a5a] font-medium capitalize">
                    <svg className="w-5 h-5 text-[#4CAF50] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature.replace('_', ' ')}
                  </li>
                ))}
              </ul>

              <button
                disabled={status === 'active'}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all focus:outline-none ${status === 'active'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#36565F] text-white hover:bg-[#253F47] shadow-[0_4px_14px_rgba(54,86,95,0.25)] hover:shadow-[0_6px_20px_rgba(54,86,95,0.3)] hover:-translate-y-0.5'
                  }`}
              >
                {status === 'active' ? 'Current Plan' : 'Subscribe Now'}
              </button>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-full text-center py-10 bg-white border border-[#E8E5DE] rounded-2xl">
              <p className="text-[#6B7C84]">No subscription plans available at the moment.</p>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <h2 className="text-xl font-bold text-[#36565F] mb-4">Frequently Asked Questions</h2>
        <div className="bg-white border border-[#E8E5DE] rounded-2xl p-2 shadow-sm">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-[#E8E5DE]/50 last:border-0 px-4">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left py-4 flex justify-between items-center text-[15px] font-bold text-[#253a5a] focus:outline-none"
              >
                {faq.q}
                <span className={`text-[#6B7C84] transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                <p className="text-sm text-[#6B7C84] font-medium leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
