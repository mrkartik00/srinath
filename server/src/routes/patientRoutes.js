const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const { requireEmailVerified } = require('../middleware/gates');
const { createPatientSchema, updatePatientSchema } = require('../validators/patientValidator');
const validate = require('../middleware/validate');
const patientController = require('../controllers/patientController');
const { ROLES } = require('../config/constants');

// Patient self-service
router.post('/', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, validate(createPatientSchema), patientController.create);
router.get('/me', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, patientController.getMyProfile);
router.get('/me/stats', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, patientController.getMyStats);
router.put('/me', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, validate(updatePatientSchema), patientController.updateMyProfile);

// Staff access
router.get('/', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.SUPER_ADMIN), tenantScope, patientController.getAll);
router.get('/:id', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.SUPER_ADMIN), tenantScope, patientController.getById);
router.put('/:id', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.SUPER_ADMIN), tenantScope, validate(updatePatientSchema), patientController.update);
router.delete('/:id', protect, requireEmailVerified, authorize(ROLES.DOCTOR, ROLES.SUPER_ADMIN), tenantScope, patientController.remove);

module.exports = router;
