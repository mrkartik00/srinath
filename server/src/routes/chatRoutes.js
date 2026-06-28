const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const { requireActiveSubscription, requireEmailVerified } = require('../middleware/gates');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const DoctorPatient = require('../models/DoctorPatient');
const { ROLES, DOCTOR_PATIENT_STATUS } = require('../config/constants');

router.get('/conversations', protect, requireEmailVerified, tenantScope, requireActiveSubscription, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const filter = { organizationId: req.scope.organizationId };
  if (req.user.role === ROLES.DOCTOR) filter.doctorId = userId;
  else if (req.user.role === ROLES.PATIENT) filter.patientId = userId;
  else return apiResponse.success(res, [], 'No conversations');

  const conversations = await Conversation.find(filter).sort({ lastMessageAt: -1 }).populate('patientId', 'name email').populate('doctorId', 'name email').lean();
  apiResponse.success(res, conversations, 'Conversations fetched');
}));

router.post('/conversations', protect, requireEmailVerified, tenantScope, requireActiveSubscription, asyncHandler(async (req, res) => {
  const { doctorId } = req.body;
  const patientId = req.user.role === ROLES.PATIENT ? req.user.id : req.body.patientId;
  const docId = req.user.role === ROLES.DOCTOR ? req.user.id : doctorId;

  let conversation = await Conversation.findOneAndUpdate(
    { patientId, doctorId: docId, organizationId: req.scope.organizationId },
    { $setOnInsert: { patientId, doctorId: docId, organizationId: req.scope.organizationId, metadata: { startedBy: req.user.role } } },
    { upsert: true, new: true }
  ).populate('patientId', 'name email').populate('doctorId', 'name email');

  await DoctorPatient.findOneAndUpdate({ doctorId: docId, patientId, organizationId: req.scope.organizationId }, { status: DOCTOR_PATIENT_STATUS.ACTIVE }, { upsert: true });
  apiResponse.success(res, conversation, 'Conversation ready');
}));

router.get('/conversations/:id/messages', protect, requireEmailVerified, tenantScope, requireActiveSubscription, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ success: false, message: 'Not found' });

  const isParticipant = conversation.patientId.toString() === req.user.id.toString() || conversation.doctorId.toString() === req.user.id.toString();
  if (!isParticipant && req.user.role !== ROLES.SUPER_ADMIN) return res.status(403).json({ success: false, message: 'Forbidden' });

  const { before, limit = 50 } = req.query;
  const filter = { conversationId: req.params.id };
  if (before) filter.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(Math.min(+limit, 100)).populate('senderId', 'name role').lean();
  apiResponse.success(res, messages.reverse(), 'Messages fetched');
}));

router.patch('/conversations/:id/resolve', protect, requireEmailVerified, tenantScope, requireActiveSubscription, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, doctorId: req.user.id });
  if (!conversation) return res.status(404).json({ success: false, message: 'Not found' });
  conversation.status = 'resolved';
  conversation.metadata.resolvedAt = new Date();
  conversation.metadata.resolvedBy = req.user.id;
  await conversation.save();
  apiResponse.success(res, conversation, 'Conversation resolved');
}));

module.exports = router;
