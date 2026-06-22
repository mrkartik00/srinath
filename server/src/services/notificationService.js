const logger = require('../config/logger');

const sendAppointmentConfirmation = (data) => {
  logger.info(`[Notification] Appointment confirmation: ${JSON.stringify(data)}`);
  // Placeholder: integrate SMS/email/push
};

const sendCancellationNotice = (data) => {
  logger.info(`[Notification] Cancellation notice: ${JSON.stringify(data)}`);
  // Placeholder: integrate SMS/email/push
};

module.exports = { sendAppointmentConfirmation, sendCancellationNotice };
