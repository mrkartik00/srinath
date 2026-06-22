const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const { createPatientSchema, updatePatientSchema } = require('../validators/patientValidator');
const validate = require('../middleware/validate');
const patientController = require('../controllers/patientController');
const { ROLES } = require('../config/constants');

// Patient self-service
router.post('/', protect, authorize(ROLES.PATIENT), tenantScope, validate(createPatientSchema), patientController.create);
router.get('/me', protect, authorize(ROLES.PATIENT), tenantScope, patientController.getMyProfile);
router.get('/me/stats', protect, authorize(ROLES.PATIENT), tenantScope, patientController.getMyStats);
router.put('/me', protect, authorize(ROLES.PATIENT), tenantScope, validate(updatePatientSchema), patientController.updateMyProfile);

// Staff access
router.get('/', protect, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.SUPER_ADMIN), tenantScope, patientController.getAll);
router.get('/:id', protect, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.SUPER_ADMIN), tenantScope, patientController.getById);
router.put('/:id', protect, authorize(ROLES.DOCTOR, ROLES.ASSISTANT, ROLES.SUPER_ADMIN), tenantScope, validate(updatePatientSchema), patientController.update);
router.delete('/:id', protect, authorize(ROLES.DOCTOR, ROLES.SUPER_ADMIN), tenantScope, patientController.remove);

module.exports = router;
