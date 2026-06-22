const logger = require('../config/logger');
const DeviceToken = require('../models/DeviceToken');

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens.length) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    const result = await res.json();
    // Deactivate invalid tokens
    if (result.data) {
      result.data.forEach((r, i) => {
        if (r.status === 'error' && r.details?.error === 'DeviceNotRegistered') {
          DeviceToken.findOneAndUpdate({ token: tokens[i] }, { isActive: false }).catch(() => {});
        }
      });
    }
  } catch (err) {
    logger.error('Push notification failed:', err.message);
  }
};

const sendToUser = async (userId, title, body, data = {}) => {
  const devices = await DeviceToken.find({ userId, isActive: true }).select('token');
  const tokens = devices.map((d) => d.token);
  if (tokens.length === 0) {
    logger.info(`[Push] No active devices for ${userId}, skipping`);
    return;
  }
  await sendPushNotification(tokens, title, body, data);
};

const sendReminder = async (patientId, reminder) => {
  await sendToUser(patientId, '💊 Medicine Reminder', `Time to take ${reminder.medicineName} (${reminder.dosage})`, { type: 'reminder', reminderId: reminder._id.toString() });
};

const sendChatNotification = async (recipientId, senderName, preview, conversationId) => {
  await sendToUser(recipientId, `💬 ${senderName}`, preview, { type: 'chat', conversationId });
};

module.exports = { sendToUser, sendReminder, sendChatNotification, sendPushNotification };
