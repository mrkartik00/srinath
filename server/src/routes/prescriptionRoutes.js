const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const { requireEmailVerified } = require('../middleware/gates');
const validate = require('../middleware/validate');
const { createPrescriptionSchema } = require('../validators/prescriptionValidator');
const prescriptionController = require('../controllers/prescriptionController');
const { ROLES } = require('../config/constants');

// Doctor endpoints
router.post('/', protect, requireEmailVerified, authorize(ROLES.DOCTOR), tenantScope, validate(createPrescriptionSchema), prescriptionController.create);
router.get('/', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.SUPER_ADMIN), tenantScope, prescriptionController.getAll);
router.get('/:id', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.SUPER_ADMIN), tenantScope, prescriptionController.getById);
router.patch('/:id/cancel', protect, requireEmailVerified, authorize(ROLES.DOCTOR), tenantScope, prescriptionController.cancel);
router.get('/:id/adherence', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.SUPER_ADMIN), tenantScope, prescriptionController.getAdherence);

// PDF download
router.get('/:id/pdf', protect, requireEmailVerified, tenantScope, (req, res, next) => {
  const Prescription = require('../models/Prescription');
  const storageService = require('../services/storageService');
  Prescription.findById(req.params.id).then(async (rx) => {
    if (!rx || !rx.pdfPath) return res.status(404).json({ success: false, message: 'PDF not found' });
    const sent = await storageService.sendDownload(res, rx.pdfPath, `prescription-${rx._id}.pdf`);
    if (!sent) return res.status(404).json({ success: false, message: 'PDF file missing' });
  }).catch(next);
});

module.exports = router;
