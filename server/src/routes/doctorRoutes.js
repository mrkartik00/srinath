const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const doctorController = require('../controllers/doctorController');
const { ROLES } = require('../config/constants');

const guard = [protect, authorize(ROLES.DOCTOR), tenantScope];

router.get('/patients', ...guard, doctorController.getMyPatients);
router.post('/patients', ...guard, doctorController.addPatient);
router.get('/profile', ...guard, doctorController.getMyProfile);
router.patch('/profile', ...guard, doctorController.updateMyProfile);

module.exports = router;
