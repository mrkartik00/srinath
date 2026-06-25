import { useAuth } from '../context/AuthContext';

const tips = [
  { category: '🥗 Nutrition', title: 'Stay Hydrated', body: 'Drink at least 8 glasses of water daily to maintain optimal body function and energy levels.', date: 'Today' },
  { category: '🏃 Exercise', title: 'Morning Walks', body: 'A 20-minute morning walk can boost your mood and improve cardiovascular health.', date: 'Yesterday' },
  { category: '💊 Medication', title: 'Consistent Timing', body: 'Take medications at the same time daily for best effectiveness and fewer missed doses.', date: 'Jun 20' },
  { category: '🧘 Lifestyle', title: 'Sleep Hygiene', body: 'Maintain a consistent sleep schedule — aim for 7-8 hours every night.', date: 'Jun 19' },
];

export default function HealthFeed() {
  const { user } = useAuth();
  const isActive = user?.subscriptionStatus === 'active';

  return (
    <div className="min-h-screen bg-[#F8F6F0] p-6 relative">
      {!isActive && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center p-8">
            <span className="text-4xl">🔒</span>
            <p className="mt-3 text-lg font-semibold text-[#255946]">Subscribe to access personalized health tips</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#255946]">Health Feed</h1>
        <p className="text-gray-500 mt-1 mb-6">Personalized health tips based on your medical profile</p>

        {/* Today's Tip */}
        <div className="bg-white border border-[#E8E5DE] rounded-xl p-5 mb-6 shadow-sm">
          <span className="text-xs font-medium bg-green-100 text-[#255946] px-2 py-1 rounded-full">🥗 Nutrition — Today's Tip</span>
          <h2 className="text-lg font-semibold mt-3 text-gray-900">Stay Hydrated</h2>
          <p className="text-gray-600 mt-1 text-sm">Drink at least 8 glasses of water daily to maintain optimal body function and energy levels. Proper hydration supports digestion, skin health, and cognitive performance.</p>
        </div>

        {/* Past Tips */}
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Past Tips</h3>
        <div className="space-y-3">
          {tips.slice(1).map((tip, i) => (
            <div key={i} className="bg-white border border-[#E8E5DE] rounded-lg p-4 flex justify-between items-start">
              <div>
                <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{tip.category}</span>
                <h4 className="font-medium text-gray-900 mt-2">{tip.title}</h4>
                <p className="text-gray-500 text-sm mt-0.5">{tip.body}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{tip.date}</span>
            </div>
          ))}
        </div>

        {/* Powered by AI */}
        <div className="text-center mt-8">
          <span className="text-xs bg-[#255946] text-white px-3 py-1 rounded-full">✨ Powered by AI</span>
        </div>
      </div>
    </div>
  );
}
