const eventBus = require('../eventBus');
const logger = require('../../config/logger');

eventBus.on('prescription.created', ({ prescriptionId, patientId, doctorId }) => {
  logger.info(`Event: prescription.created — ${prescriptionId} for patient ${patientId} by doctor ${doctorId}`);
});

eventBus.on('prescription.cancelled', ({ prescriptionId, patientId }) => {
  logger.info(`Event: prescription.cancelled — ${prescriptionId} for patient ${patientId}`);
});
