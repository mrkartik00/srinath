/**
 * AI Chat Triage Service (Phase 6)
 *
 * Handles AI-first routing for patient messages:
 * 1. Checks if AI is enabled and conversation is eligible
 * 2. Checks escalation keywords for immediate escalation
 * 3. Builds context (patient info + recent messages)
 * 4. Calls Gemini for response
 * 5. Stores AI response as a message
 * 6. Escalates to doctor if needed
 *
 * ACID: AI messages use the same transaction pattern as regular messages.
 * Failure handling: Any AI failure gracefully falls back to doctor routing.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const AIConfig = require('../models/AIConfig');
const AIUsage = require('../models/AIUsage');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Patient = require('../models/Patient');
const User = require('../models/User');
const logger = require('../config/logger');
const { withOptionalTransaction } = require('../utils/dbUtils');
const { CONVERSATION_STATUS, MESSAGE_SENDER_ROLE } = require('../config/constants');

let genAI = null;

const getGenAI = () => {
  if (genAI) return genAI;
  const apiKey = config.AI.apiKey;
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not set — AI chat disabled');
    return null;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};

/**
 * Check if a message contains escalation keywords.
 */
const containsEscalationKeyword = (text, keywords) => {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
};

/**
 * Get today's start-of-day date for usage tracking.
 */
const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Build context for the AI from patient data and recent messages.
 */
const buildContext = async (conversation, patientUserId) => {
  const parts = [];

  // Patient info
  const patient = await Patient.findOne({ userId: patientUserId }).lean();
  const user = await User.findById(patientUserId).select('name').lean();

  if (user) parts.push(`Patient name: ${user.name}`);
  if (patient) {
    if (patient.gender) parts.push(`Gender: ${patient.gender}`);
    if (patient.bloodGroup) parts.push(`Blood group: ${patient.bloodGroup}`);
    if (patient.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      parts.push(`Age: ${age} years`);
    }
    if (patient.allergies?.length) parts.push(`Allergies: ${patient.allergies.join(', ')}`);
    if (patient.medicalHistory?.length) {
      parts.push(`Medical history: ${patient.medicalHistory.map(h => h.condition).join(', ')}`);
    }
  }

  // Recent messages (last 10) for conversational context
  const recentMessages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('body senderRole createdAt')
    .lean();

  if (recentMessages.length) {
    const history = recentMessages.reverse().map(m => {
      const role = m.senderRole === 'patient' ? 'Patient' : m.senderRole === 'ai' ? 'AI Assistant' : 'Doctor';
      return `${role}: ${m.body}`;
    }).join('\n');
    parts.push(`\nRecent conversation:\n${history}`);
  }

  return parts.join('\n');
};

/**
 * Main entry point: Handle a patient message with AI triage.
 *
 * @param {Object} conversation - Mongoose Conversation document
 * @param {string} messageBody - The patient's message text
 * @param {Object} io - Socket.IO server instance
 * @returns {{ handled: boolean, escalated: boolean }} Whether AI handled the message
 */
const handlePatientMessage = async (conversation, messageBody, io) => {
  try {
    // 1. Check feature flag
    if (!config.FEATURES.aiEnabled) return { handled: false, escalated: false };

    // 2. Get AI config for this org
    const aiConfig = await AIConfig.findOne({ organizationId: conversation.organizationId });
    if (!aiConfig || !aiConfig.isEnabled) return { handled: false, escalated: false };

    // 3. Only handle if conversation is open or ai_handling
    const eligibleStatuses = [CONVERSATION_STATUS.OPEN, CONVERSATION_STATUS.AI_HANDLING];
    if (!eligibleStatuses.includes(conversation.status)) return { handled: false, escalated: false };

    // 4. Check daily message limit
    const today = getToday();
    const usage = await AIUsage.findOne({ patientId: conversation.patientId, date: today });
    if (usage && usage.messagesCount >= aiConfig.maxDailyMessagesPerPatient) {
      // Limit reached — escalate to doctor
      await escalateConversation(conversation, 'Daily AI message limit reached', io);
      return { handled: true, escalated: true };
    }

    // 5. Check escalation keywords in patient message
    if (containsEscalationKeyword(messageBody, aiConfig.escalationKeywords)) {
      await escalateConversation(conversation, `Escalation keyword detected: "${messageBody.slice(0, 50)}"`, io);
      return { handled: true, escalated: true };
    }

    // 6. Call Gemini
    const ai = getGenAI();
    if (!ai) return { handled: false, escalated: false };

    const context = await buildContext(conversation, conversation.patientId);
    const model = ai.getGenerativeModel({ model: aiConfig.model || config.AI.model });

    const prompt = `${aiConfig.systemPrompt}\n\n--- Patient Context ---\n${context}\n\n--- Current Message ---\nPatient: ${messageBody}\n\nRespond helpfully. If this needs a doctor, start your response with [ESCALATE].`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: aiConfig.maxTokensPerResponse,
        temperature: 0.7,
      },
    });

    const responseText = result.response.text().trim();
    if (!responseText) return { handled: false, escalated: false };

    // 7. Check if AI wants to escalate
    const shouldEscalate = responseText.startsWith('[ESCALATE]');
    const cleanResponse = shouldEscalate ? responseText.replace(/^\[ESCALATE\]\s*/i, '') : responseText;

    // 8. Store AI response and update conversation atomically
    await withOptionalTransaction(async (session) => {
      const opts = session ? { session } : {};

      const updatedConv = await Conversation.findByIdAndUpdate(
        conversation._id,
        {
          $inc: { messageSeq: 1, unreadByPatient: 1, aiMessagesCount: 1 },
          $set: {
            lastMessageAt: new Date(),
            lastMessagePreview: cleanResponse.slice(0, 100),
            status: shouldEscalate ? CONVERSATION_STATUS.ESCALATED : CONVERSATION_STATUS.AI_HANDLING,
            ...(shouldEscalate ? { 'metadata.escalatedAt': new Date(), 'metadata.escalationReason': 'AI recommended escalation' } : {}),
          },
        },
        { new: true, select: 'messageSeq', ...opts }
      );

      await Message.create([{
        conversationId: conversation._id,
        senderId: conversation.doctorId, // AI messages appear "from" the doctor's side
        senderRole: MESSAGE_SENDER_ROLE.AI,
        body: cleanResponse,
        type: 'text',
        sequence: updatedConv.messageSeq,
      }], opts);

      // Track usage
      await AIUsage.findOneAndUpdate(
        { patientId: conversation.patientId, date: today },
        {
          $inc: { messagesCount: 1, tokensUsed: result.response.usageMetadata?.totalTokenCount || 0, ...(shouldEscalate ? { escalations: 1 } : {}) },
          $setOnInsert: { conversationId: conversation._id, organizationId: conversation.organizationId },
        },
        { upsert: true, ...opts }
      );
    });

    // 9. Emit AI response via socket
    const aiMessage = await Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1 }).populate('senderId', 'name role').lean();
    io.to(`conv:${conversation._id}`).emit('message:new', { message: aiMessage, conversationId: conversation._id.toString() });

    // 10. If escalated, notify doctor
    if (shouldEscalate) {
      io.to(`user:${conversation.doctorId}`).emit('conversation:escalated', {
        conversationId: conversation._id.toString(),
        reason: 'AI recommended doctor intervention',
        patientMessage: messageBody.slice(0, 100),
      });
    }

    return { handled: true, escalated: shouldEscalate };
  } catch (err) {
    logger.error('AI chat service error:', err);
    // On any failure, don't block — let the message go to doctor normally
    return { handled: false, escalated: false };
  }
};

/**
 * Escalate a conversation to the doctor.
 */
const escalateConversation = async (conversation, reason, io) => {
  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: {
      status: CONVERSATION_STATUS.ESCALATED,
      'metadata.escalatedAt': new Date(),
      'metadata.escalationReason': reason,
    },
  });

  // Notify doctor
  io.to(`user:${conversation.doctorId}`).emit('conversation:escalated', {
    conversationId: conversation._id.toString(),
    reason,
  });
};

module.exports = { handlePatientMessage };
