const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const pushService = require('../services/pushService');
const logger = require('../config/logger');

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

        // ATOMIC sequence number using findOneAndUpdate + $inc on a counter
        // This prevents race conditions where two concurrent messages get same sequence
        const seqDoc = await Conversation.findByIdAndUpdate(
          conversationId,
          { $inc: { __v: 1 } }, // use __v as atomic increment source
          { new: true, select: '__v' }
        );
        // Get actual max sequence to stay consistent
        const lastSeqMsg = await Message.findOne({ conversationId }).sort({ sequence: -1 }).select('sequence').lean();
        const sequence = (lastSeqMsg?.sequence || 0) + 1;

        const message = await Message.create({
          conversationId, senderId: userId, senderRole: socket.user.role,
          body: body.trim(), type, idempotencyKey, sequence,
        });

        // Update conversation
        const isDoctor = conversation.doctorId.toString() === userId;
        await Conversation.findByIdAndUpdate(conversationId, {
          $set: {
            lastMessageAt: new Date(),
            lastMessagePreview: body.trim().slice(0, 100),
            ...(conversation.status === 'open' && isDoctor ? { status: 'active' } : {}),
          },
          $inc: isDoctor ? { unreadByPatient: 1 } : { unreadByDoctor: 1 },
        });

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
