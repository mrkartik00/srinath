const mongoose = require('mongoose');

const aiConfigSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
  provider: { type: String, enum: ['gemini'], default: 'gemini' },
  model: { type: String, default: 'gemini-1.5-flash' },
  systemPrompt: {
    type: String,
    default: `You are a helpful medical assistant for Janki Care clinic. Your role is to:
- Answer general health questions with accurate, helpful information
- Help patients understand their symptoms in simple terms
- Provide first-aid and self-care guidance for minor issues
- Remind patients about medication adherence and healthy habits

STRICT RULES:
- NEVER diagnose conditions or diseases
- NEVER prescribe medications or dosages
- NEVER contradict a doctor's advice
- If the patient describes a serious/emergency symptom, respond with [ESCALATE] at the start of your message
- If the patient explicitly asks to speak with a doctor, respond with [ESCALATE]
- Keep responses concise (under 200 words)
- Be empathetic and professional
- When unsure, escalate to the doctor

Escalation triggers: chest pain, difficulty breathing, severe bleeding, loss of consciousness, suicidal thoughts, allergic reaction, high fever above 103°F/39.5°C, sudden numbness, severe abdominal pain.`
  },
  maxTokensPerResponse: { type: Number, default: 1024 },
  maxDailyMessagesPerPatient: { type: Number, default: 50 },
  escalationKeywords: {
    type: [String],
    default: ['emergency', 'chest pain', 'can\'t breathe', 'suicide', 'bleeding heavily', 'unconscious', 'severe pain', 'talk to doctor', 'speak to doctor', 'real doctor'],
  },
  isEnabled: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('AIConfig', aiConfigSchema);
