import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPatientPlans } from '../../api/endpoints/patient';
import '../../styles/home-sections.css';

export default function VipPlansSection() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientPlans()
      .then((res) => {
        if (res && res.data) {
          setPlans(res.data);
        }
      })
      .catch((err) => console.error('Failed to load plans for home page', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="hp-section" style={{ backgroundColor: '#f0f4f8' }}>
        <div className="hp-section__inner">
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-[#36565F] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  if (plans.length === 0) return null;

  return (
    <section className="hp-section" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="hp-section__inner" style={{ paddingBottom: '48px' }}>
        
        {/* Header */}
        <div className="hp-section-header">
          <div className="hp-section-header__left">
            <div className="hp-section-label">
              <span className="hp-section-label__dot" />
              VIP MEMBERSHIP
            </div>
            <h2 className="hp-section-heading" style={{ margin: 0 }}>
              Choose Your Care Plan
            </h2>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-6">
          {plans.map((plan) => {
            const isPremium = plan.name.toLowerCase().includes('premium');
            return (
              <div 
                key={plan._id} 
                className={`bg-white border rounded-3xl p-8 flex flex-col transition-all duration-300 relative ${
                  isPremium 
                    ? 'border-[#36565F] shadow-[0_8px_30px_rgba(54,86,95,0.08)] scale-[1.02]' 
                    : 'border-[#E8E5DE] shadow-sm'
                } hover:shadow-xl hover:-translate-y-1`}
              >
                {isPremium && (
                  <span className="absolute -top-3.5 right-6 bg-[#36565F] text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                    Best Value
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-[#253a5a]">{plan.name}</h3>
                  <p className="text-sm text-[#6B7C84] mt-2 min-h-[40px] leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline">
                  <span className="text-[#36565F] font-extrabold text-4xl">₹{plan.price}</span>
                  <span className="text-[#6B7C84] font-semibold text-sm ml-1">/{plan.interval}</span>
                </div>

                <ul className="space-y-3.5 mb-8 flex-1 border-t border-[#F0EDF6] pt-6">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-[#253a5a] font-medium capitalize">
                      <svg className="w-5 h-5 text-[#4CAF50] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/vip"
                  className={`w-full py-4 rounded-xl font-bold text-sm text-center transition-all duration-200 ${
                    isPremium
                      ? 'bg-[#36565F] text-white hover:bg-[#253F47] shadow-[0_4px_14px_rgba(54,86,95,0.25)] hover:shadow-[0_6px_20px_rgba(54,86,95,0.3)]'
                      : 'bg-[#eaf3f5] text-[#204156] hover:bg-[#dceef2]'
                  }`}
                >
                  Subscribe Now
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
