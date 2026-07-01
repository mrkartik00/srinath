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
const { ROLES, DOCTOR_PATIENT_STATUS, MESSAGE_TYPE } = require('../config/constants');
const { withOptionalTransaction } = require('../utils/dbUtils');
const multer = require('multer');
const multerS3 = require('multer-s3');
const crypto = require('crypto');
const path = require('path');
const spaces = require('../config/spaces');

// ── Chat file upload config ──────────────────────────────────────────────────
const CHAT_ALLOWED_MIMES = [
  'application/pdf', 'image/jpeg', 'image/jpg', 'image/png',
  'image/webp', 'application/dicom',
];
const CHAT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const chatUploadStorage = () => {
  const client = spaces.getClient();
  if (!client) return multer.memoryStorage(); // fallback
  return multerS3({
    s3: client,
    bucket: spaces.bucket,
    acl: 'private',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.bin';
      const key = `janki-chat/${req.user.organizationId}/${req.params.id}/${crypto.randomUUID()}${ext}`;
      cb(null, key);
    },
  });
};

const chatUpload = multer({
  storage: chatUploadStorage(),
  fileFilter: (req, file, cb) => {
    if (CHAT_ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG, WebP, and DICOM files are allowed'), false);
  },
  limits: { fileSize: CHAT_MAX_FILE_SIZE },
});

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

// ── File upload in chat ──────────────────────────────────────────────────────
// POST /chat/conversations/:id/upload — Send a file (medical report, image, etc.)
router.post('/conversations/:id/upload', protect, requireEmailVerified, tenantScope, requireActiveSubscription, chatUpload.single('file'), asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return apiResponse.error(res, 'Conversation not found', 404);

  if (conversation.organizationId.toString() !== req.user.organizationId.toString()) {
    return apiResponse.error(res, 'Access denied', 403);
  }

  const isParticipant = conversation.patientId.toString() === req.user.id || conversation.doctorId.toString() === req.user.id;
  if (!isParticipant) return apiResponse.error(res, 'Not a participant', 403);

  const file = req.file;
  if (!file) return apiResponse.error(res, 'No file uploaded', 400);

  const isDoctor = conversation.doctorId.toString() === req.user.id;
  const fileKey = file.key || file.filename;
  const fileUrl = file.location || null;
  const isImage = file.mimetype.startsWith('image/');

  // Create message with attachment atomically
  const message = await withOptionalTransaction(async (session) => {
    const opts = session ? { session } : {};

    const updatedConv = await Conversation.findByIdAndUpdate(
      conversation._id,
      {
        $inc: {
          messageSeq: 1,
          ...(isDoctor ? { unreadByPatient: 1 } : { unreadByDoctor: 1 }),
        },
        $set: {
          lastMessageAt: new Date(),
          lastMessagePreview: `📎 ${file.originalname}`,
        },
      },
      { new: true, select: 'messageSeq', ...opts }
    );

    const [created] = await Message.create([{
      conversationId: conversation._id,
      senderId: req.user.id,
      senderRole: req.user.role,
      body: req.body.caption || `Sent a ${isImage ? 'photo' : 'document'}: ${file.originalname}`,
      type: isImage ? MESSAGE_TYPE.IMAGE : MESSAGE_TYPE.DOCUMENT,
      sequence: updatedConv.messageSeq,
      attachments: [{
        fileKey,
        fileUrl,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      }],
    }], opts);

    return created;
  });

  const populated = await Message.findById(message._id).populate('senderId', 'name role');
  apiResponse.success(res, populated, 'File sent', {}, 201);
}));

// ── Get download URL for chat attachment ─────────────────────────────────────
router.get('/attachments/:messageId/download', protect, requireEmailVerified, tenantScope, asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message || !message.attachments?.length) return apiResponse.error(res, 'Not found', 404);

  const conversation = await Conversation.findById(message.conversationId);
  if (!conversation) return apiResponse.error(res, 'Not found', 404);

  const isParticipant = conversation.patientId.toString() === req.user.id || conversation.doctorId.toString() === req.user.id;
  if (!isParticipant && req.user.role !== ROLES.SUPER_ADMIN) return apiResponse.error(res, 'Access denied', 403);

  const attachment = message.attachments[0];
  try {
    const url = await spaces.getPresignedDownloadUrl(attachment.fileKey);
    apiResponse.success(res, { url, fileName: attachment.fileName, mimeType: attachment.mimeType }, 'Download URL generated');
  } catch {
    apiResponse.error(res, 'File not accessible', 500);
  }
}));

module.exports = router;
