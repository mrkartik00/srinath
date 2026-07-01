const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', version: '2.0.0' }, meta: {} });
});

router.use('/auth', require('./authRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/superadmin', require('./superadminRoutes'));
router.use('/doctor', require('./doctorRoutes'));
router.use('/patients', require('./patientRoutes'));
router.use('/appointments', require('./appointmentRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/prescriptions', require('./prescriptionRoutes'));
router.use('/my', require('./myRoutes'));
router.use('/config', require('./configRoutes'));
router.use('/chat', require('./chatRoutes'));
router.use('/devices', require('./deviceRoutes'));
router.use('/vault', require('./vaultRoutes'));

module.exports = router;
