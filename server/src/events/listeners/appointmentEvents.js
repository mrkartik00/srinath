const logger = require('../../config/logger');
const eventBus = require('../eventBus');

eventBus.on('appointment.created', ({ appointmentId, patientId, doctorId, dateTime }) => {
  logger.info(`Event: appointment.created — ${appointmentId} at ${dateTime}`);
  // Placeholder: send confirmation SMS/email/push
});

eventBus.on('appointment.cancelled', ({ appointmentId, cancellationReason }) => {
  logger.info(`Event: appointment.cancelled — ${appointmentId}. Reason: ${cancellationReason}`);
  // Placeholder: send cancellation notice
});

eventBus.on('appointment.completed', ({ appointmentId }) => {
  logger.info(`Event: appointment.completed — ${appointmentId}`);
  // Placeholder: trigger review funnel (Phase 6)
});
