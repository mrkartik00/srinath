const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { snoozeSchema } = require('../validators/reminderValidator');
const reminderController = require('../controllers/reminderController');
const prescriptionController = require('../controllers/prescriptionController');
const { ROLES } = require('../config/constants');

// Patient: my prescriptions
router.get('/prescriptions', protect, authorize(ROLES.PATIENT), tenantScope, prescriptionController.getMyPrescriptions);

// Patient: download prescription PDF
router.get('/prescriptions/:id/pdf', protect, authorize(ROLES.PATIENT), tenantScope, (req, res, next) => {
  const Prescription = require('../models/Prescription');
  const Patient = require('../models/Patient');
  const fs = require('fs');

  (async () => {
    const patient = await Patient.findOne({ userId: req.user.id, organizationId: req.scope.organizationId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const rx = await Prescription.findOne({ _id: req.params.id, patientId: patient._id });
    if (!rx || !rx.pdfPath) return res.status(404).json({ success: false, message: 'PDF not available' });
    if (!fs.existsSync(rx.pdfPath)) return res.status(404).json({ success: false, message: 'PDF file not found' });
    res.download(rx.pdfPath, `prescription-${rx._id}.pdf`);
  })().catch(next);
});

// Patient: reminders
router.get('/reminders', protect, authorize(ROLES.PATIENT), tenantScope, reminderController.getToday);
router.patch('/reminders/:id/ack', protect, authorize(ROLES.PATIENT), tenantScope, reminderController.acknowledge);
router.patch('/reminders/:id/snooze', protect, authorize(ROLES.PATIENT), tenantScope, validate(snoozeSchema), reminderController.snooze);
router.patch('/reminders/:id/miss', protect, authorize(ROLES.PATIENT), tenantScope, reminderController.miss);

module.exports = router;
