const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const adminController = require('../controllers/adminController');
const { ROLES } = require('../config/constants');

const guard = [protect, authorize(ROLES.SUPER_ADMIN), tenantScope];

router.post('/doctors', ...guard, adminController.addDoctor);
router.get('/doctors', ...guard, adminController.getDoctors);
router.get('/doctors/:id', ...guard, adminController.getDoctor);
router.patch('/doctors/:id', ...guard, adminController.updateDoctor);
router.delete('/doctors/:id', ...guard, adminController.deactivateDoctor);
router.get('/stats', ...guard, adminController.getStats);

module.exports = router;
