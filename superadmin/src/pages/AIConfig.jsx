import { useState } from 'react';
import toast from 'react-hot-toast';

const Toggle = ({ checked, label, red }) => (
  <label className="flex items-center gap-3 cursor-not-allowed">
    <div className={`w-11 h-6 rounded-full relative ${checked ? (red ? 'bg-red-600' : 'bg-blue-600') : 'bg-gray-600'}`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} />
    </div>
    <span className="text-white text-sm">{label}</span>
  </label>
);

export default function AIConfig() {
  const [config] = useState({
    aiEnabled: false,
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 1024,
    maxDailyTokens: 10000,
    systemPrompt: 'You are a helpful medical AI assistant. Provide general health information only. Always recommend consulting a doctor for specific medical advice. Never diagnose conditions or prescribe medications.',
    escalationKeywords: ['emergency', 'chest pain', 'bleeding', 'suicide', 'overdose'],
    killSwitch: false,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-yellow-900/40 border border-yellow-500/30 rounded-lg p-3 text-yellow-200 text-sm">
        ⚠️ AI features are not yet active. Configuration will take effect once the AI service is deployed.
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">AI Configuration</h1>
        <Toggle checked={config.aiEnabled} label="AI Enabled" />
      </div>

      {/* Provider */}
      <section className="bg-[#1e293b] border border-white/10 rounded-lg p-5 space-y-4">
        <h2 className="text-white font-semibold">Provider</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/60 text-sm">Provider</label>
            <select disabled value={config.provider} className="w-full mt-1 bg-gray-700 text-white/50 border border-white/10 rounded px-3 py-2 cursor-not-allowed">
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
          <div>
            <label className="text-white/60 text-sm">Model</label>
            <input disabled value={config.model} className="w-full mt-1 bg-gray-700 text-white/50 border border-white/10 rounded px-3 py-2 cursor-not-allowed" />
          </div>
        </div>
      </section>

      {/* Limits */}
      <section className="bg-[#1e293b] border border-white/10 rounded-lg p-5 space-y-4">
        <h2 className="text-white font-semibold">Limits</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/60 text-sm">Max tokens per response</label>
            <input disabled type="number" value={config.maxTokens} className="w-full mt-1 bg-gray-700 text-white/50 border border-white/10 rounded px-3 py-2 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-white/60 text-sm">Max daily tokens per patient</label>
            <input disabled type="number" value={config.maxDailyTokens} className="w-full mt-1 bg-gray-700 text-white/50 border border-white/10 rounded px-3 py-2 cursor-not-allowed" />
          </div>
        </div>
      </section>

      {/* System Prompt */}
      <section className="bg-[#1e293b] border border-white/10 rounded-lg p-5 space-y-4">
        <h2 className="text-white font-semibold">System Prompt</h2>
        <textarea disabled value={config.systemPrompt} rows={4} className="w-full bg-gray-700 text-white/50 border border-white/10 rounded px-3 py-2 resize-none cursor-not-allowed" />
      </section>

      {/* Escalation Keywords */}
      <section className="bg-[#1e293b] border border-white/10 rounded-lg p-5 space-y-4">
        <h2 className="text-white font-semibold">Escalation Keywords</h2>
        <div className="flex flex-wrap gap-2">
          {config.escalationKeywords.map((kw) => (
            <span key={kw} className="bg-red-900/40 border border-red-500/30 text-red-200 px-3 py-1 rounded-full text-sm">{kw}</span>
          ))}
        </div>
        <p className="text-white/40 text-xs">Messages containing these keywords will trigger immediate escalation to a human.</p>
      </section>

      {/* Kill Switch */}
      <section className="bg-red-950/30 border border-red-500/20 rounded-lg p-5 space-y-3">
        <h2 className="text-red-300 font-semibold">Kill Switch</h2>
        <Toggle checked={config.killSwitch} label="Disable AI Globally" red />
        <p className="text-red-300/60 text-xs">⚠️ Enabling this will immediately stop all AI responses across the platform.</p>
      </section>

      {/* Save */}
      <div className="flex justify-end" title="AI service not yet deployed">
        <button disabled className="bg-blue-600/50 text-white/50 px-6 py-2 rounded-lg cursor-not-allowed">
          Save Configuration
        </button>
      </div>
    </div>
  );
}
