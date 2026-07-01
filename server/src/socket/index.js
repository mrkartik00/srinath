const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const pushService = require('../services/pushService');
const aiChatService = require('../services/aiChatService');
const logger = require('../config/logger');
const { withOptionalTransaction } = require('../utils/dbUtils');
const { ROLES, CONVERSATION_STATUS } = require('../config/constants');

const onlineUsers = new Map();
const messageCooldowns = new Map(); // userId -> lastMessageTime (rate limiting)

const MESSAGE_RATE_LIMIT_MS = 200; // max 1 message per 200ms per user

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [config.CLIENT_URL, config.ADMIN_URL, config.SUPER_ADMIN_URL, 'http://localhost:8081'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error('User not found'));
      socket.user = { id: user._id.toString(), role: user.role, organizationId: user.organizationId.toString(), name: user.name };
      next();
    } catch { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`Socket connected: ${userId} (${socket.user.role})`);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    socket.join(`user:${userId}`);

    socket.on('conversation:join', async (conversationId) => {
      // Verify user belongs to this conversation and same org
      const conv = await Conversation.findById(conversationId).select('patientId doctorId organizationId').lean();
      if (!conv) return;
      if (conv.organizationId.toString() !== socket.user.organizationId) return;
      const isParticipant = conv.patientId.toString() === userId || conv.doctorId.toString() === userId;
      if (!isParticipant) return;
      socket.join(`conv:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => { socket.leave(`conv:${conversationId}`); });

    socket.on('message:send', async (data) => {
      try {
        const { conversationId, body, type = 'text', idempotencyKey, tempId } = data;
        if (!conversationId || !body?.trim()) return socket.emit('error', { message: 'conversationId and body required' });

        // Rate limiting per user
        const now = Date.now();
        const lastMsg = messageCooldowns.get(userId) || 0;
        if (now - lastMsg < MESSAGE_RATE_LIMIT_MS) {
          return socket.emit('error', { message: 'Rate limit: sending too fast' });
        }
        messageCooldowns.set(userId, now);

        // Idempotency
        if (idempotencyKey) {
          const existing = await Message.findOne({ idempotencyKey });
          if (existing) return socket.emit('message:sent_ack', { messageId: existing._id, conversationId });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return socket.emit('error', { message: 'Conversation not found' });

        // Org check
        if (conversation.organizationId.toString() !== socket.user.organizationId) {
          return socket.emit('error', { message: 'Access denied' });
        }

        const isParticipant = conversation.patientId.toString() === userId || conversation.doctorId.toString() === userId;
        if (!isParticipant) return socket.emit('error', { message: 'Not a participant' });

        const isDoctor = conversation.doctorId.toString() === userId;

        // Atomically assign a race-free sequence and persist the message.
        // The $inc on messageSeq is a single-document atomic operation, so two
        // concurrent sends always receive distinct, gap-free sequence numbers
        // (the previous "read max sequence" approach could hand out duplicates).
        // When a replica set is available, the conversation update + message
        // insert run in one transaction for all-or-nothing consistency.
        const message = await withOptionalTransaction(async (session) => {
          const opts = session ? { session } : {};
          const updatedConv = await Conversation.findByIdAndUpdate(
            conversationId,
            {
              $inc: {
                messageSeq: 1,
                ...(isDoctor ? { unreadByPatient: 1 } : { unreadByDoctor: 1 }),
              },
              $set: {
                lastMessageAt: new Date(),
                lastMessagePreview: body.trim().slice(0, 100),
                ...(conversation.status === 'open' && isDoctor ? { status: 'active' } : {}),
                ...(isDoctor && ['ai_handling', 'escalated', 'open'].includes(conversation.status) ? { status: CONVERSATION_STATUS.DOCTOR_HANDLING } : {}),
              },
            },
            { new: true, select: 'messageSeq', ...opts }
          );

          const [created] = await Message.create(
            [{
              conversationId, senderId: userId, senderRole: socket.user.role,
              body: body.trim(), type, idempotencyKey, sequence: updatedConv.messageSeq,
            }],
            opts
          );
          return created;
        });

        const sequence = message.sequence;
        const populated = await Message.findById(message._id).populate('senderId', 'name role');

        // Emit to conversation room
        io.to(`conv:${conversationId}`).emit('message:new', { message: populated, conversationId });

        // Push notification if recipient is OFFLINE
        const recipientId = isDoctor ? conversation.patientId.toString() : conversation.doctorId.toString();
        if (!onlineUsers.has(recipientId)) {
          pushService.sendChatNotification(recipientId, socket.user.name, body.trim().slice(0, 80), conversationId).catch(() => {});
        } else {
          io.to(`user:${recipientId}`).emit('notification:message', { conversationId, senderName: socket.user.name, preview: body.trim().slice(0, 50) });
        }

        socket.emit('message:sent_ack', { messageId: message._id, conversationId, tempId, sequence });

        // ── AI Chat Triage (Phase 6) ──────────────────────────────────
        // If patient sent message and AI is eligible, process async
        if (socket.user.role === ROLES.PATIENT) {
          const freshConv = await Conversation.findById(conversationId);
          if (freshConv) {
            aiChatService.handlePatientMessage(freshConv, body.trim(), io).catch(err => {
              logger.error('AI triage async error:', err);
            });
          }
        }
      } catch (err) {
        logger.error('Socket message:send error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('messages:read', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        if (conversation.organizationId.toString() !== socket.user.organizationId) return;

        const isDoctor = conversation.doctorId.toString() === userId;
        await Message.updateMany({ conversationId, senderId: { $ne: userId }, readAt: null }, { readAt: new Date() });
        if (isDoctor) await Conversation.findByIdAndUpdate(conversationId, { unreadByDoctor: 0 });
        else await Conversation.findByIdAndUpdate(conversationId, { unreadByPatient: 0 });

        const recipientId = isDoctor ? conversation.patientId.toString() : conversation.doctorId.toString();
        io.to(`user:${recipientId}`).emit('messages:read_receipt', { conversationId, readBy: userId });
      } catch (err) { logger.error('Socket messages:read error:', err); }
    });

    // Typing
    socket.on('typing:start', (conversationId) => { socket.to(`conv:${conversationId}`).emit('typing:indicator', { conversationId, userId, isTyping: true }); });
    socket.on('typing:stop', (conversationId) => { socket.to(`conv:${conversationId}`).emit('typing:indicator', { conversationId, userId, isTyping: false }); });

    // Disconnect
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) { userSockets.delete(socket.id); if (userSockets.size === 0) onlineUsers.delete(userId); }
      messageCooldowns.delete(userId);
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  return io;
};

const isUserOnline = (userId) => onlineUsers.has(userId.toString());

module.exports = { initializeSocket, isUserOnline };
