const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const { createAppointmentSchema, cancelAppointmentSchema, updateAppointmentSchema } = require('../validators/appointmentValidator');
const validate = require('../middleware/validate');
const appointmentController = require('../controllers/appointmentController');
const { ROLES } = require('../config/constants');

router.post('/', protect, authorize(ROLES.PATIENT), tenantScope, validate(createAppointmentSchema), appointmentController.create);
router.get('/my', protect, authorize(ROLES.PATIENT), tenantScope, appointmentController.getByPatient);
router.get('/doctor', protect, authorize(ROLES.DOCTOR), tenantScope, appointmentController.getByDoctor);
router.get('/', protect, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.SUPER_ADMIN), tenantScope, appointmentController.getAll);
router.get('/:id', protect, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.PATIENT, ROLES.SUPER_ADMIN), tenantScope, appointmentController.getById);
router.patch('/:id/cancel', protect, authorize(ROLES.PATIENT, ROLES.DOCTOR), tenantScope, validate(cancelAppointmentSchema), appointmentController.cancel);
router.patch('/:id/complete', protect, authorize(ROLES.DOCTOR), tenantScope, appointmentController.complete);
router.patch('/:id', protect, authorize(ROLES.DOCTOR, ROLES.ASSISTANT), tenantScope, validate(updateAppointmentSchema), appointmentController.update);

module.exports = router;
