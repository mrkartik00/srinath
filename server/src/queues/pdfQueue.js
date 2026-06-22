const { Worker } = require('bullmq');
const { connection } = require('./index');
const Prescription = require('../models/Prescription');
const DoctorProfile = require('../models/DoctorProfile');
const pdfService = require('../services/pdfService');
const logger = require('../config/logger');

const processPdf = async (job) => {
  const { prescriptionId } = job.data;
  const prescription = await Prescription.findById(prescriptionId)
    .populate('doctorId', 'name email')
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } });

  if (!prescription) return;

  const doctorProfile = await DoctorProfile.findOne({ userId: prescription.doctorId._id });
  const pdfPath = await pdfService.generatePrescriptionPdf(prescription, doctorProfile);
  prescription.pdfPath = pdfPath;
  await prescription.save();
  logger.info(`PDF generated for prescription ${prescriptionId}`);
};

let worker;
const startWorker = () => {
  worker = new Worker('prescription-pdf', processPdf, { connection, concurrency: 3 });
  worker.on('failed', (job, err) => logger.error(`PDF job ${job.id} failed:`, err.message));
  logger.info('PDF queue worker started');
  return worker;
};

module.exports = { startWorker };
