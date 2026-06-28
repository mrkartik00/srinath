const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const { requireActiveSubscription, requireEmailVerified } = require('../middleware/gates');
const validate = require('../middleware/validate');
const { snoozeSchema } = require('../validators/reminderValidator');
const reminderController = require('../controllers/reminderController');
const prescriptionController = require('../controllers/prescriptionController');
const { ROLES } = require('../config/constants');

// Patient: my prescriptions
router.get('/prescriptions', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, requireActiveSubscription, prescriptionController.getMyPrescriptions);

// Patient: download prescription PDF
router.get('/prescriptions/:id/pdf', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, requireActiveSubscription, (req, res, next) => {
  const Prescription = require('../models/Prescription');
  const Patient = require('../models/Patient');
  const storageService = require('../services/storageService');

  (async () => {
    const patient = await Patient.findOne({ userId: req.user.id, organizationId: req.scope.organizationId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const rx = await Prescription.findOne({ _id: req.params.id, patientId: patient._id });
    if (!rx || !rx.pdfPath) return res.status(404).json({ success: false, message: 'PDF not available' });
    const sent = await storageService.sendDownload(res, rx.pdfPath, `prescription-${rx._id}.pdf`);
    if (!sent) return res.status(404).json({ success: false, message: 'PDF file not found' });
  })().catch(next);
});

// Patient: reminders
router.get('/reminders', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, requireActiveSubscription, reminderController.getToday);
router.patch('/reminders/:id/ack', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, requireActiveSubscription, reminderController.acknowledge);
router.patch('/reminders/:id/snooze', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, requireActiveSubscription, validate(snoozeSchema), reminderController.snooze);
router.patch('/reminders/:id/miss', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, requireActiveSubscription, reminderController.miss);

module.exports = router;
