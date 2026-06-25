import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const faqs = [
  { q: "What's included?", a: "Unlimited doctor chat, medicine reminders, digital prescriptions, medical vault storage, and AI-powered health tips." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription anytime. You'll retain access until the end of your billing period." },
  { q: "Is it per-doctor?", a: "No, one subscription covers access to all doctors on the platform." },
];

const benefits = ['Chat with doctor', 'Medicine reminders', 'Digital prescriptions', 'Medical vault access', 'AI health tips'];

export default function Subscription() {
  const { user } = useAuth();
  const status = user?.subscriptionStatus || 'none';
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-[#F8F6F0] p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#255946] mb-6">Subscription</h1>

      {/* Status Section */}
      <div className="bg-white border border-[#E8E5DE] rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Current Status</h2>
          {status === 'active' ? (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>
          ) : (
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">{status}</span>
          )}
        </div>
        {status === 'active' && (
          <p className="text-sm text-gray-500 mt-2">Renews on the 1st of next month</p>
        )}
      </div>

      {/* Plan Details */}
      <div className="bg-white border border-[#E8E5DE] rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">SR+ Plan</h2>
          <span className="text-[#255946] font-bold text-lg">₹299/month</span>
        </div>
        <ul className="space-y-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-[#255946] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <div className="mb-5">
        {status === 'active' ? (
          <button
            disabled
            title="Coming soon"
            className="w-full py-3 rounded-xl bg-red-50 text-red-400 font-medium cursor-not-allowed"
          >
            Cancel Subscription
          </button>
        ) : (
          <button
            disabled
            title="Payment integration coming soon"
            className="w-full py-3 rounded-xl bg-[#255946] text-white font-medium opacity-50 cursor-not-allowed"
          >
            Subscribe Now
          </button>
        )}
      </div>

      {/* FAQ */}
      <div className="bg-white border border-[#E8E5DE] rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-3">FAQ</h2>
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-[#E8E5DE] last:border-0">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full text-left py-3 flex justify-between items-center text-sm font-medium text-gray-700"
            >
              {faq.q}
              <span className="text-gray-400">{openFaq === i ? '−' : '+'}</span>
            </button>
            {openFaq === i && <p className="text-sm text-gray-500 pb-3">{faq.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
