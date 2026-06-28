const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const { requireEmailVerified } = require('../middleware/gates');
const { createAppointmentSchema, cancelAppointmentSchema, updateAppointmentSchema } = require('../validators/appointmentValidator');
const validate = require('../middleware/validate');
const appointmentController = require('../controllers/appointmentController');
const { ROLES } = require('../config/constants');

router.post('/', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, validate(createAppointmentSchema), appointmentController.create);
router.get('/my', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, appointmentController.getByPatient);
router.get('/doctor', protect, requireEmailVerified, authorize(ROLES.DOCTOR), tenantScope, appointmentController.getByDoctor);
router.get('/', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.SUPER_ADMIN), tenantScope, appointmentController.getAll);
router.get('/:id', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.PATIENT, ROLES.SUPER_ADMIN), tenantScope, appointmentController.getById);
router.patch('/:id/cancel', protect, requireEmailVerified, authorize(ROLES.PATIENT, ROLES.DOCTOR), tenantScope, validate(cancelAppointmentSchema), appointmentController.cancel);
router.patch('/:id/complete', protect, requireEmailVerified, authorize(ROLES.DOCTOR), tenantScope, appointmentController.complete);
router.patch('/:id', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.ASSISTANT), tenantScope, validate(updateAppointmentSchema), appointmentController.update);

module.exports = router;
